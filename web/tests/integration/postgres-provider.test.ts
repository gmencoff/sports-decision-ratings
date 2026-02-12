import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, schema } from './setup';
import { PostgresDataProvider } from '@/lib/data/postgres';
import { VoteService } from '@/server/services/vote-service';
import {
  allTransactionTypes,
  createTestData,
  assertFieldsPreserved,
  testTeams,
} from '../helpers/transaction-visitor';

describe('PostgresDataProvider Integration', () => {
  let provider: PostgresDataProvider;
  let voteService: VoteService;

  beforeEach(async () => {
    const db = getTestDb();
    voteService = new VoteService(db);
    provider = new PostgresDataProvider(db, voteService);
  });

  describe('transactions', () => {
    // Test each transaction type
    describe.each(allTransactionTypes())('%s transactions', (type) => {
      it('should add and retrieve', async () => {
        const original = createTestData(type, `test-${type}-add`, testTeams);

        await provider.addTransaction(original);

        const retrieved = await provider.getTransaction(original.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(original.id);
        expect(retrieved!.type).toBe(type);
        expect(retrieved!.teams.length).toBeGreaterThan(0);
        expect(retrieved!.timestamp).toEqual(original.timestamp);

        // Verify type-specific fields are preserved
        assertFieldsPreserved(original, retrieved!, expect);
      });

      it('should edit', async () => {
        const original = createTestData(type, `test-${type}-edit`, testTeams);
        await provider.addTransaction(original);

        // Modify timestamp
        const updated = {
          ...original,
          timestamp: new Date('2025-06-15T12:00:00Z'),
        };

        const result = await provider.editTransaction(original.id, updated);
        expect(result).not.toBeNull();

        const retrieved = await provider.getTransaction(original.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.timestamp).toEqual(updated.timestamp);

        // Verify type-specific fields still preserved
        assertFieldsPreserved(original, retrieved!, expect);
      });
    });

    it('should return null for non-existent transaction', async () => {
      const result = await provider.getTransaction('non-existent');
      expect(result).toBeNull();
    });

    it('should list transactions with pagination', async () => {
      // Add multiple transactions
      for (let i = 1; i <= 5; i++) {
        const tx = createTestData('signing', `pagination-tx-${i}`, testTeams);
        tx.timestamp = new Date(`2024-01-${10 + i}T10:00:00Z`);
        await provider.addTransaction(tx);
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

    it('should list transactions of all types', async () => {
      const types = allTransactionTypes();

      // Add one of each type
      for (const type of types) {
        const tx = createTestData(type, `mixed-${type}`, testTeams);
        await provider.addTransaction(tx);
      }

      const result = await provider.getTransactions(10);
      expect(result.data).toHaveLength(types.length);

      // Verify each type was stored and retrieved
      for (const type of types) {
        const tx = result.data.find((t) => t.type === type);
        expect(tx).toBeDefined();
        expect(tx!.id).toBe(`mixed-${type}`);
      }
    });

    it('should not skip transactions during pagination', async () => {
      // Add 10 transactions with sequential IDs and timestamps
      const transactionIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const id = `pagination-skip-test-${i}`;
        transactionIds.push(id);
        const tx = createTestData('signing', id, testTeams);
        // Use different timestamps to ensure ordering
        tx.timestamp = new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`);
        await provider.addTransaction(tx);
      }

      // Fetch in pages of 3 - should get 4 pages (3 + 3 + 3 + 1)
      const allFetchedIds: string[] = [];
      let cursor: string | undefined = undefined;
      let pageCount = 0;

      do {
        const page = await provider.getTransactions(3, cursor);
        pageCount++;
        
        // Collect all IDs from this page
        for (const tx of page.data) {
          allFetchedIds.push(tx.id);
        }
        
        cursor = page.nextCursor;
      } while (cursor);

      // Verify we got exactly 10 transactions
      expect(allFetchedIds).toHaveLength(10);
      
      // Verify all original IDs are present (no skips)
      for (const expectedId of transactionIds) {
        expect(allFetchedIds).toContain(expectedId);
      }
      
      // Verify no duplicates
      const uniqueIds = new Set(allFetchedIds);
      expect(uniqueIds.size).toBe(allFetchedIds.length);
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
