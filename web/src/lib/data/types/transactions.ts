import { z } from 'zod';
import { TeamIdSchema, PlayerSchema, PlayerContractSchema, StaffSchema, StaffContractSchema, RoleSchema } from './core';
import { TradeAssetSchema, DraftPickSchema } from './trade';

const TransactionBaseSchema = z.object({
  id: z.string(),
  teamIds: z.array(TeamIdSchema),
  timestamp: z.date(),
});

export const TradeSchema = TransactionBaseSchema.extend({
  type: z.literal('trade'),
  assets: z.array(TradeAssetSchema),
});

export const SigningSchema = TransactionBaseSchema.extend({
  type: z.literal('signing'),
  player: PlayerSchema,
  contract: PlayerContractSchema,
});

export const DraftSelectionSchema = TransactionBaseSchema.extend({
  type: z.literal('draft'),
  player: PlayerSchema,
  draftPick: DraftPickSchema,
});

export const ReleaseSchema = TransactionBaseSchema.extend({
  type: z.literal('release'),
  player: PlayerSchema,
  capSavings: z.number().optional(),
});

export const EXTENSION_SUBTYPES = ['player', 'staff'] as const;
export type ExtensionSubtype = (typeof EXTENSION_SUBTYPES)[number];

export const PlayerExtensionSchema = TransactionBaseSchema.extend({
  type: z.literal('extension'),
  subtype: z.literal('player'),
  player: PlayerSchema,
  contract: PlayerContractSchema,
});

export const StaffExtensionSchema = TransactionBaseSchema.extend({
  type: z.literal('extension'),
  subtype: z.literal('staff'),
  staff: StaffSchema,
  contract: StaffContractSchema,
});

export const ExtensionSchema = z.discriminatedUnion('subtype', [
  PlayerExtensionSchema,
  StaffExtensionSchema,
]);

export const HireSchema = TransactionBaseSchema.extend({
  type: z.literal('hire'),
  staff: StaffSchema,
  contract: StaffContractSchema,
});

export const FireSchema = TransactionBaseSchema.extend({
  type: z.literal('fire'),
  staff: StaffSchema,
});

export const PromotionSchema = TransactionBaseSchema.extend({
  type: z.literal('promotion'),
  staff: StaffSchema,
  previousRole: RoleSchema,
  contract: StaffContractSchema,
});

// z.union used instead of z.discriminatedUnion because 'extension' maps to two subtypes
export const TransactionSchema = z.union([
  TradeSchema,
  SigningSchema,
  DraftSelectionSchema,
  ReleaseSchema,
  PlayerExtensionSchema,
  StaffExtensionSchema,
  HireSchema,
  FireSchema,
  PromotionSchema,
]);

export type Trade = z.infer<typeof TradeSchema>;
export type Signing = z.infer<typeof SigningSchema>;
export type DraftSelection = z.infer<typeof DraftSelectionSchema>;
export type Release = z.infer<typeof ReleaseSchema>;
export type PlayerExtension = z.infer<typeof PlayerExtensionSchema>;
export type StaffExtension = z.infer<typeof StaffExtensionSchema>;
export type Extension = z.infer<typeof ExtensionSchema>;
export type Hire = z.infer<typeof HireSchema>;
export type Fire = z.infer<typeof FireSchema>;
export type Promotion = z.infer<typeof PromotionSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;

// Distributive Omit that works properly with union types
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// Input type for creating transactions (id is generated server-side)
export type TransactionInput = DistributiveOmit<Transaction, 'id'>;

// Single source of truth for transaction types
export const TRANSACTION_TYPES = ['trade', 'signing', 'draft', 'release', 'extension', 'hire', 'fire', 'promotion'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
