import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, schema } from './setup';
import { PostgresDataProvider } from '@/lib/data/postgres';
import { VoteService } from '@/server/services/vote-service';
import type { Transaction, Trade } from '@/lib/data/types';

describe('PostgresDataProvider Integration', () => {
  let provider: PostgresDataProvider;
  let voteService: VoteService;

  beforeEach(async () => {
    const db = getTestDb();
    voteService = new VoteService(db);
    provider = new PostgresDataProvider(db, voteService);
  });

  describe('transactions', () => {
    it('should add and retrieve a transaction', async () => {
      const db = getTestDb();
      const teams = await db.select().from(schema.teams).limit(2);

      const transaction: Trade = {
        id: 'test-trade-1',
        type: 'trade',
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          abbreviation: t.abbreviation,
          conference: t.conference,
          division: t.division,
        })),
        timestamp: new Date('2024-01-15T10:00:00Z'),
        assets: [
          {
            type: 'player',
            fromTeamId: teams[0].id,
            toTeamId: teams[1].id,
            player: { name: 'Test Player', position: 'QB' },
          },
        ],
      };

      await provider.addTransaction(transaction);

      const retrieved = await provider.getTransaction('test-trade-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('test-trade-1');
      expect(retrieved!.type).toBe('trade');
      expect(retrieved!.teams).toHaveLength(2);
    });

    it('should return null for non-existent transaction', async () => {
      const result = await provider.getTransaction('non-existent');
      expect(result).toBeNull();
    });

    it('should list transactions with pagination', async () => {
      const db = getTestDb();
      const teams = await db.select().from(schema.teams).limit(1);
      const team = {
        id: teams[0].id,
        name: teams[0].name,
        abbreviation: teams[0].abbreviation,
        conference: teams[0].conference,
        division: teams[0].division,
      };

      // Add multiple transactions
      for (let i = 1; i <= 5; i++) {
        await provider.addTransaction({
          id: `tx-${i}`,
          type: 'signing',
          teams: [team],
          timestamp: new Date(`2024-01-${10 + i}T10:00:00Z`),
          player: { name: `Player ${i}`, position: 'WR' },
          contractYears: 3,
          totalValue: 50000000,
          guaranteed: 30000000,
        });
      }

      // First page
      const page1 = await provider.getTransactions(2);
      expect(page1.data).toHaveLength(2);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeDefined();

      // Second page
      const page2 = await provider.getTransactions(2, page1.nextCursor);
      expect(page2.data).toHaveLength(2);
      expect(page2.hasMore).toBe(true);

      // Third page
      const page3 = await provider.getTransactions(2, page2.nextCursor);
      expect(page3.data).toHaveLength(1);
      expect(page3.hasMore).toBe(false);
    });

    it('should edit a transaction', async () => {
      const db = getTestDb();
      const teams = await db.select().from(schema.teams).limit(1);
      const team = {
        id: teams[0].id,
        name: teams[0].name,
        abbreviation: teams[0].abbreviation,
        conference: teams[0].conference,
        division: teams[0].division,
      };

      const original: Transaction = {
        id: 'edit-test',
        type: 'signing',
        teams: [team],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        player: { name: 'Original Player', position: 'RB' },
        contractYears: 2,
        totalValue: 20000000,
        guaranteed: 10000000,
      };

      await provider.addTransaction(original);

      const updated: Transaction = {
        ...original,
        player: { name: 'Updated Player', position: 'RB' },
        contractYears: 4,
      };

      const result = await provider.editTransaction('edit-test', updated);
      expect(result).not.toBeNull();

      const retrieved = await provider.getTransaction('edit-test');
      expect(retrieved).not.toBeNull();
      if (retrieved?.type === 'signing') {
        expect(retrieved.player.name).toBe('Updated Player');
        expect(retrieved.contractYears).toBe(4);
      }
    });
  });

  describe('votes', () => {
    const testTransactionId = 'vote-test-tx';
    const testTeamId = 'KC';

    beforeEach(async () => {
      const db = getTestDb();
      await db.insert(schema.transactions).values({
        id: testTransactionId,
        type: 'signing',
        teamIds: [testTeamId],
        timestamp: new Date(),
        data: {
          player: { name: 'Test', position: 'QB' },
          contractYears: 1,
          totalValue: 1000000,
          guaranteed: 500000,
        },
      });
    });

    it('should submit and retrieve votes through provider', async () => {
      const voterId = 'provider-test-voter';

      await provider.submitVote({
        transactionId: testTransactionId,
        teamId: testTeamId,
        userId: voterId,
        sentiment: 'good',
      });

      const counts = await provider.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 1, bad: 0, unsure: 0 });

      const userVote = await provider.getUserVote(testTransactionId, testTeamId, voterId);
      expect(userVote).toBe('good');
    });
  });
});
