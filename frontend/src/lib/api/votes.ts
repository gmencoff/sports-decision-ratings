import { Team, Sentiment, VoteCounts } from '@/lib/data/types';

export interface TeamVoteData {
  counts: VoteCounts;
  userVote: Sentiment | null;
}

export async function loadVotes(
  transactionId: string,
  teams: Team[],
  userId: string
): Promise<Record<string, TeamVoteData>> {
  const params = new URLSearchParams({
    transactionId,
    teams: JSON.stringify(teams),
    userId,
  });

  const response = await fetch(`/api/votes?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load votes');
  }

  return response.json();
}

export async function submitVote(
  transactionId: string,
  teamId: string,
  userId: string,
  sentiment: Sentiment
): Promise<VoteCounts> {
  const response = await fetch('/api/votes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionId,
      teamId,
      userId,
      sentiment,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit vote');
  }

  return response.json();
}
