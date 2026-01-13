export interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

export type TransactionType =
  | 'trade'
  | 'signing'
  | 'draft'
  | 'release'
  | 'extension'
  | 'hire'
  | 'fire';

export interface Transaction {
  id: string;
  title: string;
  description: string;
  teams: Team[];
  type: TransactionType;
  timestamp: Date;
}

export interface Vote {
  transactionId: string;
  teamId: string;
  sentiment: 'good' | 'bad';
}

export interface VoteCounts {
  good: number;
  bad: number;
}

export interface TeamVoteCounts {
  teamId: string;
  counts: VoteCounts;
}
