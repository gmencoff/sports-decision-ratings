import { NextRequest, NextResponse } from 'next/server';
import { Team, Sentiment, VoteCounts } from '@/lib/data/types';
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

// GET /api/votes?transactionId=...&teams=...&userId=...
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');
  const teamsJson = searchParams.get('teams');
  const userId = searchParams.get('userId');

  if (!transactionId || !teamsJson || !userId) {
    return NextResponse.json(
      { error: 'Missing required parameters: transactionId, teams, userId' },
      { status: 400 }
    );
  }

  let teams: Team[];
  try {
    teams = JSON.parse(teamsJson);
  } catch {
    return NextResponse.json(
      { error: 'Invalid teams parameter: must be valid JSON' },
      { status: 400 }
    );
  }

  const provider = await getDataProvider();
  const votes = await loadVotesImpl(provider, transactionId, teams, userId);

  return NextResponse.json(votes);
}

// POST /api/votes
export async function POST(request: NextRequest) {
  let body: { transactionId?: string; teamId?: string; userId?: string; sentiment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { transactionId, teamId, userId, sentiment } = body;

  if (!transactionId || !teamId || !userId || !sentiment) {
    return NextResponse.json(
      { error: 'Missing required fields: transactionId, teamId, userId, sentiment' },
      { status: 400 }
    );
  }

  if (!['good', 'bad', 'unsure'].includes(sentiment)) {
    return NextResponse.json(
      { error: 'Invalid sentiment: must be good, bad, or unsure' },
      { status: 400 }
    );
  }

  const provider = await getDataProvider();
  const counts = await submitVoteImpl(
    provider,
    transactionId,
    teamId,
    userId,
    sentiment as Sentiment
  );

  return NextResponse.json(counts);
}
