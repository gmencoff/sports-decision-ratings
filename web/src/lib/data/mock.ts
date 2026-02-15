import { DataProvider } from './index';
import { Transaction, Team, Vote, VoteCounts, PaginatedResult, Sentiment, NFL_TEAMS, createPlayerContract, createStaffContract } from './types';

const DEFAULT_PAGE_SIZE = 10;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function encodeCursor(timestamp: Date, id: string): string {
  return Buffer.from(`${timestamp.toISOString()}:${id}`).toString('base64');
}

function decodeCursor(cursor: string): { timestamp: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [isoString, id] = decoded.split(':');
    return { timestamp: new Date(isoString), id };
  } catch {
    return null;
  }
}

// Create a lookup map from NFL_TEAMS
const TEAMS: Record<string, Team> = Object.fromEntries(
  NFL_TEAMS.map((team) => [team.id, team])
);

// Sample transactions
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    teams: [TEAMS.KC],
    type: 'trade',
    timestamp: new Date('2025-01-10T14:30:00Z'),
    assets: [
      { type: 'player', fromTeamId: 'TEN', toTeamId: 'KC', player: { name: 'DeAndre Hopkins', position: 'WR' } },
      { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'TEN', ogTeamId: 'KC', year: 2025, round: 3 },
      { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'TEN', ogTeamId: 'KC', year: 2026, round: 5 },
    ],
  },
  {
    id: '2',
    teams: [TEAMS.PHI],
    type: 'signing',
    timestamp: new Date('2025-01-09T10:00:00Z'),
    player: { name: 'Saquon Barkley', position: 'RB' },
    contract: createPlayerContract(3, 37750000, 26000000),
  },
  {
    id: '3',
    teams: [TEAMS.DAL, TEAMS.NYJ],
    type: 'trade',
    timestamp: new Date('2025-01-08T16:45:00Z'),
    assets: [
      { type: 'player', fromTeamId: 'DAL', toTeamId: 'NYJ', player: { name: 'Micah Parsons', position: 'LB' } },
      { type: 'draft_pick', fromTeamId: 'NYJ', toTeamId: 'DAL', ogTeamId: 'NYJ', year: 2025, round: 1 },
      { type: 'draft_pick', fromTeamId: 'NYJ', toTeamId: 'DAL', ogTeamId: 'NYJ', year: 2026, round: 1 },
      { type: 'player', fromTeamId: 'NYJ', toTeamId: 'DAL', player: { name: 'Sauce Gardner', position: 'CB' } },
    ],
  },
  {
    id: '4',
    teams: [TEAMS.DET],
    type: 'extension',
    subtype: 'player',
    timestamp: new Date('2025-01-07T12:00:00Z'),
    player: { name: 'Amon-Ra St. Brown', position: 'WR' },
    contract: createPlayerContract(4, 120000000, 80000000),
  },
  {
    id: '11',
    teams: [TEAMS.SF],
    type: 'extension',
    subtype: 'staff',
    timestamp: new Date('2025-01-07T11:00:00Z'),
    staff: { name: 'Kyle Shanahan', role: 'Head Coach' },
    contract: createStaffContract(6, 60000000),
  },
  {
    id: '5',
    teams: [TEAMS.CHI],
    type: 'hire',
    timestamp: new Date('2025-01-06T09:30:00Z'),
    staff: { name: 'Ben Johnson', role: 'Head Coach' },
    contract: createStaffContract(5, 50000000),
  },
  {
    id: '6',
    teams: [TEAMS.LV],
    type: 'release',
    timestamp: new Date('2025-01-05T15:00:00Z'),
    player: { name: 'Jimmy Garoppolo', position: 'QB' },
    capSavings: 11250000,
  },
  {
    id: '7',
    teams: [TEAMS.BAL, TEAMS.BUF],
    type: 'trade',
    timestamp: new Date('2025-01-04T11:20:00Z'),
    assets: [
      { type: 'draft_pick', fromTeamId: 'BAL', toTeamId: 'BUF', ogTeamId: 'BAL', year: 2025, round: 2 },
      { type: 'player', fromTeamId: 'BUF', toTeamId: 'BAL', player: { name: 'Stefon Diggs', position: 'WR' } },
      { type: 'draft_pick', fromTeamId: 'BUF', toTeamId: 'BAL', ogTeamId: 'BUF', year: 2026, round: 4 },
    ],
  },
  {
    id: '8',
    teams: [TEAMS.GB],
    type: 'draft',
    timestamp: new Date('2025-01-03T20:00:00Z'),
    player: { name: 'Caleb Williams', position: 'QB' },
    round: 1,
    pick: 1,
  },
  {
    id: '9',
    teams: [TEAMS.DAL],
    type: 'fire',
    timestamp: new Date('2025-01-02T08:00:00Z'),
    staff: { name: 'Mike McCarthy', role: 'Head Coach' },
  },
  {
    id: '10',
    teams: [TEAMS.NYJ],
    type: 'draft',
    timestamp: new Date('2025-01-01T19:00:00Z'),
    player: { name: 'Marvin Harrison Jr.', position: 'WR' },
    round: 1,
    pick: 4,
  },
];

// In-memory vote storage - stores individual votes
type VoteKey = `${string}-${string}-${string}`; // transactionId-teamId-userId
const voteStorage: Map<VoteKey, Sentiment> = new Map();

// Helper to generate vote key
function getVoteKey(transactionId: string, teamId: string, userId: string): VoteKey {
  return `${transactionId}-${teamId}-${userId}`;
}

// Helper to calculate vote counts from stored votes
function calculateVoteCounts(transactionId: string, teamId: string): VoteCounts {
  const counts: VoteCounts = { good: 0, bad: 0, unsure: 0 };
  const prefix = `${transactionId}-${teamId}-`;

  for (const [key, sentiment] of voteStorage.entries()) {
    if (key.startsWith(prefix)) {
      counts[sentiment] += 1;
    }
  }

  return counts;
}

// Initialize with some random votes for demo purposes
function initializeVotes(): void {
  MOCK_TRANSACTIONS.forEach((transaction) => {
    transaction.teams.forEach((team) => {
      // Generate random votes from fake users
      const goodVotes = Math.floor(Math.random() * 500) + 50;
      const badVotes = Math.floor(Math.random() * 300) + 20;
      const unsureVotes = Math.floor(Math.random() * 200) + 10;

      for (let i = 0; i < goodVotes; i++) {
        const key = getVoteKey(transaction.id, team.id, `fake-user-good-${i}`);
        voteStorage.set(key, 'good');
      }
      for (let i = 0; i < badVotes; i++) {
        const key = getVoteKey(transaction.id, team.id, `fake-user-bad-${i}`);
        voteStorage.set(key, 'bad');
      }
      for (let i = 0; i < unsureVotes; i++) {
        const key = getVoteKey(transaction.id, team.id, `fake-user-unsure-${i}`);
        voteStorage.set(key, 'unsure');
      }
    });
  });
}

initializeVotes();

export class MockDataProvider implements DataProvider {
  async getTransactions(
    limit: number = DEFAULT_PAGE_SIZE,
    cursor?: string
  ): Promise<PaginatedResult<Transaction>> {
    // Sort transactions by timestamp (newest first), then by id for stable ordering
    const sorted = [...MOCK_TRANSACTIONS].sort((a, b) => {
      const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.localeCompare(a.id);
    });

    // Find starting position based on cursor
    let startIndex = 0;
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        startIndex = sorted.findIndex((t) => {
          const timeDiff = decoded.timestamp.getTime() - t.timestamp.getTime();
          if (timeDiff !== 0) return timeDiff > 0;
          return decoded.id.localeCompare(t.id) >= 0;
        });
        if (startIndex === -1) startIndex = sorted.length;
      }
    }

    // Get the page of results
    const pageData = sorted.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < sorted.length;

    // Generate next cursor from last item
    const nextCursor = hasMore && pageData.length > 0
      ? encodeCursor(pageData[pageData.length - 1].timestamp, pageData[pageData.length - 1].id)
      : undefined;

    return {
      data: pageData,
      nextCursor,
      hasMore,
    };
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return MOCK_TRANSACTIONS.find((t) => t.id === id) || null;
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    MOCK_TRANSACTIONS.push(transaction);
    return transaction;
  }

  async editTransaction(id: string, transaction: Transaction): Promise<Transaction | null> {
    const index = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }
    MOCK_TRANSACTIONS[index] = { ...transaction, id };
    return MOCK_TRANSACTIONS[index];
  }

  async getVoteCounts(
    transactionId: string,
    teamId: string
  ): Promise<VoteCounts> {
    await delay(1000);
    return calculateVoteCounts(transactionId, teamId);
  }

  async getUserVote(
    transactionId: string,
    teamId: string,
    userId: string
  ): Promise<Sentiment | null> {
    await delay(1000);
    const key = getVoteKey(transactionId, teamId, userId);
    return voteStorage.get(key) || null;
  }

  async submitVote(vote: Vote): Promise<void> {
    const key = getVoteKey(vote.transactionId, vote.teamId, vote.userId);
    // Upsert: simply set the vote, overwriting any previous vote
    voteStorage.set(key, vote.sentiment);
  }
}
