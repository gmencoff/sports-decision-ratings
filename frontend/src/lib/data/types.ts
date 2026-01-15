export interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

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
  assets: Array<{
    fromTeamId: string;
    toTeamId: string;
    player?: string;
    draftPick?: string;
  }>;
}

export interface Signing extends TransactionBase {
  type: 'signing';
  player: string;
  contractYears: number;
  totalValue: number;
  guaranteed: number;
}

export interface DraftSelection extends TransactionBase {
  type: 'draft';
  player: string;
  round: number;
  pick: number;
  position: string;
}

export interface Release extends TransactionBase {
  type: 'release';
  player: string;
  capSavings?: number;
}

export interface Extension extends TransactionBase {
  type: 'extension';
  player: string;
  contractYears: number;
  totalValue: number;
  guaranteed: number;
}

export interface Hire extends TransactionBase {
  type: 'hire';
  person: string;
  role: string;
}

export interface Fire extends TransactionBase {
  type: 'fire';
  person: string;
  role: string;
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
