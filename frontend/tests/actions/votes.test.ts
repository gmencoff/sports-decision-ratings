import { describe, it, expect, vi } from 'vitest';
import { loadVotesImpl, submitVoteImpl } from '@/app/actions/votes';
import { createMockDataProvider } from '../mocks/mockDataProvider';
import { Team } from '@/lib/data/types';

describe('votes actions', () => {
  const mockTeams: Team[] = [
    { id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC', division: 'East' },
    { id: 'team-2', name: 'Team B', abbreviation: 'TB', conference: 'NFC', division: 'West' },
  ];

  describe('loadVotesImpl', () => {
    it('should load vote counts and user votes for all teams', async () => {
      const mockProvider = createMockDataProvider({
        getVoteCounts: vi.fn()
          .mockResolvedValueOnce({ good: 10, bad: 5, unsure: 2 })
          .mockResolvedValueOnce({ good: 3, bad: 8, unsure: 1 }),
        getUserVote: vi.fn()
          .mockResolvedValueOnce('good')
          .mockResolvedValueOnce(null),
      });

      const result = await loadVotesImpl(mockProvider, 'tx-1', mockTeams, 'user-123');

      expect(mockProvider.getVoteCounts).toHaveBeenCalledTimes(2);
      expect(mockProvider.getVoteCounts).toHaveBeenCalledWith('tx-1', 'team-1');
      expect(mockProvider.getVoteCounts).toHaveBeenCalledWith('tx-1', 'team-2');

      expect(mockProvider.getUserVote).toHaveBeenCalledTimes(2);
      expect(mockProvider.getUserVote).toHaveBeenCalledWith('tx-1', 'team-1', 'user-123');
      expect(mockProvider.getUserVote).toHaveBeenCalledWith('tx-1', 'team-2', 'user-123');

      expect(result['team-1']).toEqual({
        counts: { good: 10, bad: 5, unsure: 2 },
        userVote: 'good',
      });
      expect(result['team-2']).toEqual({
        counts: { good: 3, bad: 8, unsure: 1 },
        userVote: null,
      });
    });

    it('should handle empty teams array', async () => {
      const mockProvider = createMockDataProvider();

      const result = await loadVotesImpl(mockProvider, 'tx-1', [], 'user-123');

      expect(mockProvider.getVoteCounts).not.toHaveBeenCalled();
      expect(mockProvider.getUserVote).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should handle single team', async () => {
      const mockProvider = createMockDataProvider({
        getVoteCounts: vi.fn().mockResolvedValue({ good: 5, bad: 3, unsure: 1 }),
        getUserVote: vi.fn().mockResolvedValue('bad'),
      });

      const singleTeam: Team[] = [{ id: 'team-1', name: 'Team A', abbreviation: 'TA', conference: 'AFC', division: 'East' }];
      const result = await loadVotesImpl(mockProvider, 'tx-1', singleTeam, 'user-123');

      expect(result['team-1']).toEqual({
        counts: { good: 5, bad: 3, unsure: 1 },
        userVote: 'bad',
      });
    });
  });

  describe('submitVoteImpl', () => {
    it('should submit vote and return updated counts', async () => {
      const mockProvider = createMockDataProvider({
        submitVote: vi.fn().mockResolvedValue(undefined),
        getVoteCounts: vi.fn().mockResolvedValue({ good: 11, bad: 5, unsure: 2 }),
      });

      const result = await submitVoteImpl(mockProvider, 'tx-1', 'team-1', 'user-123', 'good');

      expect(mockProvider.submitVote).toHaveBeenCalledWith({
        transactionId: 'tx-1',
        teamId: 'team-1',
        userId: 'user-123',
        sentiment: 'good',
      });
      expect(mockProvider.getVoteCounts).toHaveBeenCalledWith('tx-1', 'team-1');
      expect(result).toEqual({ good: 11, bad: 5, unsure: 2 });
    });

    it('should handle different sentiments', async () => {
      const mockProvider = createMockDataProvider({
        submitVote: vi.fn().mockResolvedValue(undefined),
        getVoteCounts: vi.fn().mockResolvedValue({ good: 5, bad: 6, unsure: 2 }),
      });

      await submitVoteImpl(mockProvider, 'tx-1', 'team-1', 'user-123', 'bad');

      expect(mockProvider.submitVote).toHaveBeenCalledWith({
        transactionId: 'tx-1',
        teamId: 'team-1',
        userId: 'user-123',
        sentiment: 'bad',
      });
    });

    it('should propagate errors from submitVote', async () => {
      const mockProvider = createMockDataProvider({
        submitVote: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(
        submitVoteImpl(mockProvider, 'tx-1', 'team-1', 'user-123', 'good')
      ).rejects.toThrow('Network error');
    });
  });
});
