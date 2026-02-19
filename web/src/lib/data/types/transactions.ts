import { Team, Player, Staff, PlayerContract, StaffContract, Role } from './core';
import { TradeAsset, DraftPick } from './trade';

// Shared base fields for all transactions
interface TransactionBase {
  id: string; // unique identifier for the transaction
  teams: Team[]; // teams involved in the transaction
  timestamp: Date; // date that the transaction occured
}

// Type-specific transaction interfaces
export interface Trade extends TransactionBase {
  type: 'trade';
  assets: TradeAsset[];
}

export interface Signing extends TransactionBase {
  type: 'signing';
  player: Player;
  contract: PlayerContract;
}

export interface DraftSelection extends TransactionBase {
  type: 'draft';
  player: Player;
  draftPick: DraftPick;
}

export interface Release extends TransactionBase {
  type: 'release';
  player: Player;
  capSavings?: number;
}

export const EXTENSION_SUBTYPES = ['player', 'staff'] as const;
export type ExtensionSubtype = (typeof EXTENSION_SUBTYPES)[number];

export interface PlayerExtension extends TransactionBase {
  type: 'extension';
  subtype: 'player';
  player: Player;
  contract: PlayerContract;
}

export interface StaffExtension extends TransactionBase {
  type: 'extension';
  subtype: 'staff';
  staff: Staff;
  contract: StaffContract;
}

export type Extension = PlayerExtension | StaffExtension;

export interface Hire extends TransactionBase {
  type: 'hire';
  staff: Staff;
  contract: StaffContract;
}

export interface Fire extends TransactionBase {
  type: 'fire';
  staff: Staff;
}

export interface Promotion extends TransactionBase {
  type: 'promotion';
  staff: Staff;            // staff with their NEW role
  previousRole: Role;      // what they were before
  contract: StaffContract; // new contract terms
}

// Discriminated union of all transaction types
export type Transaction =
  | Trade
  | Signing
  | DraftSelection
  | Release
  | Extension
  | Hire
  | Fire
  | Promotion;

// Distributive Omit that works properly with union types
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// Input type for creating transactions (id is generated server-side)
export type TransactionInput = DistributiveOmit<Transaction, 'id'>;

// Single source of truth for transaction types
export const TRANSACTION_TYPES = ['trade', 'signing', 'draft', 'release', 'extension', 'hire', 'fire', 'promotion'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
