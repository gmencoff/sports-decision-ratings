import { vi } from 'vitest';
import { DataProvider } from '@/lib/data';
import { Transaction } from '@/lib/data/types';

export function createMockDataProvider(overrides: Partial<DataProvider> = {}): DataProvider {
  return {
    getTransactions: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getTransaction: vi.fn().mockResolvedValue(null),
    addTransaction: vi.fn().mockImplementation((tx: Transaction) => Promise.resolve(tx)),
    editTransaction: vi.fn().mockImplementation((id: string, tx: Transaction) => Promise.resolve({ ...tx, id })),
    getVoteCounts: vi.fn().mockResolvedValue({ good: 0, bad: 0, unsure: 0 }),
    getUserVote: vi.fn().mockResolvedValue(null),
    submitVote: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'trade',
    teams: [
      { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC', division: 'East' },
      { id: 'team-2', name: 'Team B', abbreviation: 'TB', conference: 'NFC', division: 'West' },
    ],
    timestamp: new Date('2024-01-15'),
    assets: [],
    ...overrides,
  } as Transaction;
}
