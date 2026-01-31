import { eq, desc, and, lt, or } from 'drizzle-orm';
import { getDb, type Database } from '@/server/db';
import { teams, transactions } from '@/server/db/schema';
import { VoteService, getVoteService } from '@/server/services/vote-service';
import { DataProvider } from './index';
import {
  Transaction,
  Trade,
  Signing,
  DraftSelection,
  Release,
  Extension,
  Hire,
  Fire,
  Team,
  Vote,
  VoteCounts,
  PaginatedResult,
  Sentiment,
  TransactionType,
  Player,
  Staff,
  TradeAsset,
  PlayerAsset,
  CoachAsset,
  DraftPickAsset,
  ConditionalDraftPickAsset,
  Position,
  Role,
} from './types';

const DEFAULT_PAGE_SIZE = 10;

function encodeCursor(timestamp: Date, id: string): string {
  return Buffer.from(`${timestamp.toISOString()}:${id}`).toString('base64');
}

function decodeCursor(cursor: string): { timestamp: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [isoString, id] = decoded.split(':');
    return { timestamp: new Date(isoString), id };
  } catch {
    return null;
  }
}

// Convert DB team to domain Team
function dbTeamToTeam(dbTeam: {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West';
}): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    abbreviation: dbTeam.abbreviation,
    conference: dbTeam.conference,
    division: dbTeam.division,
  };
}

// Convert raw JSONB player data to Player type
export function decodePlayer(raw: unknown): Player {
  const data = raw as { name: string; position: string };
  return {
    name: data.name,
    position: data.position as Position,
  };
}

// Convert raw JSONB staff data to Staff type
export function decodeStaff(raw: unknown): Staff {
  const data = raw as { name: string; role: string };
  return {
    name: data.name,
    role: data.role as Role,
  };
}

// Convert raw JSONB trade asset to TradeAsset type
export function decodeTradeAsset(raw: unknown): TradeAsset {
  const data = raw as { type: string; fromTeamId: string; toTeamId: string; [key: string]: unknown };

  switch (data.type) {
    case 'player':
      return {
        type: 'player',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        player: decodePlayer(data.player),
      } as PlayerAsset;
    case 'coach':
      return {
        type: 'coach',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        staff: decodeStaff(data.staff),
      } as CoachAsset;
    case 'draft_pick':
      return {
        type: 'draft_pick',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        ogTeamId: data.ogTeamId as string,
        year: data.year as number,
        round: data.round as number,
      } as DraftPickAsset;
    case 'conditional_draft_pick':
      return {
        type: 'conditional_draft_pick',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        ogTeamId: data.ogTeamId as string,
        year: data.year as number,
        round: data.round as number,
        conditions: data.conditions as string,
      } as ConditionalDraftPickAsset;
    default:
      throw new Error(`Unknown trade asset type: ${data.type}`);
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
  },
  teamMap: Map<string, Team>
): Transaction {
  const data = dbTxn.data as Record<string, unknown>;
  const txnTeams = dbTxn.teamIds.map((id) => teamMap.get(id)!).filter(Boolean);

  const base = {
    id: dbTxn.id,
    teams: txnTeams,
    timestamp: dbTxn.timestamp,
  };

  switch (dbTxn.type) {
    case 'trade': {
      const rawAssets = data.assets as unknown[];
      return {
        ...base,
        type: 'trade',
        assets: rawAssets.map(decodeTradeAsset),
      } as Trade;
    }
    case 'signing':
      return {
        ...base,
        type: 'signing',
        player: decodePlayer(data.player),
        contractYears: data.contractYears as number,
        totalValue: data.totalValue as number,
        guaranteed: data.guaranteed as number,
      } as Signing;
    case 'draft':
      return {
        ...base,
        type: 'draft',
        player: decodePlayer(data.player),
        round: data.round as number,
        pick: data.pick as number,
      } as DraftSelection;
    case 'release':
      return {
        ...base,
        type: 'release',
        player: decodePlayer(data.player),
        capSavings: data.capSavings as number | undefined,
      } as Release;
    case 'extension':
      return {
        ...base,
        type: 'extension',
        player: decodePlayer(data.player),
        contractYears: data.contractYears as number,
        totalValue: data.totalValue as number,
        guaranteed: data.guaranteed as number,
      } as Extension;
    case 'hire':
      return {
        ...base,
        type: 'hire',
        staff: decodeStaff(data.staff),
      } as Hire;
    case 'fire':
      return {
        ...base,
        type: 'fire',
        staff: decodeStaff(data.staff),
      } as Fire;
    default:
      throw new Error(`Unknown transaction type: ${dbTxn.type}`);
  }
}

// Convert domain Transaction to DB format
function transactionToDbFormat(transaction: Transaction): {
  id: string;
  type: TransactionType;
  teamIds: string[];
  timestamp: Date;
  data: Record<string, unknown>;
} {
  const { id, type, teams: txnTeams, timestamp, ...rest } = transaction;
  return {
    id,
    type,
    teamIds: txnTeams.map((t) => t.id),
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

  private async getTeamMap(): Promise<Map<string, Team>> {
    const dbTeams = await this.db.select().from(teams);
    return new Map(dbTeams.map((t) => [t.id, dbTeamToTeam(t)]));
  }

  async getTransactions(
    limit: number = DEFAULT_PAGE_SIZE,
    cursor?: string
  ): Promise<PaginatedResult<Transaction>> {
    const teamMap = await this.getTeamMap();

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

    const txns = pageData.map((row) => dbTransactionToTransaction(row, teamMap));

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
    const teamMap = await this.getTeamMap();

    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return dbTransactionToTransaction(result[0], teamMap);
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
}
