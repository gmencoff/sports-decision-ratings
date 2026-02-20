export const SENTIMENTS = ['good', 'bad', 'unsure'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export interface Vote {
  transactionId: string;
  teamId: string;
  userId: string;
  sentiment: Sentiment;
}

export interface VoteCounts {
  good: number;
  bad: number;
  unsure: number;
}

export interface TeamVoteCounts {
  teamId: string;
  counts: VoteCounts;
}
