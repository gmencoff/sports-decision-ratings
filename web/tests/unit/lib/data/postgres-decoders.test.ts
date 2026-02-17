import { describe, it, expect } from 'vitest';
import { decodePlayer, decodeStaff, decodeTradeAsset } from '@/lib/data/postgres';

describe('postgres decoders', () => {
  describe('decodePlayer', () => {
    it('should decode player with valid position', () => {
      const raw = { name: 'Patrick Mahomes', position: 'QB' };

      const player = decodePlayer(raw);

      expect(player).toEqual({ name: 'Patrick Mahomes', position: 'QB' });
    });

    it('should decode player with different positions', () => {
      const positions = ['RB', 'WR', 'TE', 'OT', 'CB', 'LB', 'S', 'K'];

      for (const position of positions) {
        const player = decodePlayer({ name: 'Test Player', position });
        expect(player.position).toBe(position);
      }
    });
  });

  describe('decodeStaff', () => {
    it('should decode staff with valid role', () => {
      const raw = { name: 'Andy Reid', role: 'Head Coach' };

      const staff = decodeStaff(raw);

      expect(staff).toEqual({ name: 'Andy Reid', role: 'Head Coach' });
    });

    it('should decode staff with different roles', () => {
      const roles = ['General Manager', 'Offensive Coordinator', 'Defensive Coordinator'];

      for (const role of roles) {
        const staff = decodeStaff({ name: 'Test Staff', role });
        expect(staff.role).toBe(role);
      }
    });
  });

  describe('decodeTradeAsset', () => {
    it('should decode player asset', () => {
      const raw = {
        type: 'player',
        fromTeamId: 'KC',
        toTeamId: 'NYJ',
        player: { name: 'Test Player', position: 'WR' },
      };

      const asset = decodeTradeAsset(raw);

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

      const asset = decodeTradeAsset(raw);

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

      const asset = decodeTradeAsset(raw);

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

      const asset = decodeTradeAsset(raw);

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

      expect(() => decodeTradeAsset(raw)).toThrow('Unknown trade asset type: unknown');
    });
  });
});
