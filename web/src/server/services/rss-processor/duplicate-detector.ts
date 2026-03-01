import { type DataProvider } from '@/lib/data';
import { type TransactionInput } from '@/lib/data/types';
import { type LlmClient } from './llm-client';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function isDuplicate(
  candidate: TransactionInput,
  provider: DataProvider,
  llm: LlmClient
): Promise<boolean> {
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
    return false;
  }

  // Step 2: Ask Claude to determine if it's a duplicate
  const prompt = `You are checking whether a new NFL transaction is a duplicate of an existing one.

## New transaction (candidate)
${JSON.stringify(candidate, null, 2)}

## Transactions in the database within 1 day of the candidate date (same type and overlapping teams)
${JSON.stringify(nearbyMatches, null, 2)}

Is the new candidate a duplicate of any existing transaction?
A duplicate means: same player or staff member, same team(s), same transaction type, same approximate event.

Respond with ONLY one word: DUPLICATE or NEW`;

  try {
    const message = await llm.createMessage({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return false;

    return (content.text ?? '').trim().toUpperCase().startsWith('DUPLICATE');
  } catch (err) {
    console.error('isDuplicate LLM error:', err);
    // On error, assume not duplicate to avoid blocking new transactions
    return false;
  }
}
