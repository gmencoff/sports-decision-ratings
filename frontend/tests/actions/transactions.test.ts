import { describe, it, expect, vi } from 'vitest';
import { getTransactionsImpl, getTransactionImpl, addTransactionImpl, editTransactionImpl } from '@/app/actions/transactions';
import { createMockDataProvider, createMockTransaction } from '../mocks/mockDataProvider';
import type { Trade, Signing, DraftSelection, Release, Extension, Hire, Fire } from '@/lib/data/types';

describe('transactions actions', () => {
  describe('getTransactionsImpl', () => {
    it('should return transactions from the provider', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];

      const mockProvider = createMockDataProvider({
        getTransactions: vi.fn().mockResolvedValue({
          data: mockTransactions,
          hasMore: true,
          nextCursor: 'cursor-123',
        }),
      });

      const result = await getTransactionsImpl(mockProvider);

      expect(mockProvider.getTransactions).toHaveBeenCalledWith(undefined, undefined);
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-123');
    });

    it('should pass limit and cursor to the provider', async () => {
      const mockProvider = createMockDataProvider();

      await getTransactionsImpl(mockProvider, 10, 'my-cursor');

      expect(mockProvider.getTransactions).toHaveBeenCalledWith(10, 'my-cursor');
    });

    it('should return empty array when no transactions exist', async () => {
      const mockProvider = createMockDataProvider({
        getTransactions: vi.fn().mockResolvedValue({
          data: [],
          hasMore: false,
        }),
      });

      const result = await getTransactionsImpl(mockProvider);

      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getTransactionImpl', () => {
    it('should return a transaction by id', async () => {
      const mockTransaction = createMockTransaction({ id: 'tx-123' });

      const mockProvider = createMockDataProvider({
        getTransaction: vi.fn().mockResolvedValue(mockTransaction),
      });

      const result = await getTransactionImpl(mockProvider, 'tx-123');

      expect(mockProvider.getTransaction).toHaveBeenCalledWith('tx-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('tx-123');
    });

    it('should return null when transaction not found', async () => {
      const mockProvider = createMockDataProvider({
        getTransaction: vi.fn().mockResolvedValue(null),
      });

      const result = await getTransactionImpl(mockProvider, 'nonexistent');

      expect(mockProvider.getTransaction).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('addTransactionImpl', () => {
    const baseTeam = { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC' as const, division: 'East' as const };
    const baseTimestamp = new Date('2024-01-15');

    it('should add a Trade transaction', async () => {
      const tradeTransaction: Trade = {
        id: 'trade-1',
        type: 'trade',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, tradeTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(tradeTransaction);
      expect(result).toEqual(tradeTransaction);
    });

    it('should add a Signing transaction', async () => {
      const signingTransaction: Signing = {
        id: 'signing-1',
        type: 'signing',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Jane Smith', position: 'WR' },
        contractYears: 4,
        totalValue: 50000000,
        guaranteed: 30000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, signingTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(signingTransaction);
      expect(result).toEqual(signingTransaction);
    });

    it('should add a DraftSelection transaction', async () => {
      const draftTransaction: DraftSelection = {
        id: 'draft-1',
        type: 'draft',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Rookie Star', position: 'RB' },
        round: 1,
        pick: 5,
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, draftTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(draftTransaction);
      expect(result).toEqual(draftTransaction);
    });

    it('should add a Release transaction', async () => {
      const releaseTransaction: Release = {
        id: 'release-1',
        type: 'release',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Old Timer', position: 'LB' },
        capSavings: 5000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, releaseTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(releaseTransaction);
      expect(result).toEqual(releaseTransaction);
    });

    it('should add an Extension transaction', async () => {
      const extensionTransaction: Extension = {
        id: 'extension-1',
        type: 'extension',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Franchise Player', position: 'QB' },
        contractYears: 5,
        totalValue: 200000000,
        guaranteed: 150000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, extensionTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(extensionTransaction);
      expect(result).toEqual(extensionTransaction);
    });

    it('should add a Hire transaction', async () => {
      const hireTransaction: Hire = {
        id: 'hire-1',
        type: 'hire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Smith', role: 'Head Coach' },
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, hireTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(hireTransaction);
      expect(result).toEqual(hireTransaction);
    });

    it('should add a Fire transaction', async () => {
      const fireTransaction: Fire = {
        id: 'fire-1',
        type: 'fire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Jones', role: 'Head Coach' },
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, fireTransaction);

      expect(mockProvider.addTransaction).toHaveBeenCalledWith(fireTransaction);
      expect(result).toEqual(fireTransaction);
    });
  });

  describe('editTransactionImpl', () => {
    const baseTeam = { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC' as const, division: 'East' as const };
    const baseTimestamp = new Date('2024-01-15');

    it('should edit a Trade transaction', async () => {
      const tradeTransaction: Trade = {
        id: 'trade-1',
        type: 'trade',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'trade-1', tradeTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('trade-1', tradeTransaction);
      expect(result?.id).toBe('trade-1');
    });

    it('should edit a Signing transaction', async () => {
      const signingTransaction: Signing = {
        id: 'signing-1',
        type: 'signing',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Jane Smith', position: 'WR' },
        contractYears: 5,
        totalValue: 60000000,
        guaranteed: 40000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'signing-1', signingTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('signing-1', signingTransaction);
      expect(result?.id).toBe('signing-1');
    });

    it('should edit a DraftSelection transaction', async () => {
      const draftTransaction: DraftSelection = {
        id: 'draft-1',
        type: 'draft',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Rookie Star', position: 'RB' },
        round: 1,
        pick: 3,
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'draft-1', draftTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('draft-1', draftTransaction);
      expect(result?.id).toBe('draft-1');
    });

    it('should edit a Release transaction', async () => {
      const releaseTransaction: Release = {
        id: 'release-1',
        type: 'release',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Old Timer', position: 'LB' },
        capSavings: 7000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'release-1', releaseTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('release-1', releaseTransaction);
      expect(result?.id).toBe('release-1');
    });

    it('should edit an Extension transaction', async () => {
      const extensionTransaction: Extension = {
        id: 'extension-1',
        type: 'extension',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Franchise Player', position: 'QB' },
        contractYears: 6,
        totalValue: 250000000,
        guaranteed: 180000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'extension-1', extensionTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('extension-1', extensionTransaction);
      expect(result?.id).toBe('extension-1');
    });

    it('should edit a Hire transaction', async () => {
      const hireTransaction: Hire = {
        id: 'hire-1',
        type: 'hire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Smith', role: 'Offensive Coordinator' },
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'hire-1', hireTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('hire-1', hireTransaction);
      expect(result?.id).toBe('hire-1');
    });

    it('should edit a Fire transaction', async () => {
      const fireTransaction: Fire = {
        id: 'fire-1',
        type: 'fire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Jones', role: 'Defensive Coordinator' },
      };

      const mockProvider = createMockDataProvider();
      const result = await editTransactionImpl(mockProvider, 'fire-1', fireTransaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('fire-1', fireTransaction);
      expect(result?.id).toBe('fire-1');
    });

    it('should return null when editing non-existent transaction', async () => {
      const transaction = createMockTransaction({ id: 'nonexistent' });
      const mockProvider = createMockDataProvider({
        editTransaction: vi.fn().mockResolvedValue(null),
      });

      const result = await editTransactionImpl(mockProvider, 'nonexistent', transaction);

      expect(mockProvider.editTransaction).toHaveBeenCalledWith('nonexistent', transaction);
      expect(result).toBeNull();
    });
  });
});
