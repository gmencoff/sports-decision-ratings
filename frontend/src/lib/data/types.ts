export interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Player {
  name: string;
  position: string;
}

export interface Staff {
  name: string;
  role: string;
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
  title: string;
  description: string;
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

export interface Vote {
  transactionId: string;
  teamId: string;
  sentiment: 'good' | 'bad' | 'unsure';
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
