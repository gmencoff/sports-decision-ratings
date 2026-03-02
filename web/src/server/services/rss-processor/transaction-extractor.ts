import { z } from 'zod';
import { TransactionSchema, type TransactionInput } from '@/lib/data/types';
import { NFL_TEAMS } from '@/lib/data/types';
import { type RssItem } from '@/lib/data';
import { type LlmClient } from './llm-client';

// Preprocess each item to inject a placeholder id and coerce the ISO timestamp
// string to a Date, then validate against the canonical TransactionSchema.
// This means new transaction types are automatically supported.
const LlmTransactionArraySchema = z.preprocess(
  (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map((item) => {
      if (typeof item !== 'object' || item === null) return item;
      const i = item as Record<string, unknown>;
      return {
        ...i,
        id: '__llm_placeholder__',
        timestamp: typeof i.timestamp === 'string' ? new Date(i.timestamp) : i.timestamp,
      };
    });
  },
  z.array(TransactionSchema)
);

// Schema for the full LLM response object, which includes reasoning alongside transactions.
const LlmResponseSchema = z.object({
  reasoning: z.string(),
  transactions: LlmTransactionArraySchema,
});

export type ExtractionResult = {
  transactions: TransactionInput[];
  reasoning: string;
};

const EMPTY_RESULT: ExtractionResult = { transactions: [], reasoning: '' };

const TEAM_MAP_TEXT = NFL_TEAMS.map((t) => `${t.id}: ${t.name}`).join('\n');

// Derived directly from TransactionSchema so it stays in sync automatically.
// z.date() has no native JSON Schema equivalent, so we override it to
// { type: "string", format: "date-time" } — matching what the LLM produces.
const TRANSACTION_JSON_SCHEMA = JSON.stringify(
  z.toJSONSchema(TransactionSchema, {
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

export async function extractTransactions(
  item: RssItem,
  llm: LlmClient
): Promise<ExtractionResult> {

  const prompt = `You are an NFL transaction parser. Extract only CONFIRMED transactions — not rumors, speculation, or unverified reports.

## NFL Team IDs
${TEAM_MAP_TEXT}

## Transaction JSON Schema
${TRANSACTION_JSON_SCHEMA}

## Article
Title: ${item.title}
Published: ${item.pubDate.toISOString()}
Description: ${item.description}

## Instructions
- Return ONLY a valid JSON object with exactly two fields:
  - "reasoning": a string explaining which transactions were included or excluded and why
  - "transactions": an array of transaction objects matching the schema above
- Set timestamp to the article's published date: ${item.pubDate.toISOString()}
- Do NOT include an "id" field — it is generated server-side
- Money values are in dollars (e.g. 10000000 for $10M)
- Use an empty "transactions" array if the article contains no confirmed transactions, only rumors/speculation, or is not about NFL roster/staff moves
- Only include transactions you are highly confident about
- Before omitting a transaction due to missing details, verify those details are actually required by the schema — many fields (e.g. contract sub-fields) are optional and should be omitted or left as {} rather than used as a reason to skip the transaction`;

  try {
    const message = await llm.createMessage({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text' || !content.text) return EMPTY_RESULT;

    const rawText = content.text.trim();

    // Extract JSON object from response (may be wrapped in markdown code blocks)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse LLM response as JSON:', rawText.slice(0, 200));
      return EMPTY_RESULT;
    }

    const validation = LlmResponseSchema.safeParse(parsed);
    if (!validation.success) {
      console.error('LLM output failed Zod validation:', validation.error.issues.slice(0, 3));
      return EMPTY_RESULT;
    }

    const { reasoning } = validation.data;

    // Strip the placeholder id — TransactionInput is Transaction without id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const transactions = validation.data.transactions.map(({ id: _, ...rest }) => rest) as TransactionInput[];

    return { transactions, reasoning };
  } catch (err) {
    console.error('extractTransactions error:', err);
    return EMPTY_RESULT;
  }
}
