import { z } from 'zod';

export const SENTIMENTS = ['good', 'bad', 'unsure'] as const;

export const SentimentSchema = z.enum(SENTIMENTS);
export type Sentiment = z.infer<typeof SentimentSchema>;

export const VoteSchema = z.object({
  transactionId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  sentiment: SentimentSchema,
});
export type Vote = z.infer<typeof VoteSchema>;

export const VoteCountsSchema = z.object({
  good: z.number(),
  bad: z.number(),
  unsure: z.number(),
});
export type VoteCounts = z.infer<typeof VoteCountsSchema>;

export const TeamVoteCountsSchema = z.object({
  teamId: z.string(),
  counts: VoteCountsSchema,
});
export type TeamVoteCounts = z.infer<typeof TeamVoteCountsSchema>;
