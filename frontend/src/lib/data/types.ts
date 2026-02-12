export type Conference = 'AFC' | 'NFC';
export type Division = 'North' | 'South' | 'East' | 'West';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
}

export const NFL_TEAMS: Team[] = [
  // AFC East
  { id: 'BUF', name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
  { id: 'MIA', name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
  { id: 'NE', name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East' },
  { id: 'NYJ', name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
  // AFC North
  { id: 'BAL', name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
  { id: 'CIN', name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
  { id: 'CLE', name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
  { id: 'PIT', name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
  // AFC South
  { id: 'HOU', name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
  { id: 'IND', name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South' },
  { id: 'JAX', name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
  { id: 'TEN', name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
  // AFC West
  { id: 'DEN', name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
  { id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
  { id: 'LV', name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West' },
  { id: 'LAC', name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
  // NFC East
  { id: 'DAL', name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
  { id: 'NYG', name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
  { id: 'PHI', name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
  { id: 'WAS', name: 'Washington Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East' },
  // NFC North
  { id: 'CHI', name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
  { id: 'DET', name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
  { id: 'GB', name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North' },
  { id: 'MIN', name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
  // NFC South
  { id: 'ATL', name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
  { id: 'CAR', name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
  { id: 'NO', name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South' },
  { id: 'TB', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South' },
  // NFC West
  { id: 'ARI', name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
  { id: 'LAR', name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
  { id: 'SF', name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
  { id: 'SEA', name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
];

export const POSITIONS = [
  'QB',
  'RB',
  'FB',
  'WR',
  'TE',
  'OT',
  'OG',
  'C',
  'DE',
  'DT',
  'NT',
  'LB',
  'CB',
  'S',
  'K',
  'P',
  'LS',
] as const;

export type Position = (typeof POSITIONS)[number];

export interface Player {
  name: string;
  position: Position;
}

export const ROLES = [
  'President',
  'General Manager',
  'Head Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Special Teams Coordinator',
  'Quarterbacks Coach',
  'Running Backs Coach',
  'Wide Receivers Coach',
  'Tight Ends Coach',
  'Offensive Line Coach',
  'Defensive Line Coach',
  'Linebackers Coach',
  'Defensive Backs Coach',
  'Strength and Conditioning Coach',
  'Assistant Coach',
] as const;

export type Role = (typeof ROLES)[number];

export interface Staff {
  name: string;
  role: Role;
}

// Trade asset types
interface TradeAssetBase {
  fromTeamId: string;
  toTeamId: string;
}

export interface PlayerAsset extends TradeAssetBase {
  type: 'player';
  player: Player;
}

export interface CoachAsset extends TradeAssetBase {
  type: 'coach';
  staff: Staff;
}

export interface DraftPickAsset extends TradeAssetBase {
  type: 'draft_pick';
  ogTeamId: string;
  year: number;
  round: number;
}

export interface ConditionalDraftPickAsset extends TradeAssetBase {
  type: 'conditional_draft_pick';
  ogTeamId: string;
  year: number;
  round: number;
  conditions: string;
}

export type TradeAsset =
  | PlayerAsset
  | CoachAsset
  | DraftPickAsset
  | ConditionalDraftPickAsset;

// Shared base fields for all transactions
interface TransactionBase {
  id: string;
  teams: Team[];
  timestamp: Date;
}

// Type-specific transaction interfaces
export interface Trade extends TransactionBase {
  type: 'trade';
  assets: TradeAsset[];
}

export interface Signing extends TransactionBase {
  type: 'signing';
  player: Player;
  contractYears: number;
  totalValue: number;
  guaranteed: number;
}

export interface DraftSelection extends TransactionBase {
  type: 'draft';
  player: Player;
  round: number;
  pick: number;
}

export interface Release extends TransactionBase {
  type: 'release';
  player: Player;
  capSavings?: number;
}

export interface Extension extends TransactionBase {
  type: 'extension';
  player: Player;
  contractYears: number;
  totalValue: number;
  guaranteed: number;
}

export interface Hire extends TransactionBase {
  type: 'hire';
  staff: Staff;
}

export interface Fire extends TransactionBase {
  type: 'fire';
  staff: Staff;
}

// Discriminated union of all transaction types
export type Transaction =
  | Trade
  | Signing
  | DraftSelection
  | Release
  | Extension
  | Hire
  | Fire;

// Distributive Omit that works properly with union types
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

// Input type for creating transactions (id is generated server-side)
export type TransactionInput = DistributiveOmit<Transaction, 'id'>;

// Single source of truth for transaction types
export const TRANSACTION_TYPES = ['trade', 'signing', 'draft', 'release', 'extension', 'hire', 'fire'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

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

// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
