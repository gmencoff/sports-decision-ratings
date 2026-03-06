import { Transaction, TeamId, NFL_TEAMS, createPlayerContract, createStaffContract } from '@/lib/data/types';
import {
  TransactionVisitor,
  visitTransaction,
  visitByType,
  allTransactionTypes,
} from '@/lib/transactions';

// Re-export for convenience
export { visitTransaction, visitByType, allTransactionTypes };
export type { TransactionVisitor };

// Default team IDs for tests
export const testTeamIds = NFL_TEAMS.slice(0, 2).map((t) => t.id) as TeamId[]; // BUF, MIA

// ============================================================================
// TEST DATA VISITOR - Creates realistic test data for each transaction type
// ============================================================================

export function createTestDataVisitor(id: string, teamIds: TeamId[]): TransactionVisitor<Transaction> {
  const base = { id, teamIds, timestamp: new Date('2024-01-15T10:00:00Z') };

  return {
    visitTrade: () => ({
      ...base,
      type: 'trade',
      assets: [
        // Player asset
        {
          type: 'player',
          fromTeamId: teamIds[0] ?? 'BUF',
          toTeamId: teamIds[1] ?? 'MIA',
          player: { name: 'Test Player', position: 'WR' },
        },
        // Coach asset
        {
          type: 'coach',
          fromTeamId: teamIds[1] ?? 'MIA',
          toTeamId: teamIds[0] ?? 'BUF',
          staff: { name: 'Assistant Coach', role: 'Wide Receivers Coach' },
        },
        // Draft pick asset
        {
          type: 'draft_pick',
          fromTeamId: teamIds[1] ?? 'MIA',
          toTeamId: teamIds[0] ?? 'BUF',
          draftPick: { ogTeamId: teamIds[1] ?? 'MIA', year: 2025, round: 3 },
        },
        // Conditional draft pick asset
        {
          type: 'conditional_draft_pick',
          fromTeamId: teamIds[0] ?? 'BUF',
          toTeamId: teamIds[1] ?? 'MIA',
          draftPick: { ogTeamId: teamIds[0] ?? 'BUF', year: 2026, round: 5 },
          conditions: 'Becomes 4th round if player makes Pro Bowl',
        },
      ],
    }),

    visitSigning: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'signing',
      player: { name: 'Free Agent Star', position: 'CB' },
      contract: createPlayerContract(4, 80000000, 50000000),
    }),

    visitDraft: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'draft',
      player: { name: 'Top Prospect', position: 'QB' },
      draftPick: { ogTeamId: teamIds[0] ?? 'BUF', year: 2024, round: 1, number: 1 },
    }),

    visitRelease: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'release',
      player: { name: 'Released Player', position: 'RB' },
      capSavings: 5000000,
    }),

    visitExtension: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'extension',
      subtype: 'player',
      player: { name: 'Franchise Player', position: 'DE' },
      contract: createPlayerContract(5, 150000000, 100000000),
    }),

    visitHire: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'hire',
      staff: { name: 'New Coach', role: 'Head Coach' },
      contract: createStaffContract(4, 40000000),
    }),

    visitFire: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'fire',
      staff: { name: 'Former Coach', role: 'Offensive Coordinator' },
    }),

    visitPromotion: () => ({
      ...base,
      teamIds: [teamIds[0]],
      type: 'promotion',
      staff: { name: 'Promoted Coach', role: 'Head Coach' },
      previousRole: 'Offensive Coordinator',
      contract: createStaffContract(5, 50000000),
    }),
  };
}

// Convenience function to create test data by type
export function createTestData(type: Parameters<typeof visitByType>[0], id: string, teamIds: TeamId[]): Transaction {
  return visitByType(type, createTestDataVisitor(id, teamIds));
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
        expectFn(decoded.draftPick).toEqual(original.draftPick);
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
        expectFn(decoded.subtype).toBe(original.subtype);
        if (original.subtype === 'player' && decoded.subtype === 'player') {
          expectFn(decoded.player).toEqual(original.player);
          expectFn(decoded.contract).toEqual(original.contract);
        }
        if (original.subtype === 'staff' && decoded.subtype === 'staff') {
          expectFn(decoded.staff).toEqual(original.staff);
          expectFn(decoded.contract).toEqual(original.contract);
        }
      }
    },

    visitHire: () => {
      if (original.type === 'hire' && decoded.type === 'hire') {
        expectFn(decoded.staff).toEqual(original.staff);
        expectFn(decoded.contract).toEqual(original.contract);
      }
    },

    visitFire: () => {
      if (original.type === 'fire' && decoded.type === 'fire') {
        expectFn(decoded.staff).toEqual(original.staff);
      }
    },

    visitPromotion: () => {
      if (original.type === 'promotion' && decoded.type === 'promotion') {
        expectFn(decoded.staff).toEqual(original.staff);
        expectFn(decoded.previousRole).toBe(original.previousRole);
        expectFn(decoded.contract).toEqual(original.contract);
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
