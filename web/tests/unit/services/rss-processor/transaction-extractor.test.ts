import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTransactions } from '@/server/services/rss-processor/transaction-extractor';
import type { RssItem } from '@/lib/data';
import type { LlmClient } from '@/server/services/rss-processor/llm-client';
import { visitByType, allTransactionTypes, type TransactionVisitor } from '@/lib/transactions/visitor';

function createMockLlmClient(responseText: string): LlmClient {
  return {
    createMessage: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: responseText }],
    }),
  };
}

const mockItem: RssItem = {
  guid: 'test-guid-1',
  source: 'espn',
  title: 'Bills sign wide receiver John Doe to 4-year deal',
  description: 'The Buffalo Bills have officially signed WR John Doe to a 4-year, $48M contract.',
  link: 'https://espn.com/nfl/story/1',
  pubDate: new Date('2026-02-28T10:00:00Z'),
};

const signingTransaction = {
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: '2026-02-28T10:00:00.000Z',
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000, guaranteed: 28000000 },
};

const tradeTransaction = {
  type: 'trade',
  teamIds: ['KC', 'DAL'],
  timestamp: '2026-02-28T10:00:00.000Z',
  assets: [
    { type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } },
    { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'DAL', draftPick: { ogTeamId: 'KC', year: 2027, round: 2 } },
  ],
};

const validSigningResponse = JSON.stringify({
  reasoning: 'The article confirms a signing.',
  transactions: [signingTransaction],
});

const validTradeResponse = JSON.stringify({
  reasoning: 'The article confirms a trade.',
  transactions: [tradeTransaction],
});

describe('transaction-extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed TransactionInput array for valid JSON signing', async () => {
    const llm = createMockLlmClient(validSigningResponse);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('signing');
    expect(result.transactions[0].teamIds).toEqual(['BUF']);
    expect(result.transactions[0].timestamp).toBeInstanceOf(Date);
  });

  it('returns reasoning string', async () => {
    const llm = createMockLlmClient(validSigningResponse);

    const result = await extractTransactions(mockItem, llm);

    expect(result.reasoning).toBe('The article confirms a signing.');
  });

  it('returns parsed TransactionInput array for valid JSON trade', async () => {
    const llm = createMockLlmClient(validTradeResponse);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('trade');
    expect(result.transactions[0].teamIds).toEqual(['KC', 'DAL']);
  });

  it('returns empty transactions when LLM returns empty transactions array', async () => {
    const llm = createMockLlmClient(JSON.stringify({ reasoning: 'No confirmed transactions.', transactions: [] }));

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
    expect(result.reasoning).toBe('No confirmed transactions.');
  });

  it('returns empty result when LLM returns bare []', async () => {
    const llm = createMockLlmClient('[]');

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
    expect(result.reasoning).toBe('');
  });

  it('returns empty result when LLM returns rumor/no transactions explanation', async () => {
    const llm = createMockLlmClient('This article contains only rumors, no confirmed transactions.');

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('returns empty result for invalid JSON', async () => {
    const llm = createMockLlmClient('{ invalid json }');

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('returns empty result when Zod validation fails (invalid position)', async () => {
    const badJson = JSON.stringify({
      reasoning: 'Signing with invalid position.',
      transactions: [{
        type: 'signing',
        teamIds: ['BUF'],
        timestamp: '2026-02-28T10:00:00.000Z',
        player: { name: 'John Doe', position: 'INVALID_POS' },
        contract: {},
      }],
    });
    const llm = createMockLlmClient(badJson);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('returns empty result when Zod validation fails (invalid team ID)', async () => {
    const badJson = JSON.stringify({
      reasoning: 'Signing with invalid team.',
      transactions: [{
        type: 'signing',
        teamIds: ['INVALID_TEAM'],
        timestamp: '2026-02-28T10:00:00.000Z',
        player: { name: 'John Doe', position: 'WR' },
        contract: {},
      }],
    });
    const llm = createMockLlmClient(badJson);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('strips markdown code blocks from LLM response', async () => {
    const wrappedJson = `\`\`\`json\n${validSigningResponse}\n\`\`\``;
    const llm = createMockLlmClient(wrappedJson);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('signing');
  });

  it('returns empty result when llm.createMessage throws', async () => {
    const llm: LlmClient = {
      createMessage: vi.fn().mockRejectedValue(new Error('API error')),
    };

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('returns empty result when LLM returns non-text content', async () => {
    const llm: LlmClient = {
      createMessage: vi.fn().mockResolvedValue({
        content: [{ type: 'tool_use' }],
      }),
    };

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toEqual([]);
  });

  it('sets timestamp from the LLM output converted to Date', async () => {
    const llm = createMockLlmClient(validSigningResponse);

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions[0].timestamp).toBeInstanceOf(Date);
    expect(result.transactions[0].timestamp.toISOString()).toBe('2026-02-28T10:00:00.000Z');
  });
});

// One valid LLM output object per transaction type.
// visitExtension covers the player subtype; staff extension has its own test below.
// If a new type is added to TransactionVisitor, TypeScript will require a new entry here.
const llmFixtureVisitor: TransactionVisitor<object> = {
  visitTrade: () => ({
    type: 'trade',
    teamIds: ['KC', 'DAL'],
    timestamp: '2026-02-28T10:00:00.000Z',
    assets: [
      { type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } },
      { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'DAL', draftPick: { ogTeamId: 'KC', year: 2027, round: 2 } },
    ],
  }),
  visitSigning: () => ({
    type: 'signing',
    teamIds: ['BUF'],
    timestamp: '2026-02-28T10:00:00.000Z',
    player: { name: 'John Doe', position: 'WR' },
    contract: { years: 4, totalValue: 48000000, guaranteed: 28000000 },
  }),
  visitDraft: () => ({
    type: 'draft',
    teamIds: ['SEA'],
    timestamp: '2026-02-28T10:00:00.000Z',
    player: { name: 'Michael Smith', position: 'QB' },
    draftPick: { ogTeamId: 'SEA', year: 2026, round: 1, number: 5 },
  }),
  visitRelease: () => ({
    type: 'release',
    teamIds: ['NE'],
    timestamp: '2026-02-28T10:00:00.000Z',
    player: { name: 'Tom Veteran', position: 'LB' },
    capSavings: 8000000,
  }),
  visitExtension: () => ({
    type: 'extension',
    subtype: 'player',
    teamIds: ['GB'],
    timestamp: '2026-02-28T10:00:00.000Z',
    player: { name: 'Aaron Star', position: 'QB' },
    contract: { years: 3, totalValue: 150000000, guaranteed: 90000000 },
  }),
  visitHire: () => ({
    type: 'hire',
    teamIds: ['MIA'],
    timestamp: '2026-02-28T10:00:00.000Z',
    staff: { name: 'Mike New', role: 'Offensive Coordinator' },
    contract: { years: 3, totalValue: 15000000 },
  }),
  visitFire: () => ({
    type: 'fire',
    teamIds: ['CLE'],
    timestamp: '2026-02-28T10:00:00.000Z',
    staff: { name: 'Fired Coach', role: 'Head Coach' },
  }),
  visitPromotion: () => ({
    type: 'promotion',
    teamIds: ['DAL'],
    timestamp: '2026-02-28T10:00:00.000Z',
    staff: { name: 'Rising Coach', role: 'Offensive Coordinator' },
    previousRole: 'Quarterbacks Coach',
    contract: { years: 2, totalValue: 10000000 },
  }),
};

describe('parses all transaction types through the full pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const type of allTransactionTypes()) {
    it(`round-trips a ${type} through preprocess → TransactionSchema → id strip`, async () => {
      const fixture = visitByType(type, llmFixtureVisitor);
      const llm = createMockLlmClient(JSON.stringify({ reasoning: `Confirmed ${type}.`, transactions: [fixture] }));

      const result = await extractTransactions(mockItem, llm);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe(type);
      expect(result.transactions[0].timestamp).toBeInstanceOf(Date);
      expect((result.transactions[0] as Record<string, unknown>).id).toBeUndefined();
    });
  }

  it('round-trips a staff extension through preprocess → TransactionSchema → id strip', async () => {
    const fixture = {
      type: 'extension',
      subtype: 'staff',
      teamIds: ['SF'],
      timestamp: '2026-02-28T10:00:00.000Z',
      staff: { name: 'Kyle Head', role: 'Head Coach' },
      contract: { years: 4, totalValue: 40000000 },
    };
    const llm = createMockLlmClient(JSON.stringify({ reasoning: 'Confirmed staff extension.', transactions: [fixture] }));

    const result = await extractTransactions(mockItem, llm);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('extension');
    if (result.transactions[0].type === 'extension') {
      expect(result.transactions[0].subtype).toBe('staff');
    }
    expect((result.transactions[0] as Record<string, unknown>).id).toBeUndefined();
  });
});
