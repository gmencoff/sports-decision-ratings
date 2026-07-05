import { Transaction, Vote, VoteCounts, PaginatedResult, Sentiment, TransactionType, RssItem, RssItemStatus } from './types';
import { resolveProvider } from './provider-factory';

export interface DataProvider {
  getTransactions(limit?: number, cursor?: string): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: string): Promise<Transaction | null>;
  addTransaction(transaction: Transaction): Promise<Transaction>;
  editTransaction(id: string, transaction: Transaction): Promise<Transaction | null>;
  getVoteCounts(transactionId: string, teamId: string): Promise<VoteCounts>;
  getUserVote(transactionId: string, teamId: string, userId: string): Promise<Sentiment | null>;
  submitVote(vote: Vote): Promise<void>;
  getTransactionsInDateRange(type: TransactionType, teamIds: string[], from: Date, to: Date): Promise<Transaction[]>;
  saveNewRssItems(items: RssItem[]): Promise<RssItem[]>;
  markRssItemStatus(guid: string, status: RssItemStatus, transactionIds?: string[], error?: string): Promise<void>;
}

let instance: DataProvider | null = null;

export async function getDataProvider(): Promise<DataProvider> {
  if (!instance) {
    instance = await resolveProvider<DataProvider>({
      createPostgres: async () => {
        const { PostgresDataProvider } = await import('./postgres');
        return new PostgresDataProvider();
      },
      createMock: async () => {
        const { MockDataProvider } = await import('./mock');
        return new MockDataProvider();
      },
    });
  }
  return instance;
}

export function resetDataProvider(): void { instance = null; }
export function setDataProvider(provider: DataProvider): void { instance = provider; }

export * from './types';
