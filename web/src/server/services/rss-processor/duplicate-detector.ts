import { z } from 'zod';
import { type DataProvider } from '@/lib/data';
import {
  TransactionSchema,
  TradeSchema,
  SigningSchema,
  DraftSelectionSchema,
  ReleaseSchema,
  ExtensionSchema,
  HireSchema,
  FireSchema,
  PromotionSchema,
  type TransactionInput,
} from '@/lib/data/types';
import { visitByType, type TransactionVisitor } from '@/lib/transactions/visitor';
import { type LlmClient } from './llm-client';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Returns the specific Zod schema for the candidate's transaction type/subtype.
// z.date() has no native JSON Schema equivalent, so we override it to
// { type: "string", format: "date-time" } — matching what the LLM produces.
function buildJsonSchema(schema: z.ZodTypeAny): string {
  return JSON.stringify(
    z.toJSONSchema(schema, {
      unrepresentable: 'any',
      override: (ctx) => {
        if ((ctx.zodSchema as { _zod?: { def?: { type?: string } } })._zod?.def?.type === 'date') {
          const json = ctx.jsonSchema as Record<string, unknown>;
          json.type = 'string';
          json.format = 'date-time';
        }
      },
    }),
    null,
    2
  );
}

// Using the visitor pattern ensures TypeScript will error here if a new
// transaction type is added to TransactionVisitor without updating this map.
const schemaByType: TransactionVisitor<z.ZodTypeAny> = {
  visitTrade: () => TradeSchema,
  visitSigning: () => SigningSchema,
  visitDraft: () => DraftSelectionSchema,
  visitRelease: () => ReleaseSchema,
  visitExtension: () => ExtensionSchema,
  visitHire: () => HireSchema,
  visitFire: () => FireSchema,
  visitPromotion: () => PromotionSchema,
};

function getSchemaForCandidate(candidate: TransactionInput): z.ZodTypeAny {
  return visitByType(candidate.type, schemaByType);
}

// Preprocess timestamps from ISO strings to Date objects before validating
const LlmTransactionSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'object' || val === null) return val;
    const v = val as Record<string, unknown>;
    return {
      ...v,
      timestamp: typeof v.timestamp === 'string' ? new Date(v.timestamp) : v.timestamp,
    };
  },
  TransactionSchema
);

const DuplicateCheckResponseSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('new') }),
  z.object({ action: z.literal('duplicate'), existingTransactionId: z.string() }),
  z.object({
    action: z.literal('update'),
    existingTransactionId: z.string(),
    updatedTransaction: LlmTransactionSchema,
  }),
]);

export type DuplicateCheckResult = z.infer<typeof DuplicateCheckResponseSchema>;

export async function checkDuplicate(
  candidate: TransactionInput,
  provider: DataProvider,
  llm: LlmClient
): Promise<DuplicateCheckResult> {
  const from = new Date(candidate.timestamp.getTime() - ONE_DAY_MS);
  const to = new Date(candidate.timestamp.getTime() + ONE_DAY_MS);

  // Step 1: Query transactions within 1 day on either side of the candidate date
  const nearbyMatches = await provider.getTransactionsInDateRange(
    candidate.type,
    candidate.teamIds,
    from,
    to
  );

  if (nearbyMatches.length === 0) {
    return { action: 'new' };
  }

  const transactionJsonSchema = buildJsonSchema(getSchemaForCandidate(candidate));

  // Step 2: Ask Claude to classify the candidate against existing transactions
  const prompt = `You are checking whether a new NFL transaction is a duplicate of an existing one.

## Transaction JSON Schema (${candidate.type})
${transactionJsonSchema}

## New transaction (candidate)
${JSON.stringify(candidate, null, 2)}

## Transactions in the database within 1 day of the candidate date (same type and overlapping teams)
${JSON.stringify(nearbyMatches, null, 2)}

## Instructions
A duplicate means: same player or staff member, same team(s), same transaction type, same approximate event.

Return ONLY a valid JSON object matching exactly one of these three shapes:

1. The candidate is NOT a duplicate of any existing transaction:
{ "action": "new" }

2. The candidate IS a duplicate and the existing record is already complete/accurate:
{ "action": "duplicate", "existingTransactionId": "<id of the matching transaction>" }

3. The candidate IS a duplicate but the existing record should be updated with new or more complete information from the candidate:
{
  "action": "update",
  "existingTransactionId": "<id of the matching transaction>",
  "updatedTransaction": <complete updated transaction object matching the schema above, including the existing id field and all improved fields>
}

Only choose "update" if the candidate genuinely provides new or more complete information that improves the existing record.`;

  try {
    const message = await llm.createMessage({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text' || !content.text) return { action: 'new' };

    const rawText = content.text.trim();

    // Extract JSON object from response (may be wrapped in markdown code blocks)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse duplicate check LLM response as JSON:', rawText.slice(0, 200));
      return { action: 'new' };
    }

    const validation = DuplicateCheckResponseSchema.safeParse(parsed);
    if (!validation.success) {
      console.error('Duplicate check LLM output failed Zod validation:', validation.error.issues.slice(0, 3));
      return { action: 'new' };
    }

    return validation.data;
  } catch (err) {
    console.error('checkDuplicate LLM error:', err);
    // On error, assume not duplicate to avoid blocking new transactions
    return { action: 'new' };
  }
}
