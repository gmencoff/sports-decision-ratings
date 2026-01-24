export interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

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
  year: number;
  round: number;
}

export interface ConditionalDraftPickAsset extends TradeAssetBase {
  type: 'conditional_draft_pick';
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

// Helper type to extract the transaction type string
export type TransactionType = Transaction['type'];

export type Sentiment = 'good' | 'bad' | 'unsure';

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
