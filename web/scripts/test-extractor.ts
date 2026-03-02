/**
 * Manual smoke test for transaction-extractor using a real Anthropic API call.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/test-extractor.ts
 *
 * Or if you have a .env.local file:
 *   npx dotenv -e .env.local -- npx tsx scripts/test-extractor.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { extractTransactions } from '../src/server/services/rss-processor/transaction-extractor';
import type { LlmClient } from '../src/server/services/rss-processor/llm-client';
import type { RssItem } from '../src/lib/data';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

const llmClient: LlmClient = {
  createMessage(params) {
    return anthropic.messages.create({
      model: params.model,
      max_tokens: params.max_tokens,
      messages: params.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
  },
};

// Sample article examples

const sampleItem1: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Bills sign wide receiver Amari Cooper to 2-year deal',
  description:
    'The Buffalo Bills have officially signed wide receiver Amari Cooper to a 2-year, $32 million contract with $20 million guaranteed, the team announced Monday.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem2: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Bills considering signing receiver Amari Cooper',
  description:
    'The Buffalo Bills are considering signing wide receiver Amari Cooper.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem3: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Bills signing receiver Amari Cooper',
  description:
    'The Buffalo Bills have officially signed wide receiver Amari Cooper.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem4: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Falcons signing Caleb Williams',
  description:
    'The Atlanta Falcons have officially signed Caleb Williams to their roster.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem5: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Falcons signing multiple players',
  description:
    'The Atlanta Falcons have officially signed WRs Amari Cooper and Odell Beckham Jr. to their roster.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem6: RssItem = {
  guid: 'test-extractor-1',
  source: 'espn',
  title: 'Bears Draft DT',
  description:
    'The Chicago Bears have drafted a defensive tackle Jesse Omewe in the first round.',
  link: 'https://espn.com/nfl/story/test',
  pubDate: new Date(),
};

const sampleItem = sampleItem6; // Change this to test different articles

async function main() {
  console.log('Article:', sampleItem.title);
  console.log('---');

  const { transactions, reasoning } = await extractTransactions(sampleItem, llmClient);

  console.log('Reasoning:', reasoning);
  console.log('---');

  if (transactions.length === 0) {
    console.log('No transactions extracted.');
  } else {
    console.log(`Extracted ${transactions.length} transaction(s):\n`);
    for (const txn of transactions) {
      console.log(JSON.stringify(txn, null, 2));
      console.log('---');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
