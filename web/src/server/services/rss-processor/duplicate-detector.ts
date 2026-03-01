import Anthropic from '@anthropic-ai/sdk';
import { gte, and, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { type Database } from '@/server/db';
import { transactions } from '@/server/db/schema';
import { type TransactionInput } from '@/lib/data/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function isDuplicate(
  candidate: TransactionInput,
  db: Database,
  anthropic: Anthropic
): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

  // Step 1: Query DB for recent transactions with same type and overlapping teamIds
  const recentMatches = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, candidate.type),
        gte(transactions.timestamp, sevenDaysAgo),
        sql`${transactions.teamIds} && ${candidate.teamIds}`
      )
    );

  if (recentMatches.length === 0) {
    return false;
  }

  // Step 2: Ask Claude to determine if it's a duplicate
  const prompt = `You are checking whether a new NFL transaction is a duplicate of an existing one.

## New transaction (candidate)
${JSON.stringify(candidate, null, 2)}

## Recent transactions in the database (last 7 days, same type and overlapping teams)
${JSON.stringify(recentMatches.map((r) => ({ ...r.data, type: r.type, teamIds: r.teamIds, timestamp: r.timestamp })), null, 2)}

Is the new candidate a duplicate of any existing transaction?
A duplicate means: same player or staff member, same team(s), same transaction type, same approximate event.

Respond with ONLY one word: DUPLICATE or NEW`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return false;

    return content.text.trim().toUpperCase().startsWith('DUPLICATE');
  } catch (err) {
    console.error('isDuplicate LLM error:', err);
    // On error, assume not duplicate to avoid blocking new transactions
    return false;
  }
}
