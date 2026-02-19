import { Player, Staff } from './core';

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

export interface DraftPick {
  ogTeamId: string;
  year: number;
  round: number;
  number?: number;
}

export interface DraftPickAsset extends TradeAssetBase {
  type: 'draft_pick';
  draftPick: DraftPick;
}

export interface ConditionalDraftPickAsset extends TradeAssetBase {
  type: 'conditional_draft_pick';
  draftPick: DraftPick;
  conditions: string;
}

export type TradeAsset =
  | PlayerAsset
  | CoachAsset
  | DraftPickAsset
  | ConditionalDraftPickAsset;
