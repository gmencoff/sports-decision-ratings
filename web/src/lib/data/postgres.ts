import { eq, desc, and, lt, or, gte, inArray, sql } from 'drizzle-orm';
import { getDb, type Database } from '@/server/db';
import { transactions, rssItems } from '@/server/db/schema';
import { VoteService, getVoteService } from '@/server/services/vote-service';
import { DataProvider } from './index';
import {
  Transaction,
  Vote,
  VoteCounts,
  PaginatedResult,
  Sentiment,
  TransactionType,
  RssItem,
  RssItemStatus,
} from './types';
import { decodeTransaction } from './postgres-decoder';

const DEFAULT_PAGE_SIZE = 10;

function encodeCursor(timestamp: Date, id: string): string {
  return Buffer.from(`${timestamp.toISOString()}|${id}`).toString('base64');
}

function decodeCursor(cursor: string): { timestamp: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf('|');
    if (separatorIndex === -1) return null;
    const isoString = decoded.slice(0, separatorIndex);
    const id = decoded.slice(separatorIndex + 1);
    return { timestamp: new Date(isoString), id };
  } catch {
    return null;
  }
}

// Convert DB transaction to domain Transaction
function dbTransactionToTransaction(
  dbTxn: {
    id: string;
    type: string;
    teamIds: string[];
    timestamp: Date;
    data: unknown;
  }
): Transaction {
  return decodeTransaction(dbTxn);
}

// Convert domain Transaction to DB format
function transactionToDbFormat(transaction: Transaction): {
  id: string;
  type: TransactionType;
  teamIds: string[];
  timestamp: Date;
  data: Record<string, unknown>;
} {
  const { id, type, teamIds, timestamp, ...rest } = transaction;
  return {
    id,
    type,
    teamIds,
    timestamp,
    data: rest,
  };
}

export class PostgresDataProvider implements DataProvider {
  private db: Database;
  private voteService: VoteService;

  constructor(db?: Database, voteService?: VoteService) {
    this.db = db ?? getDb();
    this.voteService = voteService ?? getVoteService();
  }

  async getTransactions(
    limit: number = DEFAULT_PAGE_SIZE,
    cursor?: string
  ): Promise<PaginatedResult<Transaction>> {

    let results;

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        // Get records after the cursor (older timestamps or same timestamp but lower id)
        results = await this.db
          .select()
          .from(transactions)
          .where(
            or(
              lt(transactions.timestamp, decoded.timestamp),
              and(
                eq(transactions.timestamp, decoded.timestamp),
                lt(transactions.id, decoded.id)
              )
            )
          )
          .orderBy(desc(transactions.timestamp), desc(transactions.id))
          .limit(limit + 1);
      } else {
        results = await this.db
          .select()
          .from(transactions)
          .orderBy(desc(transactions.timestamp), desc(transactions.id))
          .limit(limit + 1);
      }
    } else {
      results = await this.db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.timestamp), desc(transactions.id))
        .limit(limit + 1);
    }
    const hasMore = results.length > limit;
    const pageData = hasMore ? results.slice(0, limit) : results;

    const txns = pageData.map((row) => dbTransactionToTransaction(row));

    const nextCursor =
      hasMore && pageData.length > 0
        ? encodeCursor(pageData[pageData.length - 1].timestamp, pageData[pageData.length - 1].id)
        : undefined;

    return {
      data: txns,
      nextCursor,
      hasMore,
    };
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return dbTransactionToTransaction(result[0]);
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    const dbFormat = transactionToDbFormat(transaction);

    await this.db.insert(transactions).values(dbFormat);

    return transaction;
  }

  async editTransaction(id: string, transaction: Transaction): Promise<Transaction | null> {
    const dbFormat = transactionToDbFormat({ ...transaction, id });

    const result = await this.db
      .update(transactions)
      .set({
        type: dbFormat.type,
        teamIds: dbFormat.teamIds,
        timestamp: dbFormat.timestamp,
        data: dbFormat.data,
      })
      .where(eq(transactions.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return transaction;
  }

  async getVoteCounts(transactionId: string, teamId: string): Promise<VoteCounts> {
    return this.voteService.getVoteCounts(transactionId, teamId);
  }

  async getUserVote(
    transactionId: string,
    teamId: string,
    userId: string
  ): Promise<Sentiment | null> {
    return this.voteService.getUserVote(transactionId, teamId, userId);
  }

  async submitVote(vote: Vote): Promise<void> {
    await this.voteService.castVote(
      vote.transactionId,
      vote.teamId,
      vote.userId,
      vote.sentiment
    );
  }

  async getTransactionsInDateRange(type: TransactionType, teamIds: string[], from: Date, to: Date): Promise<Transaction[]> {
    const results = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, type),
          gte(transactions.timestamp, from),
          lt(transactions.timestamp, to),
          sql`${transactions.teamIds} && ${teamIds}`
        )
      );
    return results.map((row) => dbTransactionToTransaction(row));
  }

  async saveNewRssItems(items: RssItem[]): Promise<RssItem[]> {
    if (items.length === 0) return [];

    const guids = items.map((i) => i.guid);
    const existing = await this.db
      .select({ guid: rssItems.guid })
      .from(rssItems)
      .where(inArray(rssItems.guid, guids));

    const existingGuids = new Set(existing.map((r) => r.guid));
    const newItems = items.filter((i) => !existingGuids.has(i.guid));

    if (newItems.length === 0) return [];

    await this.db.insert(rssItems).values(
      newItems.map((item) => ({
        guid: item.guid,
        source: item.source,
        title: item.title,
        description: item.description,
        link: item.link,
        pubDate: item.pubDate,
        status: 'pending' as RssItemStatus,
      }))
    );

    return newItems;
  }

  async markRssItemStatus(
    guid: string,
    status: RssItemStatus,
    transactionIds?: string[],
    error?: string
  ): Promise<void> {
    await this.db
      .update(rssItems)
      .set({
        status,
        processedAt: new Date(),
        ...(transactionIds !== undefined ? { transactionIds } : {}),
        ...(error !== undefined ? { error } : {}),
      })
      .where(eq(rssItems.guid, guid));
  }
}
