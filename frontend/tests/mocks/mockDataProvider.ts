import { vi } from 'vitest';
import { DataProvider } from '@/lib/data';
import { Transaction, PaginatedResult, VoteCounts, Sentiment, Vote } from '@/lib/data/types';

export function createMockDataProvider(overrides: Partial<DataProvider> = {}): DataProvider {
  return {
    getTransactions: vi.fn<[number?, string?], Promise<PaginatedResult<Transaction>>>()
      .mockResolvedValue({ data: [], hasMore: false }),
    getTransaction: vi.fn<[string], Promise<Transaction | null>>()
      .mockResolvedValue(null),
    getVoteCounts: vi.fn<[string, string], Promise<VoteCounts>>()
      .mockResolvedValue({ good: 0, bad: 0, unsure: 0 }),
    getUserVote: vi.fn<[string, string, string], Promise<Sentiment | null>>()
      .mockResolvedValue(null),
    submitVote: vi.fn<[Vote], Promise<void>>()
      .mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'trade',
    title: 'Test Transaction',
    description: 'A test transaction',
    teams: [
      { id: 'team-1', name: 'Team A', abbreviation: 'TA' },
      { id: 'team-2', name: 'Team B', abbreviation: 'TB' },
    ],
    timestamp: new Date('2024-01-15'),
    assets: [],
    ...overrides,
  } as Transaction;
}
