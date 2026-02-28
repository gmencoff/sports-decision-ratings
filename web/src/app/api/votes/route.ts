import { NextRequest, NextResponse } from 'next/server';
import { Sentiment, VoteCounts } from '@/lib/data/types';
import { DataProvider, getDataProvider } from '@/lib/data';
import { getVoterId } from '@/server/auth/voter-session';

export interface TeamVoteData {
  counts: VoteCounts;
  userVote: Sentiment | null;
}

export async function loadVotesImpl(
  provider: DataProvider,
  transactionId: string,
  teamIds: string[],
  userId: string
): Promise<Record<string, TeamVoteData>> {
  const result: Record<string, TeamVoteData> = {};

  for (const teamId of teamIds) {
    const [counts, userVote] = await Promise.all([
      provider.getVoteCounts(transactionId, teamId),
      provider.getUserVote(transactionId, teamId, userId),
    ]);
    result[teamId] = { counts, userVote };
  }

  return result;
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

// GET /api/votes?transactionId=...&teamIds=...
// userId is now derived from server-side session cookie
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');
  const teamIdsJson = searchParams.get('teamIds');

  if (!transactionId || !teamIdsJson) {
    return NextResponse.json(
      { error: 'Missing required parameters: transactionId, teamIds' },
      { status: 400 }
    );
  }

  let teamIds: string[];
  try {
    teamIds = JSON.parse(teamIdsJson);
  } catch {
    return NextResponse.json(
      { error: 'Invalid teamIds parameter: must be valid JSON' },
      { status: 400 }
    );
  }

  // Get voter ID from server-side session
  const voterId = await getVoterId();

  const provider = await getDataProvider();
  const votes = await loadVotesImpl(provider, transactionId, teamIds, voterId);

  return NextResponse.json(votes);
}

// POST /api/votes
// userId is now derived from server-side session cookie
export async function POST(request: NextRequest) {
  let body: { transactionId?: string; teamId?: string; sentiment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { transactionId, teamId, sentiment } = body;

  if (!transactionId || !teamId || !sentiment) {
    return NextResponse.json(
      { error: 'Missing required fields: transactionId, teamId, sentiment' },
      { status: 400 }
    );
  }

  if (!['good', 'bad', 'unsure'].includes(sentiment)) {
    return NextResponse.json(
      { error: 'Invalid sentiment: must be good, bad, or unsure' },
      { status: 400 }
    );
  }

  // Get voter ID from server-side session
  const voterId = await getVoterId();

  const provider = await getDataProvider();
  const counts = await submitVoteImpl(
    provider,
    transactionId,
    teamId,
    voterId,
    sentiment as Sentiment
  );

  return NextResponse.json(counts);
}
