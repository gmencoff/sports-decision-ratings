import { eq, and, sql } from 'drizzle-orm';
import { getDb, type Database } from '../db';
import { votes, voteSummaries } from '../db/schema';
import type { Sentiment, VoteCounts } from '@/lib/data/types';
import { randomUUID } from 'crypto';

type SentimentColumn = 'goodCount' | 'badCount' | 'unsureCount';

const UNIQUE_VIOLATION_CODE = '23505';

function getSentimentColumn(sentiment: Sentiment): SentimentColumn {
  const map: Record<Sentiment, SentimentColumn> = {
    good: 'goodCount',
    bad: 'badCount',
    unsure: 'unsureCount',
  };
  return map[sentiment];
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code: string }).code === UNIQUE_VIOLATION_CODE
  );
}

export class VoteService {
  constructor(private db: Database = getDb()) {}

  async castVote(
    transactionId: string,
    teamId: string,
    voterId: string,
    sentiment: Sentiment
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // Check for existing vote with FOR UPDATE to lock the row
        const existingVote = await tx
          .select()
          .from(votes)
          .where(
            and(
              eq(votes.transactionId, transactionId),
              eq(votes.teamId, teamId),
              eq(votes.voterId, voterId)
            )
          )
          .for('update')
          .limit(1);

        if (existingVote.length === 0) {
          // No existing vote - insert new vote and update summary
          await tx.insert(votes).values({
            id: randomUUID(),
            transactionId,
            teamId,
            voterId,
            sentiment,
          });

          // Upsert vote summary
          const newColumn = getSentimentColumn(sentiment);
          await tx
            .insert(voteSummaries)
            .values({
              transactionId,
              teamId,
              [newColumn]: 1,
            })
            .onConflictDoUpdate({
              target: [voteSummaries.transactionId, voteSummaries.teamId],
              set: {
                [newColumn]: sql`${voteSummaries[newColumn]} + 1`,
              },
            });
        } else if (existingVote[0].sentiment !== sentiment) {
          // Different sentiment - update vote and adjust counters
          const oldSentiment = existingVote[0].sentiment as Sentiment;
          const oldColumn = getSentimentColumn(oldSentiment);
          const newColumn = getSentimentColumn(sentiment);

          // Update the vote
          await tx
            .update(votes)
            .set({
              sentiment,
              updatedAt: new Date(),
            })
            .where(eq(votes.id, existingVote[0].id));

          // Decrement old counter, increment new counter
          await tx
            .update(voteSummaries)
            .set({
              [oldColumn]: sql`GREATEST(${voteSummaries[oldColumn]} - 1, 0)`,
              [newColumn]: sql`${voteSummaries[newColumn]} + 1`,
            })
            .where(
              and(
                eq(voteSummaries.transactionId, transactionId),
                eq(voteSummaries.teamId, teamId)
              )
            );
        }
        // If same sentiment, no-op (idempotent)
      });
    } catch (error) {
      // Handle race condition: another request inserted the vote between
      // our SELECT and INSERT. Retry once to handle the existing vote.
      if (isUniqueViolation(error)) {
        await this.handleExistingVote(transactionId, teamId, voterId, sentiment);
        return;
      }
      throw error;
    }
  }

  // Handle vote update when we know the vote already exists (after unique violation)
  private async handleExistingVote(
    transactionId: string,
    teamId: string,
    voterId: string,
    sentiment: Sentiment
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existingVote = await tx
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.transactionId, transactionId),
            eq(votes.teamId, teamId),
            eq(votes.voterId, voterId)
          )
        )
        .for('update')
        .limit(1);

      if (existingVote.length === 0) {
        // Vote was deleted between error and retry - unlikely but handle gracefully
        return;
      }

      if (existingVote[0].sentiment !== sentiment) {
        const oldSentiment = existingVote[0].sentiment as Sentiment;
        const oldColumn = getSentimentColumn(oldSentiment);
        const newColumn = getSentimentColumn(sentiment);

        await tx
          .update(votes)
          .set({
            sentiment,
            updatedAt: new Date(),
          })
          .where(eq(votes.id, existingVote[0].id));

        await tx
          .update(voteSummaries)
          .set({
            [oldColumn]: sql`GREATEST(${voteSummaries[oldColumn]} - 1, 0)`,
            [newColumn]: sql`${voteSummaries[newColumn]} + 1`,
          })
          .where(
            and(
              eq(voteSummaries.transactionId, transactionId),
              eq(voteSummaries.teamId, teamId)
            )
          );
      }
      // Same sentiment - no-op
    });
  }

  async getVoteCounts(transactionId: string, teamId: string): Promise<VoteCounts> {
    const result = await this.db
      .select()
      .from(voteSummaries)
      .where(
        and(
          eq(voteSummaries.transactionId, transactionId),
          eq(voteSummaries.teamId, teamId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { good: 0, bad: 0, unsure: 0 };
    }

    return {
      good: result[0].goodCount,
      bad: result[0].badCount,
      unsure: result[0].unsureCount,
    };
  }

  async getUserVote(
    transactionId: string,
    teamId: string,
    voterId: string
  ): Promise<Sentiment | null> {
    const result = await this.db
      .select({ sentiment: votes.sentiment })
      .from(votes)
      .where(
        and(
          eq(votes.transactionId, transactionId),
          eq(votes.teamId, teamId),
          eq(votes.voterId, voterId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].sentiment as Sentiment;
  }
}

// Singleton instance
let voteServiceInstance: VoteService | null = null;

export function getVoteService(): VoteService {
  if (!voteServiceInstance) {
    voteServiceInstance = new VoteService();
  }
  return voteServiceInstance;
}

// For testing: reset instance
export function resetVoteService(): void {
  voteServiceInstance = null;
}
