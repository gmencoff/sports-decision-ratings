import { DataProvider } from './index';
import { Transaction, Team, Vote, VoteCounts } from './types';

// Sample NFL teams
const TEAMS: Record<string, Team> = {
  KC: { id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC' },
  SF: { id: 'SF', name: 'San Francisco 49ers', abbreviation: 'SF' },
  PHI: { id: 'PHI', name: 'Philadelphia Eagles', abbreviation: 'PHI' },
  DAL: { id: 'DAL', name: 'Dallas Cowboys', abbreviation: 'DAL' },
  BUF: { id: 'BUF', name: 'Buffalo Bills', abbreviation: 'BUF' },
  MIA: { id: 'MIA', name: 'Miami Dolphins', abbreviation: 'MIA' },
  DET: { id: 'DET', name: 'Detroit Lions', abbreviation: 'DET' },
  GB: { id: 'GB', name: 'Green Bay Packers', abbreviation: 'GB' },
  BAL: { id: 'BAL', name: 'Baltimore Ravens', abbreviation: 'BAL' },
  CLE: { id: 'CLE', name: 'Cleveland Browns', abbreviation: 'CLE' },
  NYJ: { id: 'NYJ', name: 'New York Jets', abbreviation: 'NYJ' },
  LV: { id: 'LV', name: 'Las Vegas Raiders', abbreviation: 'LV' },
  CHI: { id: 'CHI', name: 'Chicago Bears', abbreviation: 'CHI' },
  LAR: { id: 'LAR', name: 'Los Angeles Rams', abbreviation: 'LAR' },
};

// Sample transactions
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Chiefs trade for Pro Bowl WR',
    description:
      'Kansas City acquires DeAndre Hopkins from Tennessee for a 2025 3rd round pick and a 2026 5th round pick.',
    teams: [TEAMS.KC],
    type: 'trade',
    timestamp: new Date('2025-01-10T14:30:00Z'),
    assets: [
      { type: 'player', fromTeamId: 'TEN', toTeamId: 'KC', player: { name: 'DeAndre Hopkins', position: 'WR' } },
      { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'TEN', year: 2025, round: 3 },
      { type: 'draft_pick', fromTeamId: 'KC', toTeamId: 'TEN', year: 2026, round: 5 },
    ],
  },
  {
    id: '2',
    title: 'Saquon Barkley signs with Eagles',
    description:
      'Philadelphia signs RB Saquon Barkley to a 3-year, $37.75 million contract with $26 million guaranteed.',
    teams: [TEAMS.PHI],
    type: 'signing',
    timestamp: new Date('2025-01-09T10:00:00Z'),
    player: { name: 'Saquon Barkley', position: 'RB' },
    contractYears: 3,
    totalValue: 37750000,
    guaranteed: 26000000,
  },
  {
    id: '3',
    title: 'Cowboys and Jets complete blockbuster trade',
    description:
      'Dallas trades Micah Parsons to the Jets for their 2025 1st, 2026 1st, and Sauce Gardner.',
    teams: [TEAMS.DAL, TEAMS.NYJ],
    type: 'trade',
    timestamp: new Date('2025-01-08T16:45:00Z'),
    assets: [
      { type: 'player', fromTeamId: 'DAL', toTeamId: 'NYJ', player: { name: 'Micah Parsons', position: 'LB' } },
      { type: 'draft_pick', fromTeamId: 'NYJ', toTeamId: 'DAL', year: 2025, round: 1 },
      { type: 'draft_pick', fromTeamId: 'NYJ', toTeamId: 'DAL', year: 2026, round: 1 },
      { type: 'player', fromTeamId: 'NYJ', toTeamId: 'DAL', player: { name: 'Sauce Gardner', position: 'CB' } },
    ],
  },
  {
    id: '4',
    title: 'Lions extend Amon-Ra St. Brown',
    description:
      'Detroit signs WR Amon-Ra St. Brown to a 4-year, $120 million extension, making him the highest-paid WR in NFL history.',
    teams: [TEAMS.DET],
    type: 'extension',
    timestamp: new Date('2025-01-07T12:00:00Z'),
    player: { name: 'Amon-Ra St. Brown', position: 'WR' },
    contractYears: 4,
    totalValue: 120000000,
    guaranteed: 80000000,
  },
  {
    id: '5',
    title: 'Bears hire Ben Johnson as head coach',
    description:
      'Chicago hires Lions offensive coordinator Ben Johnson as their new head coach on a 6-year deal.',
    teams: [TEAMS.CHI],
    type: 'hire',
    timestamp: new Date('2025-01-06T09:30:00Z'),
    staff: { name: 'Ben Johnson', role: 'Head Coach' },
  },
  {
    id: '6',
    title: 'Raiders release Jimmy Garoppolo',
    description:
      'Las Vegas releases QB Jimmy Garoppolo, saving $11.25 million in cap space.',
    teams: [TEAMS.LV],
    type: 'release',
    timestamp: new Date('2025-01-05T15:00:00Z'),
    player: { name: 'Jimmy Garoppolo', position: 'QB' },
    capSavings: 11250000,
  },
  {
    id: '7',
    title: 'Ravens and Bills swap picks and players',
    description:
      'Baltimore trades their 2025 2nd round pick to Buffalo for Stefon Diggs and a 2026 4th rounder.',
    teams: [TEAMS.BAL, TEAMS.BUF],
    type: 'trade',
    timestamp: new Date('2025-01-04T11:20:00Z'),
    assets: [
      { type: 'draft_pick', fromTeamId: 'BAL', toTeamId: 'BUF', year: 2025, round: 2 },
      { type: 'player', fromTeamId: 'BUF', toTeamId: 'BAL', player: { name: 'Stefon Diggs', position: 'WR' } },
      { type: 'draft_pick', fromTeamId: 'BUF', toTeamId: 'BAL', year: 2026, round: 4 },
    ],
  },
  {
    id: '8',
    title: 'Packers select Caleb Williams with 1st overall pick',
    description:
      'Green Bay uses their first overall pick (acquired from Chicago) to draft USC QB Caleb Williams.',
    teams: [TEAMS.GB],
    type: 'draft',
    timestamp: new Date('2025-01-03T20:00:00Z'),
    player: { name: 'Caleb Williams', position: 'QB' },
    round: 1,
    pick: 1,
  },
];

// In-memory vote storage
type VoteKey = `${string}-${string}`; // transactionId-teamId
const voteStorage: Map<VoteKey, VoteCounts> = new Map();

// Initialize with some random votes for demo purposes
function initializeVotes(): void {
  MOCK_TRANSACTIONS.forEach((transaction) => {
    transaction.teams.forEach((team) => {
      const key: VoteKey = `${transaction.id}-${team.id}`;
      voteStorage.set(key, {
        good: Math.floor(Math.random() * 500) + 50,
        bad: Math.floor(Math.random() * 300) + 20,
        unsure: Math.floor(Math.random() * 200) + 10,
      });
    });
  });
}

initializeVotes();

export class MockDataProvider implements DataProvider {
  async getTransactions(): Promise<Transaction[]> {
    // Return transactions sorted by timestamp (newest first)
    return [...MOCK_TRANSACTIONS].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return MOCK_TRANSACTIONS.find((t) => t.id === id) || null;
  }

  async getVoteCounts(
    transactionId: string,
    teamId: string
  ): Promise<VoteCounts> {
    const key: VoteKey = `${transactionId}-${teamId}`;
    return voteStorage.get(key) || { good: 0, bad: 0, unsure: 0 };
  }

  async submitVote(vote: Vote): Promise<void> {
    const key: VoteKey = `${vote.transactionId}-${vote.teamId}`;
    const current = voteStorage.get(key) || { good: 0, bad: 0, unsure: 0 };

    if (vote.sentiment === 'good') {
      current.good += 1;
    } else if (vote.sentiment === 'bad') {
      current.bad += 1;
    } else {
      current.unsure += 1;
    }

    voteStorage.set(key, current);
  }
}
