'use server';

import { Team, VoteCounts, Sentiment } from '@/lib/data/types';
import { DataProvider, getDataProvider } from '@/lib/data';

export interface TeamVoteData {
  counts: VoteCounts;
  userVote: Sentiment | null;
}

export async function loadVotesImpl(
  provider: DataProvider,
  transactionId: string,
  teams: Team[],
  userId: string
): Promise<Record<string, TeamVoteData>> {
  const result: Record<string, TeamVoteData> = {};

  for (const team of teams) {
    const [counts, userVote] = await Promise.all([
      provider.getVoteCounts(transactionId, team.id),
      provider.getUserVote(transactionId, team.id, userId),
    ]);
    result[team.id] = { counts, userVote };
  }

  return result;
}

export async function loadVotes(
  transactionId: string,
  teams: Team[],
  userId: string
): Promise<Record<string, TeamVoteData>> {
  const provider = await getDataProvider();
  return loadVotesImpl(provider, transactionId, teams, userId);
}

export async function submitVoteImpl(
  provider: DataProvider,
  transactionId: string,
  teamId: string,
  userId: string,
  sentiment: Sentiment
): Promise<VoteCounts> {
  await provider.submitVote({
    transactionId,
    teamId,
    userId,
    sentiment,
  });
  return provider.getVoteCounts(transactionId, teamId);
}

export async function submitVote(
  transactionId: string,
  teamId: string,
  userId: string,
  sentiment: Sentiment
): Promise<VoteCounts> {
  const provider = await getDataProvider();
  return submitVoteImpl(provider, transactionId, teamId, userId, sentiment);
}
