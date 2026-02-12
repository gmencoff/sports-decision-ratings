import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, schema } from './setup';
import { VoteService } from '@/server/services/vote-service';

describe('VoteService Integration', () => {
  let voteService: VoteService;
  const testTransactionId = 'test-tx-1';
  const testTeamId = 'KC';
  const testVoterId = 'test-voter-hash-123';

  beforeEach(async () => {
    const db = getTestDb();
    voteService = new VoteService(db);

    // Insert a test transaction
    await db.insert(schema.transactions).values({
      id: testTransactionId,
      type: 'trade',
      teamIds: [testTeamId],
      timestamp: new Date(),
      data: { assets: [] },
    });
  });

  describe('castVote', () => {
    it('should create a new vote and update summary', async () => {
      await voteService.castVote(testTransactionId, testTeamId, testVoterId, 'good');

      const counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 1, bad: 0, unsure: 0 });

      const userVote = await voteService.getUserVote(testTransactionId, testTeamId, testVoterId);
      expect(userVote).toBe('good');
    });

    it('should be idempotent for same sentiment', async () => {
      await voteService.castVote(testTransactionId, testTeamId, testVoterId, 'good');
      await voteService.castVote(testTransactionId, testTeamId, testVoterId, 'good');

      const counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 1, bad: 0, unsure: 0 });
    });

    it('should update vote when sentiment changes', async () => {
      await voteService.castVote(testTransactionId, testTeamId, testVoterId, 'good');
      await voteService.castVote(testTransactionId, testTeamId, testVoterId, 'bad');

      const counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 0, bad: 1, unsure: 0 });

      const userVote = await voteService.getUserVote(testTransactionId, testTeamId, testVoterId);
      expect(userVote).toBe('bad');
    });

    it('should handle multiple voters independently', async () => {
      const voter1 = 'voter-1';
      const voter2 = 'voter-2';
      const voter3 = 'voter-3';

      await voteService.castVote(testTransactionId, testTeamId, voter1, 'good');
      await voteService.castVote(testTransactionId, testTeamId, voter2, 'bad');
      await voteService.castVote(testTransactionId, testTeamId, voter3, 'good');

      const counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 2, bad: 1, unsure: 0 });
    });

    it('should handle vote changes correctly with multiple voters', async () => {
      const voter1 = 'voter-1';
      const voter2 = 'voter-2';

      await voteService.castVote(testTransactionId, testTeamId, voter1, 'good');
      await voteService.castVote(testTransactionId, testTeamId, voter2, 'good');

      let counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 2, bad: 0, unsure: 0 });

      // Voter 1 changes vote
      await voteService.castVote(testTransactionId, testTeamId, voter1, 'unsure');

      counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 1, bad: 0, unsure: 1 });
    });
  });

  describe('getVoteCounts', () => {
    it('should return zero counts for transaction with no votes', async () => {
      const counts = await voteService.getVoteCounts(testTransactionId, testTeamId);
      expect(counts).toEqual({ good: 0, bad: 0, unsure: 0 });
    });
  });

  describe('getUserVote', () => {
    it('should return null for user who has not voted', async () => {
      const userVote = await voteService.getUserVote(
        testTransactionId,
        testTeamId,
        'non-existent-voter'
      );
      expect(userVote).toBeNull();
    });
  });
});
