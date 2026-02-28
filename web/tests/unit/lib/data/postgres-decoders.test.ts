import { describe, it, expect } from 'vitest';
import { decodeTransaction } from '@/lib/data/postgres-decoder';
import { PlayerSchema, StaffSchema, TradeAssetSchema } from '@/lib/data/types';

describe('postgres decoders', () => {
  describe('PlayerSchema.parse', () => {
    it('should decode player with valid position', () => {
      const raw = { name: 'Patrick Mahomes', position: 'QB' };

      const player = PlayerSchema.parse(raw);

      expect(player).toEqual({ name: 'Patrick Mahomes', position: 'QB' });
    });

    it('should decode player with different positions', () => {
      const positions = ['RB', 'WR', 'TE', 'OT', 'CB', 'LB', 'S', 'K'];

      for (const position of positions) {
        const player = PlayerSchema.parse({ name: 'Test Player', position });
        expect(player.position).toBe(position);
      }
    });
  });

  describe('StaffSchema.parse', () => {
    it('should decode staff with valid role', () => {
      const raw = { name: 'Andy Reid', role: 'Head Coach' };

      const staff = StaffSchema.parse(raw);

      expect(staff).toEqual({ name: 'Andy Reid', role: 'Head Coach' });
    });

    it('should decode staff with different roles', () => {
      const roles = ['General Manager', 'Offensive Coordinator', 'Defensive Coordinator'];

      for (const role of roles) {
        const staff = StaffSchema.parse({ name: 'Test Staff', role });
        expect(staff.role).toBe(role);
      }
    });
  });

  describe('TradeAssetSchema.parse', () => {
    it('should decode player asset', () => {
      const raw = {
        type: 'player',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        player: { name: 'Test Player', position: 'WR' },
      };

      const asset = TradeAssetSchema.parse(raw);

      expect(asset).toEqual({
        type: 'player',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        player: { name: 'Test Player', position: 'WR' },
      });
    });

    it('should decode coach asset', () => {
      const raw = {
        type: 'coach',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        staff: { name: 'Test Coach', role: 'Offensive Coordinator' },
      };

      const asset = TradeAssetSchema.parse(raw);

      expect(asset).toEqual({
        type: 'coach',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        staff: { name: 'Test Coach', role: 'Offensive Coordinator' },
      });
    });

    it('should decode draft pick asset', () => {
      const raw = {
        type: 'draft_pick',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        draftPick: { ogTeamId: 'KC', year: 2025, round: 3 },
      };

      const asset = TradeAssetSchema.parse(raw);

      expect(asset).toEqual({
        type: 'draft_pick',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        draftPick: { ogTeamId: 'KC', year: 2025, round: 3 },
      });
    });

    it('should decode conditional draft pick asset', () => {
      const raw = {
        type: 'conditional_draft_pick',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        draftPick: { ogTeamId: 'KC', year: 2025, round: 4 },
        conditions: 'Becomes 3rd if player makes Pro Bowl',
      };

      const asset = TradeAssetSchema.parse(raw);

      expect(asset).toEqual({
        type: 'conditional_draft_pick',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        draftPick: { ogTeamId: 'KC', year: 2025, round: 4 },
        conditions: 'Becomes 3rd if player makes Pro Bowl',
      });
    });

    it('should throw for unknown asset type', () => {
      const raw = {
        type: 'unknown',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
      };

      expect(() => TradeAssetSchema.parse(raw)).toThrow();
    });
  });

  describe('decodeTransaction', () => {
    it('should decode a signing from a DB row', () => {
      const dbRow = {
        id: 'txn-1',
        type: 'signing',
        teamIds: ['KC'],
        timestamp: new Date('2025-01-01'),
        data: { player: { name: 'Patrick Mahomes', position: 'QB' }, contract: { years: 5, totalValue: 250000000 } },
      };

      const txn = decodeTransaction(dbRow);

      expect(txn.type).toBe('signing');
      expect(txn.id).toBe('txn-1');
    });
  });
});
