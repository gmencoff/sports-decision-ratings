import { Transaction, Team, NFL_TEAMS, createPlayerContract } from '@/lib/data/types';
import {
  TransactionVisitor,
  visitTransaction,
  visitByType,
  allTransactionTypes,
} from '@/lib/transactions';

// Re-export for convenience
export { visitTransaction, visitByType, allTransactionTypes };
export type { TransactionVisitor };

// Default teams for tests
export const testTeams = NFL_TEAMS.slice(0, 2); // BUF, MIA

// ============================================================================
// TEST DATA VISITOR - Creates realistic test data for each transaction type
// ============================================================================

export function createTestDataVisitor(id: string, teams: Team[]): TransactionVisitor<Transaction> {
  const base = { id, teams, timestamp: new Date('2024-01-15T10:00:00Z') };

  return {
    visitTrade: () => ({
      ...base,
      type: 'trade',
      assets: [
        // Player asset
        {
          type: 'player',
          fromTeamId: teams[0]?.id ?? 'BUF',
          toTeamId: teams[1]?.id ?? 'MIA',
          player: { name: 'Test Player', position: 'WR' },
        },
        // Coach asset
        {
          type: 'coach',
          fromTeamId: teams[1]?.id ?? 'MIA',
          toTeamId: teams[0]?.id ?? 'BUF',
          staff: { name: 'Assistant Coach', role: 'Wide Receivers Coach' },
        },
        // Draft pick asset
        {
          type: 'draft_pick',
          fromTeamId: teams[1]?.id ?? 'MIA',
          toTeamId: teams[0]?.id ?? 'BUF',
          ogTeamId: teams[1]?.id ?? 'MIA',
          year: 2025,
          round: 3,
        },
        // Conditional draft pick asset
        {
          type: 'conditional_draft_pick',
          fromTeamId: teams[0]?.id ?? 'BUF',
          toTeamId: teams[1]?.id ?? 'MIA',
          ogTeamId: teams[0]?.id ?? 'BUF',
          year: 2026,
          round: 5,
          conditions: 'Becomes 4th round if player makes Pro Bowl',
        },
      ],
    }),

    visitSigning: () => ({
      ...base,
      teams: [teams[0]],
      type: 'signing',
      player: { name: 'Free Agent Star', position: 'CB' },
      contract: createPlayerContract(4, 80000000, 50000000),
    }),

    visitDraft: () => ({
      ...base,
      teams: [teams[0]],
      type: 'draft',
      player: { name: 'Top Prospect', position: 'QB' },
      round: 1,
      pick: 1,
    }),

    visitRelease: () => ({
      ...base,
      teams: [teams[0]],
      type: 'release',
      player: { name: 'Released Player', position: 'RB' },
      capSavings: 5000000,
    }),

    visitExtension: () => ({
      ...base,
      teams: [teams[0]],
      type: 'extension',
      player: { name: 'Franchise Player', position: 'DE' },
      contract: createPlayerContract(5, 150000000, 100000000),
    }),

    visitHire: () => ({
      ...base,
      teams: [teams[0]],
      type: 'hire',
      staff: { name: 'New Coach', role: 'Head Coach' },
    }),

    visitFire: () => ({
      ...base,
      teams: [teams[0]],
      type: 'fire',
      staff: { name: 'Former Coach', role: 'Offensive Coordinator' },
    }),
  };
}

// Convenience function to create test data by type
export function createTestData(type: Parameters<typeof visitByType>[0], id: string, teams: Team[]): Transaction {
  return visitByType(type, createTestDataVisitor(id, teams));
}

// ============================================================================
// FIELD ASSERTION VISITOR - Validates type-specific fields are preserved
// ============================================================================

export function createFieldAssertionVisitor(
  original: Transaction,
  decoded: Transaction,
  expectFn: (value: unknown) => { toEqual: (expected: unknown) => void; toBe: (expected: unknown) => void }
): TransactionVisitor<void> {
  return {
    visitTrade: () => {
      if (original.type === 'trade' && decoded.type === 'trade') {
        expectFn(decoded.assets).toEqual(original.assets);
      }
    },

    visitSigning: () => {
      if (original.type === 'signing' && decoded.type === 'signing') {
        expectFn(decoded.player).toEqual(original.player);
        expectFn(decoded.contract).toEqual(original.contract);
      }
    },

    visitDraft: () => {
      if (original.type === 'draft' && decoded.type === 'draft') {
        expectFn(decoded.player).toEqual(original.player);
        expectFn(decoded.round).toBe(original.round);
        expectFn(decoded.pick).toBe(original.pick);
      }
    },

    visitRelease: () => {
      if (original.type === 'release' && decoded.type === 'release') {
        expectFn(decoded.player).toEqual(original.player);
        expectFn(decoded.capSavings).toBe(original.capSavings);
      }
    },

    visitExtension: () => {
      if (original.type === 'extension' && decoded.type === 'extension') {
        expectFn(decoded.player).toEqual(original.player);
        expectFn(decoded.contract).toEqual(original.contract);
      }
    },

    visitHire: () => {
      if (original.type === 'hire' && decoded.type === 'hire') {
        expectFn(decoded.staff).toEqual(original.staff);
      }
    },

    visitFire: () => {
      if (original.type === 'fire' && decoded.type === 'fire') {
        expectFn(decoded.staff).toEqual(original.staff);
      }
    },
  };
}

// Convenience function to assert fields are preserved
export function assertFieldsPreserved(
  original: Transaction,
  decoded: Transaction,
  expectFn: (value: unknown) => { toEqual: (expected: unknown) => void; toBe: (expected: unknown) => void }
): void {
  visitTransaction(original, createFieldAssertionVisitor(original, decoded, expectFn));
}
