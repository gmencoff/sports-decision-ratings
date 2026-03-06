import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDuplicate } from '@/server/services/rss-processor/duplicate-detector';
import type { TransactionInput, Transaction } from '@/lib/data/types';
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

  it('returns { action: "new" } when no recent transactions match — no LLM call made', async () => {
    const provider = createMockDataProvider(); // getTransactionsInDateRange returns []
    const llm = createMockLlmClient('{"action":"new"}');

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result).toEqual({ action: 'new' });
    expect(llm.createMessage as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('returns { action: "new" } when matches exist but LLM says new', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient(JSON.stringify({ action: 'new' }));

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result).toEqual({ action: 'new' });
    expect(llm.createMessage as ReturnType<typeof vi.fn>).toHaveBeenCalledOnce();
  });

  it('returns { action: "duplicate" } when LLM identifies a duplicate', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient(JSON.stringify({ action: 'duplicate', existingTransactionId: 'existing-1' }));

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result).toEqual({ action: 'duplicate', existingTransactionId: 'existing-1' });
    expect(llm.createMessage as ReturnType<typeof vi.fn>).toHaveBeenCalledOnce();
  });

  it('returns { action: "update" } with updated transaction when LLM identifies an enrichable duplicate', async () => {
    const updatedTransaction = {
      ...existingTransaction,
      timestamp: existingTransaction.timestamp.toISOString(),
      contract: { years: 4, totalValue: 50000000 },
    };
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient(JSON.stringify({
      action: 'update',
      existingTransactionId: 'existing-1',
      updatedTransaction,
    }));

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result.action).toBe('update');
    if (result.action === 'update') {
      expect(result.existingTransactionId).toBe('existing-1');
      expect(result.updatedTransaction.type).toBe('signing');
      expect(result.updatedTransaction.timestamp).toBeInstanceOf(Date);
    }
  });

  it('returns { action: "new" } when LLM call throws an error', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm: LlmClient = {
      createMessage: vi.fn().mockRejectedValue(new Error('API error')),
    };

    const result = await checkDuplicate(signingCandidate, provider, llm);

    // On error, assume not duplicate to avoid blocking new transactions
    expect(result).toEqual({ action: 'new' });
  });

  it('returns { action: "new" } when LLM returns invalid JSON', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient('I cannot determine this.');

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result).toEqual({ action: 'new' });
  });

  it('returns { action: "new" } when LLM returns JSON that fails Zod validation', async () => {
    const provider = createMockDataProvider({
      getTransactionsInDateRange: vi.fn().mockResolvedValue([existingTransaction]),
    });
    const llm = createMockLlmClient(JSON.stringify({ action: 'unknown_action' }));

    const result = await checkDuplicate(signingCandidate, provider, llm);

    expect(result).toEqual({ action: 'new' });
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
    const llm = createMockLlmClient(JSON.stringify({ action: 'duplicate', existingTransactionId: 'existing-trade-1' }));

    const result = await checkDuplicate(tradeCandidate, provider, llm);

    expect(result).toEqual({ action: 'duplicate', existingTransactionId: 'existing-trade-1' });
  });
});
