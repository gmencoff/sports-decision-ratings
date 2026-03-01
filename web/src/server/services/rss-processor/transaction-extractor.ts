import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { TransactionSchema, type TransactionInput } from '@/lib/data/types';
import { NFL_TEAMS } from '@/lib/data/types';
import { type RssItem } from './feed-fetcher';

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
  anthropic: Anthropic
): Promise<TransactionInput[]> {
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
- Return ONLY a valid JSON array of transaction objects matching the schema above
- Set timestamp to the article's published date: ${item.pubDate.toISOString()}
- Do NOT include an "id" field — it is generated server-side
- Money values are in dollars (e.g. 10000000 for $10M)
- Return [] if the article contains no confirmed transactions, only rumors/speculation, or is not about NFL roster/staff moves
- Only include transactions you are highly confident about`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const rawText = content.text.trim();

    // Extract JSON array from response (may be wrapped in markdown code blocks)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\[[\s\S]*\])/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse LLM response as JSON:', rawText.slice(0, 200));
      return [];
    }

    const validation = LlmTransactionArraySchema.safeParse(parsed);
    if (!validation.success) {
      console.error('LLM output failed Zod validation:', validation.error.issues.slice(0, 3));
      return [];
    }

    // Strip the placeholder id — TransactionInput is Transaction without id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return validation.data.map(({ id: _, ...rest }) => rest) as TransactionInput[];
  } catch (err) {
    console.error('extractTransactions error:', err);
    return [];
  }
}
