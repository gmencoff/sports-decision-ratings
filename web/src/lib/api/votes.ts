import { TeamId, Sentiment, VoteCounts } from '@/lib/data/types';

export interface TeamVoteData {
  counts: VoteCounts;
  userVote: Sentiment | null;
}

/**
 * Load votes for a transaction across multiple teams.
 * User identity is handled server-side via session cookies.
 */
export async function loadVotes(
  transactionId: string,
  teamIds: TeamId[]
): Promise<Record<string, TeamVoteData>> {
  const params = new URLSearchParams({
    transactionId,
    teamIds: JSON.stringify(teamIds),
  });

  const response = await fetch(`/api/votes?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load votes');
  }

  return response.json();
}

/**
 * Submit a vote for a transaction.
 * User identity is handled server-side via session cookies.
 */
export async function submitVote(
  transactionId: string,
  teamId: string,
  sentiment: Sentiment
): Promise<VoteCounts> {
  const response = await fetch('/api/votes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionId,
      teamId,
      sentiment,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit vote');
  }

  return response.json();
}
