import {
  Transaction,
  Trade,
  Signing,
  DraftSelection,
  Release,
  Hire,
  Fire,
  Promotion,
  Team,
  Role,
  Player,
  Staff,
  PlayerContract,
  StaffContract,
  DraftPick,
  TradeAsset,
  PlayerAsset,
  CoachAsset,
  DraftPickAsset,
  ConditionalDraftPickAsset,
  Position,
  PlayerExtension,
  StaffExtension,
} from './types';
import { TransactionVisitor } from '@/lib/transactions/visitor';

// ============================================================================
// Decode helpers — convert raw JSONB data to domain types
// ============================================================================

// Convert raw JSONB player data to Player type
export function decodePlayer(raw: unknown): Player {
  const data = raw as { name: string; position: string };
  return {
    name: data.name,
    position: data.position as Position,
  };
}

// Convert raw JSONB contract data to PlayerContract type
export function decodeContract(raw: unknown): PlayerContract {
  return raw as { years: number; totalValue: number; guaranteed: number };
}

// Convert raw JSONB contract data to StaffContract type
export function decodeStaffContract(raw: unknown): StaffContract {
  return raw as { years: number; totalValue: number };
}

// Convert raw JSONB staff data to Staff type
export function decodeStaff(raw: unknown): Staff {
  const data = raw as { name: string; role: string };
  return {
    name: data.name,
    role: data.role as Role,
  };
}

// Convert raw JSONB draft pick data to DraftPick type
export function decodeDraftPick(raw: unknown): DraftPick {
  const data = raw as { ogTeamId: string; year: number; round: number; number?: number };
  return {
    ogTeamId: data.ogTeamId,
    year: data.year,
    round: data.round,
    ...(data.number != null ? { number: data.number } : {}),
  };
}

// Convert raw JSONB trade asset to TradeAsset type
export function decodeTradeAsset(raw: unknown): TradeAsset {
  const data = raw as { type: string; fromTeamId: string; toTeamId: string; [key: string]: unknown };

  switch (data.type) {
    case 'player':
      return {
        type: 'player',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        player: decodePlayer(data.player),
      } as PlayerAsset;
    case 'coach':
      return {
        type: 'coach',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        staff: decodeStaff(data.staff),
      } as CoachAsset;
    case 'draft_pick':
      return {
        type: 'draft_pick',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        draftPick: decodeDraftPick(data.draftPick),
      } as DraftPickAsset;
    case 'conditional_draft_pick':
      return {
        type: 'conditional_draft_pick',
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        draftPick: decodeDraftPick(data.draftPick),
        conditions: data.conditions as string,
      } as ConditionalDraftPickAsset;
    default:
      throw new Error(`Unknown trade asset type: ${data.type}`);
  }
}

// ============================================================================
// DbDecoderVisitor — visitor-based DB row decoder
// ============================================================================

interface DbRow {
  id: string;
  type: string;
  teamIds: string[];
  timestamp: Date;
  data: unknown;
}

export class DbDecoderVisitor implements TransactionVisitor<Transaction> {
  private readonly base: { id: string; teams: Team[]; timestamp: Date };
  private readonly data: Record<string, unknown>;

  constructor(dbTxn: DbRow, teamMap: Map<string, Team>) {
    this.data = dbTxn.data as Record<string, unknown>;
    this.base = {
      id: dbTxn.id,
      teams: dbTxn.teamIds.map((id) => teamMap.get(id)!).filter(Boolean),
      timestamp: dbTxn.timestamp,
    };
  }

  visitTrade(): Trade {
    const rawAssets = this.data.assets as unknown[];
    return {
      ...this.base,
      type: 'trade',
      assets: rawAssets.map(decodeTradeAsset),
    };
  }

  visitSigning(): Signing {
    return {
      ...this.base,
      type: 'signing',
      player: decodePlayer(this.data.player),
      contract: decodeContract(this.data.contract),
    };
  }

  visitDraft(): DraftSelection {
    return {
      ...this.base,
      type: 'draft',
      player: decodePlayer(this.data.player),
      draftPick: decodeDraftPick(this.data.draftPick),
    };
  }

  visitRelease(): Release {
    return {
      ...this.base,
      type: 'release',
      player: decodePlayer(this.data.player),
      capSavings: this.data.capSavings as number | undefined,
    };
  }

  visitExtension(): PlayerExtension | StaffExtension {
    if (this.data.subtype === 'staff') {
      return {
        ...this.base,
        type: 'extension',
        subtype: 'staff',
        staff: decodeStaff(this.data.staff),
        contract: decodeStaffContract(this.data.contract),
      };
    }
    return {
      ...this.base,
      type: 'extension',
      subtype: 'player',
      player: decodePlayer(this.data.player),
      contract: decodeContract(this.data.contract),
    };
  }

  visitHire(): Hire {
    return {
      ...this.base,
      type: 'hire',
      staff: decodeStaff(this.data.staff),
      contract: decodeStaffContract(this.data.contract ?? {}),
    };
  }

  visitFire(): Fire {
    return {
      ...this.base,
      type: 'fire',
      staff: decodeStaff(this.data.staff),
    };
  }

  visitPromotion(): Promotion {
    return {
      ...this.base,
      type: 'promotion',
      staff: decodeStaff(this.data.staff),
      previousRole: this.data.previousRole as Role,
      contract: decodeStaffContract(this.data.contract ?? {}),
    };
  }
}
