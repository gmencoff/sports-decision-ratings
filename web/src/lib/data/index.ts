import { Transaction, Vote, VoteCounts, PaginatedResult, Sentiment } from './types';

export interface DataProvider {
  getTransactions(limit?: number, cursor?: string): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: string): Promise<Transaction | null>;
  addTransaction(transaction: Transaction): Promise<Transaction>;
  editTransaction(id: string, transaction: Transaction): Promise<Transaction | null>;
  getVoteCounts(transactionId: string, teamId: string): Promise<VoteCounts>;
  getUserVote(transactionId: string, teamId: string, userId: string): Promise<Sentiment | null>;
  submitVote(vote: Vote): Promise<void>;
}

// Factory function to get the data provider
// This makes it easy to swap implementations (mock, test, production)
let providerInstance: DataProvider | null = null;

export async function getDataProvider(): Promise<DataProvider> {
  if (!providerInstance) {
    // Use PostgresDataProvider if DATABASE_URL is configured, otherwise fall back to mock
    if (process.env.DATABASE_URL) {
      const { PostgresDataProvider } = await import('./postgres');
      providerInstance = new PostgresDataProvider();
    } else {
      const { MockDataProvider } = await import('./mock');
      providerInstance = new MockDataProvider();
    }
  }
  return providerInstance;
}

// For testing: allow resetting the provider
export function resetDataProvider(): void {
  providerInstance = null;
}

// For testing: allow setting a custom provider
export function setDataProvider(provider: DataProvider): void {
  providerInstance = provider;
}

export * from './types';
