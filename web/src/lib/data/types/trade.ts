import { z } from 'zod';
import { TeamIdSchema, PlayerSchema, StaffSchema } from './core';

const TradeAssetBaseSchema = z.object({
  fromTeamId: TeamIdSchema,
  toTeamId: TeamIdSchema,
});

export const PlayerAssetSchema = TradeAssetBaseSchema.extend({
  type: z.literal('player'),
  player: PlayerSchema,
});

export const CoachAssetSchema = TradeAssetBaseSchema.extend({
  type: z.literal('coach'),
  staff: StaffSchema,
});

export const DraftPickSchema = z.object({
  ogTeamId: TeamIdSchema,
  year: z.number(),
  round: z.number(),
  number: z.number().optional(),
});

export const DraftPickAssetSchema = TradeAssetBaseSchema.extend({
  type: z.literal('draft_pick'),
  draftPick: DraftPickSchema,
});

export const ConditionalDraftPickAssetSchema = TradeAssetBaseSchema.extend({
  type: z.literal('conditional_draft_pick'),
  draftPick: DraftPickSchema,
  conditions: z.string(),
});

export const TradeAssetSchema = z.discriminatedUnion('type', [
  PlayerAssetSchema,
  CoachAssetSchema,
  DraftPickAssetSchema,
  ConditionalDraftPickAssetSchema,
]);

export type PlayerAsset = z.infer<typeof PlayerAssetSchema>;
export type CoachAsset = z.infer<typeof CoachAssetSchema>;
export type DraftPick = z.infer<typeof DraftPickSchema>;
export type DraftPickAsset = z.infer<typeof DraftPickAssetSchema>;
export type ConditionalDraftPickAsset = z.infer<typeof ConditionalDraftPickAssetSchema>;
export type TradeAsset = z.infer<typeof TradeAssetSchema>;
