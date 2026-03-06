import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, schema } from './setup';
import { PostgresDataProvider } from '@/lib/data/postgres';
import { VoteService } from '@/server/services/vote-service';
import {
  allTransactionTypes,
  createTestData,
  assertFieldsPreserved,
  testTeamIds,
} from '../helpers/transaction-visitor';
import type { Signing, PlayerExtension, StaffExtension, Trade } from '@/lib/data/types';
import { createStaffContract } from '@/lib/data/types';

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
        const original = createTestData(type, `test-${type}-add`, testTeamIds);

        await provider.addTransaction(original);

        const retrieved = await provider.getTransaction(original.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(original.id);
        expect(retrieved!.type).toBe(type);
        expect(retrieved!.teamIds.length).toBeGreaterThan(0);
        expect(retrieved!.timestamp).toEqual(original.timestamp);

        // Verify type-specific fields are preserved
        assertFieldsPreserved(original, retrieved!, expect);
      });

      it('should edit', async () => {
        const original = createTestData(type, `test-${type}-edit`, testTeamIds);
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

    it('should add and retrieve a trade with draft pick number specified', async () => {
      const trade: Trade = {
        id: 'trade-with-pick-number',
        type: 'trade',
        teamIds: [testTeamIds[0], testTeamIds[1]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        assets: [
          {
            type: 'draft_pick',
            fromTeamId: testTeamIds[0],
            toTeamId: testTeamIds[1],
            draftPick: { ogTeamId: testTeamIds[0], year: 2025, round: 1, number: 5 },
          },
        ],
      };

      await provider.addTransaction(trade);
      const retrieved = await provider.getTransaction(trade.id) as Trade;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('trade');
      expect(retrieved.assets).toHaveLength(1);
      expect(retrieved.assets[0].type).toBe('draft_pick');
      if (retrieved.assets[0].type === 'draft_pick') {
        expect(retrieved.assets[0].draftPick).toEqual({
          ogTeamId: testTeamIds[0],
          year: 2025,
          round: 1,
          number: 5,
        });
      }
    });

    it('should add and retrieve a trade with draft pick number unspecified', async () => {
      const trade: Trade = {
        id: 'trade-without-pick-number',
        type: 'trade',
        teamIds: [testTeamIds[0], testTeamIds[1]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        assets: [
          {
            type: 'draft_pick',
            fromTeamId: testTeamIds[0],
            toTeamId: testTeamIds[1],
            draftPick: { ogTeamId: testTeamIds[0], year: 2025, round: 3 },
          },
        ],
      };

      await provider.addTransaction(trade);
      const retrieved = await provider.getTransaction(trade.id) as Trade;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('trade');
      expect(retrieved.assets).toHaveLength(1);
      if (retrieved.assets[0].type === 'draft_pick') {
        expect(retrieved.assets[0].draftPick.ogTeamId).toBe(testTeamIds[0]);
        expect(retrieved.assets[0].draftPick.year).toBe(2025);
        expect(retrieved.assets[0].draftPick.round).toBe(3);
        expect(retrieved.assets[0].draftPick.number).toBeUndefined();
      }
    });

    it('should add and retrieve a signing with undefined contract fields', async () => {
      const signing: Signing = {
        id: 'signing-partial-contract',
        type: 'signing',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        player: { name: 'Unknown Deal', position: 'WR' },
        contract: {},
      };

      await provider.addTransaction(signing);
      const retrieved = await provider.getTransaction(signing.id) as Signing;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('signing');
      expect(retrieved.contract.years).toBeUndefined();
      expect(retrieved.contract.totalValue).toBeUndefined();
      expect(retrieved.contract.guaranteed).toBeUndefined();
    });

    it('should add and retrieve a signing with partially defined contract fields', async () => {
      const signing: Signing = {
        id: 'signing-partial-contract-2',
        type: 'signing',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        player: { name: 'Partial Deal', position: 'QB' },
        contract: { years: 3 },
      };

      await provider.addTransaction(signing);
      const retrieved = await provider.getTransaction(signing.id) as Signing;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('signing');
      expect(retrieved.contract.years).toBe(3);
      expect(retrieved.contract.totalValue).toBeUndefined();
      expect(retrieved.contract.guaranteed).toBeUndefined();
    });

    it('should add and retrieve a player extension with undefined contract fields', async () => {
      const extension: PlayerExtension = {
        id: 'extension-partial-contract',
        type: 'extension',
        subtype: 'player',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        player: { name: 'Mystery Extension', position: 'DE' },
        contract: {},
      };

      await provider.addTransaction(extension);
      const retrieved = await provider.getTransaction(extension.id) as PlayerExtension;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('extension');
      expect(retrieved.subtype).toBe('player');
      expect(retrieved.contract.years).toBeUndefined();
      expect(retrieved.contract.totalValue).toBeUndefined();
      expect(retrieved.contract.guaranteed).toBeUndefined();
    });

    it('should add and retrieve a player extension with partially defined contract fields', async () => {
      const extension: PlayerExtension = {
        id: 'extension-partial-contract-2',
        type: 'extension',
        subtype: 'player',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        player: { name: 'Partial Extension', position: 'CB' },
        contract: { totalValue: 80000000, guaranteed: 50000000 },
      };

      await provider.addTransaction(extension);
      const retrieved = await provider.getTransaction(extension.id) as PlayerExtension;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('extension');
      expect(retrieved.subtype).toBe('player');
      expect(retrieved.contract.years).toBeUndefined();
      expect(retrieved.contract.totalValue).toBe(80000000);
      expect(retrieved.contract.guaranteed).toBe(50000000);
    });

    it('should add and retrieve a staff extension with full contract', async () => {
      const extension: StaffExtension = {
        id: 'staff-extension-full',
        type: 'extension',
        subtype: 'staff',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        staff: { name: 'Coach Full', role: 'Head Coach' },
        contract: createStaffContract(5, 50000000),
      };

      await provider.addTransaction(extension);
      const retrieved = await provider.getTransaction(extension.id) as StaffExtension;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('extension');
      expect(retrieved.subtype).toBe('staff');
      expect(retrieved.staff).toEqual({ name: 'Coach Full', role: 'Head Coach' });
      expect(retrieved.contract.years).toBe(5);
      expect(retrieved.contract.totalValue).toBe(50000000);
    });

    it('should add and retrieve a staff extension with empty contract', async () => {
      const extension: StaffExtension = {
        id: 'staff-extension-empty',
        type: 'extension',
        subtype: 'staff',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        staff: { name: 'Coach Empty', role: 'Offensive Coordinator' },
        contract: {},
      };

      await provider.addTransaction(extension);
      const retrieved = await provider.getTransaction(extension.id) as StaffExtension;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('extension');
      expect(retrieved.subtype).toBe('staff');
      expect(retrieved.contract.years).toBeUndefined();
      expect(retrieved.contract.totalValue).toBeUndefined();
    });

    it('should add and retrieve a staff extension with partial contract', async () => {
      const extension: StaffExtension = {
        id: 'staff-extension-partial',
        type: 'extension',
        subtype: 'staff',
        teamIds: [testTeamIds[0]],
        timestamp: new Date('2024-01-15T10:00:00Z'),
        staff: { name: 'Coach Partial', role: 'Defensive Coordinator' },
        contract: createStaffContract(3),
      };

      await provider.addTransaction(extension);
      const retrieved = await provider.getTransaction(extension.id) as StaffExtension;

      expect(retrieved).not.toBeNull();
      expect(retrieved.type).toBe('extension');
      expect(retrieved.subtype).toBe('staff');
      expect(retrieved.contract.years).toBe(3);
      expect(retrieved.contract.totalValue).toBeUndefined();
    });

    it('should return null for non-existent transaction', async () => {
      const result = await provider.getTransaction('non-existent');
      expect(result).toBeNull();
    });

    it('should list transactions with pagination', async () => {
      // Add multiple transactions
      for (let i = 1; i <= 5; i++) {
        const tx = createTestData('signing', `pagination-tx-${i}`, testTeamIds);
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
        const tx = createTestData(type, `mixed-${type}`, testTeamIds);
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
