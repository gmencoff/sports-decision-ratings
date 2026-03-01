import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTransactions } from '@/server/services/rss-processor/transaction-extractor';
import type { RssItem } from '@/server/services/rss-processor/feed-fetcher';
import type Anthropic from '@anthropic-ai/sdk';

function createMockAnthropic(responseText: string): Anthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: responseText }],
      }),
    },
  } as unknown as Anthropic;
}

const mockItem: RssItem = {
  guid: 'test-guid-1',
  source: 'espn',
  title: 'Bills sign wide receiver John Doe to 4-year deal',
  description: 'The Buffalo Bills have officially signed WR John Doe to a 4-year, $48M contract.',
  link: 'https://espn.com/nfl/story/1',
  pubDate: new Date('2026-02-28T10:00:00Z'),
};

const validSigningJson = JSON.stringify([{
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: '2026-02-28T10:00:00.000Z',
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000, guaranteed: 28000000 },
}]);

const validTradeJson = JSON.stringify([{
  type: 'trade',
  teamIds: ['KC', 'DAL'],
  timestamp: '2026-02-28T10:00:00.000Z',
  assets: [
    { type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } },
    { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'DAL', draftPick: { ogTeamId: 'KC', year: 2027, round: 2 } },
  ],
}]);

describe('transaction-extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed TransactionInput array for valid JSON signing', async () => {
    const anthropic = createMockAnthropic(validSigningJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('signing');
    expect(result[0].teamIds).toEqual(['BUF']);
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });

  it('returns parsed TransactionInput array for valid JSON trade', async () => {
    const anthropic = createMockAnthropic(validTradeJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('trade');
    expect(result[0].teamIds).toEqual(['KC', 'DAL']);
  });

  it('returns empty array when LLM returns []', async () => {
    const anthropic = createMockAnthropic('[]');

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('returns empty array when LLM returns rumor/no transactions explanation', async () => {
    const anthropic = createMockAnthropic('This article contains only rumors, no confirmed transactions.');

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('returns empty array for invalid JSON', async () => {
    const anthropic = createMockAnthropic('{ invalid json }');

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('returns empty array when Zod validation fails (invalid position)', async () => {
    const badJson = JSON.stringify([{
      type: 'signing',
      teamIds: ['BUF'],
      timestamp: '2026-02-28T10:00:00.000Z',
      player: { name: 'John Doe', position: 'INVALID_POS' },
      contract: {},
    }]);
    const anthropic = createMockAnthropic(badJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('returns empty array when Zod validation fails (invalid team ID)', async () => {
    const badJson = JSON.stringify([{
      type: 'signing',
      teamIds: ['INVALID_TEAM'],
      timestamp: '2026-02-28T10:00:00.000Z',
      player: { name: 'John Doe', position: 'WR' },
      contract: {},
    }]);
    const anthropic = createMockAnthropic(badJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('strips markdown code blocks from LLM response', async () => {
    const wrappedJson = `\`\`\`json\n${validSigningJson}\n\`\`\``;
    const anthropic = createMockAnthropic(wrappedJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('signing');
  });

  it('returns empty array when anthropic.messages.create throws', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error('API error')),
      },
    } as unknown as Anthropic;

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('returns empty array when LLM returns non-text content', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'tool_use', id: 'tool-1', name: 'tool', input: {} }],
        }),
      },
    } as unknown as Anthropic;

    const result = await extractTransactions(mockItem, anthropic);

    expect(result).toEqual([]);
  });

  it('sets timestamp from the LLM output converted to Date', async () => {
    const anthropic = createMockAnthropic(validSigningJson);

    const result = await extractTransactions(mockItem, anthropic);

    expect(result[0].timestamp).toBeInstanceOf(Date);
    expect(result[0].timestamp.toISOString()).toBe('2026-02-28T10:00:00.000Z');
  });
});
