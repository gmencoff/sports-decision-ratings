import { describe, it, expect, vi } from 'vitest';
import { getTransactionsImpl, getTransactionImpl, addTransactionImpl, editTransactionImpl } from '@/app/actions/transactions';
import { createMockDataProvider, createMockTransaction } from '../../mocks/mockDataProvider';
import type { Trade, Signing, DraftSelection, Release, Extension, Hire, Fire, TransactionInput } from '@/lib/data/types';
import { createPlayerContract, createStaffContract } from '@/lib/data/types';

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
    const team1 = { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC' as const, division: 'East' as const };
    const team2 = { id: 'team-2', name: 'Team B', abbreviation: 'TB', conference: 'NFC' as const, division: 'West' as const };
    const baseTeam = team1;
    const baseTimestamp = new Date('2024-01-15');

    it('should add a Trade transaction and generate id', async () => {
      const tradeInput: TransactionInput = {
        type: 'trade',
        teams: [team1, team2],
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, tradeInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(result.type).toBe('trade');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...tradeInput,
        id: expect.any(String),
      }));
    });

    it('should reject a Trade with missing team in teams list', async () => {
      const invalidTradeInput: TransactionInput = {
        type: 'trade',
        teams: [team1], // Missing team-2
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();

      await expect(addTransactionImpl(mockProvider, invalidTradeInput)).rejects.toThrow(
        "Invalid transaction: Team 'team-2' referenced in trade assets is not in the teams list"
      );
      expect(mockProvider.addTransaction).not.toHaveBeenCalled();
    });

    it('should reject a Trade with extra team not in assets', async () => {
      const team3 = { id: 'team-3', name: 'Team C', abbreviation: 'TC', conference: 'AFC' as const, division: 'North' as const };
      const invalidTradeInput: TransactionInput = {
        type: 'trade',
        teams: [team1, team2, team3], // team-3 not in any asset
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();

      await expect(addTransactionImpl(mockProvider, invalidTradeInput)).rejects.toThrow(
        "Invalid transaction: Team 'team-3' is in the teams list but not referenced in any trade asset"
      );
      expect(mockProvider.addTransaction).not.toHaveBeenCalled();
    });

    it('should add a Signing transaction and generate id', async () => {
      const signingInput: TransactionInput = {
        type: 'signing',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Jane Smith', position: 'WR' },
        contract: createPlayerContract(4, 50000000, 30000000),
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, signingInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('signing');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...signingInput,
        id: expect.any(String),
      }));
    });

    it('should add a DraftSelection transaction and generate id', async () => {
      const draftInput: TransactionInput = {
        type: 'draft',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Rookie Star', position: 'RB' },
        draftPick: { ogTeamId: baseTeam.id, year: 2025, round: 1, number: 5 },
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, draftInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('draft');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...draftInput,
        id: expect.any(String),
      }));
    });

    it('should add a Release transaction and generate id', async () => {
      const releaseInput: TransactionInput = {
        type: 'release',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Old Timer', position: 'LB' },
        capSavings: 5000000,
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, releaseInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('release');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...releaseInput,
        id: expect.any(String),
      }));
    });

    it('should add a player Extension transaction and generate id', async () => {
      const extensionInput: TransactionInput = {
        type: 'extension',
        subtype: 'player',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Franchise Player', position: 'QB' },
        contract: createPlayerContract(5, 200000000, 150000000),
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, extensionInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('extension');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...extensionInput,
        id: expect.any(String),
      }));
    });

    it('should add a staff Extension transaction and generate id', async () => {
      const extensionInput: TransactionInput = {
        type: 'extension',
        subtype: 'staff',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Smith', role: 'Head Coach' },
        contract: createStaffContract(5, 50000000),
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, extensionInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('extension');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...extensionInput,
        id: expect.any(String),
      }));
    });

    it('should add a Hire transaction and generate id', async () => {
      const hireInput: TransactionInput = {
        type: 'hire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Smith', role: 'Head Coach' },
        contract: createStaffContract(4, 40000000),
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, hireInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('hire');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...hireInput,
        id: expect.any(String),
      }));
    });

    it('should add a Fire transaction and generate id', async () => {
      const fireInput: TransactionInput = {
        type: 'fire',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        staff: { name: 'Coach Jones', role: 'Head Coach' },
      };

      const mockProvider = createMockDataProvider();
      const result = await addTransactionImpl(mockProvider, fireInput);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.type).toBe('fire');
      expect(mockProvider.addTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...fireInput,
        id: expect.any(String),
      }));
    });

    it('should generate unique ids for each transaction', async () => {
      const input: TransactionInput = {
        type: 'signing',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Test Player', position: 'QB' },
        contract: createPlayerContract(1, 1000000, 500000),
      };

      const mockProvider = createMockDataProvider();
      const result1 = await addTransactionImpl(mockProvider, input);
      const result2 = await addTransactionImpl(mockProvider, input);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('editTransactionImpl', () => {
    const team1 = { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC' as const, division: 'East' as const };
    const team2 = { id: 'team-2', name: 'Team B', abbreviation: 'TB', conference: 'NFC' as const, division: 'West' as const };
    const baseTeam = team1;
    const baseTimestamp = new Date('2024-01-15');

    it('should edit a Trade transaction', async () => {
      const tradeTransaction: Trade = {
        id: 'trade-1',
        type: 'trade',
        teams: [team1, team2],
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

    it('should reject editing a Trade with invalid teams', async () => {
      const invalidTradeTransaction: Trade = {
        id: 'trade-1',
        type: 'trade',
        teams: [team1], // Missing team-2
        timestamp: baseTimestamp,
        assets: [
          { type: 'player', fromTeamId: 'team-1', toTeamId: 'team-2', player: { name: 'John Doe', position: 'QB' } },
        ],
      };

      const mockProvider = createMockDataProvider();

      await expect(editTransactionImpl(mockProvider, 'trade-1', invalidTradeTransaction)).rejects.toThrow(
        "Invalid transaction: Team 'team-2' referenced in trade assets is not in the teams list"
      );
      expect(mockProvider.editTransaction).not.toHaveBeenCalled();
    });

    it('should edit a Signing transaction', async () => {
      const signingTransaction: Signing = {
        id: 'signing-1',
        type: 'signing',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Jane Smith', position: 'WR' },
        contract: createPlayerContract(5, 60000000, 40000000),
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
        draftPick: { ogTeamId: baseTeam.id, year: 2025, round: 1, number: 3 },
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
        subtype: 'player',
        teams: [baseTeam],
        timestamp: baseTimestamp,
        player: { name: 'Franchise Player', position: 'QB' },
        contract: createPlayerContract(6, 250000000, 180000000),
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
        contract: createStaffContract(3, 30000000),
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
