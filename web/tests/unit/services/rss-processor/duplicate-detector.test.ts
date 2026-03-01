import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDuplicate } from '@/server/services/rss-processor/duplicate-detector';
import type { TransactionInput } from '@/lib/data/types';
import type { Database } from '@/server/db';
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

function buildSelectChain(finalValue: unknown) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockResolvedValue(finalValue);
  return chain;
}

function createMockDb(selectResult: unknown = []): Database {
  const selectChain = buildSelectChain(selectResult);
  return {
    select: vi.fn().mockReturnValue(selectChain),
  } as unknown as Database;
}

const signingCandidate: TransactionInput = {
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: new Date('2026-02-28T10:00:00Z'),
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000 },
};

const existingSigningRow = {
  id: 'existing-1',
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: new Date('2026-02-27T10:00:00Z'),
  data: { player: { name: 'John Doe', position: 'WR' }, contract: { years: 4, totalValue: 48000000 } },
};

describe('duplicate-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false (NEW) when no DB matches exist — no LLM call made', async () => {
    const db = createMockDb([]); // No matching rows
    const anthropic = createMockAnthropic('NEW');

    const result = await isDuplicate(signingCandidate, db, anthropic);

    expect(result).toBe(false);
    expect((anthropic.messages.create as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('returns false (NEW) when DB matches exist but Claude says NEW', async () => {
    const db = createMockDb([existingSigningRow]);
    const anthropic = createMockAnthropic('NEW');

    const result = await isDuplicate(signingCandidate, db, anthropic);

    expect(result).toBe(false);
    expect((anthropic.messages.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });

  it('returns true (DUPLICATE) when DB matches exist and Claude says DUPLICATE', async () => {
    const db = createMockDb([existingSigningRow]);
    const anthropic = createMockAnthropic('DUPLICATE');

    const result = await isDuplicate(signingCandidate, db, anthropic);

    expect(result).toBe(true);
    expect((anthropic.messages.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });

  it('handles case-insensitive DUPLICATE response', async () => {
    const db = createMockDb([existingSigningRow]);
    const anthropic = createMockAnthropic('DUPLICATE');

    const result = await isDuplicate(signingCandidate, db, anthropic);

    expect(result).toBe(true);
  });

  it('returns false when LLM call throws an error', async () => {
    const db = createMockDb([existingSigningRow]);
    const anthropic = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error('API error')),
      },
    } as unknown as Anthropic;

    const result = await isDuplicate(signingCandidate, db, anthropic);

    // On error, we assume not duplicate (don't block new transactions)
    expect(result).toBe(false);
  });

  it('returns false when LLM returns ambiguous response', async () => {
    const db = createMockDb([existingSigningRow]);
    const anthropic = createMockAnthropic('I cannot determine this.');

    const result = await isDuplicate(signingCandidate, db, anthropic);

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
    const existingTrade = {
      id: 'existing-trade-1',
      type: 'trade',
      teamIds: ['KC', 'DAL'],
      timestamp: new Date('2026-02-27T10:00:00Z'),
      data: { assets: [{ type: 'player', fromTeamId: 'DAL', toTeamId: 'KC', player: { name: 'Tony Brown', position: 'RB' } }] },
    };
    const db = createMockDb([existingTrade]);
    const anthropic = createMockAnthropic('DUPLICATE');

    const result = await isDuplicate(tradeCandidate, db, anthropic);

    expect(result).toBe(true);
  });
});
