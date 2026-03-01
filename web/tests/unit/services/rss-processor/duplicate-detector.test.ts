import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDuplicate } from '@/server/services/rss-processor/duplicate-detector';
import type { TransactionInput, Transaction } from '@/lib/data/types';
import type { DataProvider } from '@/lib/data';
import type { LlmClient } from '@/server/services/rss-processor/llm-client';
import { createMockDataProvider } from '../../../mocks/mockDataProvider';

function createMockLlmClient(responseText: string): LlmClient {
  return {
    createMessage: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: responseText }],
    }),
  };
}

const signingCandidate: TransactionInput = {
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: new Date('2026-02-28T10:00:00Z'),
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000 },
};

const existingTransaction: Transaction = {
  id: 'existing-1',
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: new Date('2026-02-27T10:00:00Z'),
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000 },
};

describe('duplicate-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false (NEW) when no recent transactions match — no LLM call made', async () => {
    const provider = createMockDataProvider(); // getTransactionsInDateRange returns []
    const llm = createMockLlmClient('NEW');

    const result = await isDuplicate(signingCandidate, provider, llm);

    expect(result).toBe(false);
    expect(llm.createMessage as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('returns false (NEW) when matches exist but Claude says NEW', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient('NEW');

    const result = await isDuplicate(signingCandidate, provider, llm);

    expect(result).toBe(false);
    expect(llm.createMessage as ReturnType<typeof vi.fn>).toHaveBeenCalledOnce();
  });

  it('returns true (DUPLICATE) when matches exist and Claude says DUPLICATE', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient('DUPLICATE');

    const result = await isDuplicate(signingCandidate, provider, llm);

    expect(result).toBe(true);
    expect(llm.createMessage as ReturnType<typeof vi.fn>).toHaveBeenCalledOnce();
  });

  it('handles case-insensitive DUPLICATE response', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient('DUPLICATE');

    const result = await isDuplicate(signingCandidate, provider, llm);

    expect(result).toBe(true);
  });

  it('returns false when LLM call throws an error', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm: LlmClient = {
      createMessage: vi.fn().mockRejectedValue(new Error('API error')),
    };

    const result = await isDuplicate(signingCandidate, provider, llm);

    // On error, we assume not duplicate (don't block new transactions)
    expect(result).toBe(false);
  });

  it('returns false when LLM returns ambiguous response', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient('I cannot determine this.');

    const result = await isDuplicate(signingCandidate, provider, llm);

    expect(result).toBe(false);
  });

  it('handles trade candidate with overlapping teams', async () => {
    const tradeCandidate: TransactionInput = {
      type: 'trade',
      teamIds: ['KC', 'DAL'],
      timestamp: new Date('2026-02-28T10:00:00Z'),
      assets: [
        { type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } },
      ],
    };
    const existingTrade: Transaction = {
      id: 'existing-trade-1',
      type: 'trade',
      teamIds: ['KC', 'DAL'],
      timestamp: new Date('2026-02-27T10:00:00Z'),
      assets: [{ type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } }],
    };
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTrade]),
    });
    const llm = createMockLlmClient('DUPLICATE');

    const result = await isDuplicate(tradeCandidate, provider, llm);

    expect(result).toBe(true);
  });
});
