import { Transaction, Vote, VoteCounts, PaginatedResult, Sentiment } from './types';

export interface DataProvider {
  getTransactions(limit?: number, cursor?: string): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: string): Promise<Transaction | null>;
  getVoteCounts(transactionId: string, teamId: string): Promise<VoteCounts>;
  getUserVote(transactionId: string, teamId: string, userId: string): Promise<Sentiment | null>;
  submitVote(vote: Vote): Promise<void>;
}

// Factory function to get the data provider
// This makes it easy to swap implementations (mock, test, production)
let providerInstance: DataProvider | null = null;

export async function getDataProvider(): Promise<DataProvider> {
  if (!providerInstance) {
    // Default to mock provider for now
    const { MockDataProvider } = await import('./mock');
    providerInstance = new MockDataProvider();
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
