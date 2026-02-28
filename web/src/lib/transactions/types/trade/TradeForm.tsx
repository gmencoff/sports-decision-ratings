'use client';

import { useState } from 'react';
import {
  Trade,
  TradeAsset,
  PlayerAsset,
  CoachAsset,
  DraftPickAsset,
  ConditionalDraftPickAsset,
  TeamId,
  NFL_TEAMS,
  Position,
  POSITIONS,
  Role,
  ROLES,
} from '@/lib/data/types';
import { FormProps } from '../../interface';
import { TransactionDateField } from '../../components/TransactionDateField';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

type AssetType = 'player' | 'coach' | 'draft_pick' | 'conditional_draft_pick';

interface AssetFormData {
  type: AssetType;
  fromTeamId: TeamId;
  toTeamId: TeamId;
  // Player fields
  playerName?: string;
  playerPosition?: Position;
  // Coach fields
  staffName?: string;
  staffRole?: Role;
  // Draft pick fields
  ogTeamId?: TeamId; // Team that originally owns the draft pick
  year?: number;
  round?: number;
  pickNumber?: number;
  pickNumberKnown?: boolean;
  // Conditional draft pick fields
  conditions?: string;
}

export function TradeForm({ value, onSubmit }: FormProps<Trade>) {
  const defaultFromTeamId = value.teamIds[0] ?? sortedTeams[0].id;
  const defaultToTeamId = value.teamIds[1] ?? sortedTeams[1]?.id ?? sortedTeams[0].id;
  
  const [timestamp, setTimestamp] = useState(value.timestamp);

  const [assets, setAssets] = useState<AssetFormData[]>(() => {
    if (value.assets.length === 0) {
      return [];
    }
    return value.assets.map((asset) => {
      const base = {
        type: asset.type,
        fromTeamId: asset.fromTeamId,
        toTeamId: asset.toTeamId,
      };
      if (asset.type === 'player') {
        return {
          ...base,
          playerName: asset.player.name,
          playerPosition: asset.player.position,
        };
      } else if (asset.type === 'coach') {
        return {
          ...base,
          staffName: asset.staff.name,
          staffRole: asset.staff.role,
        };
      } else if (asset.type === 'draft_pick') {
        return {
          ...base,
          ogTeamId: asset.draftPick.ogTeamId,
          year: asset.draftPick.year,
          round: asset.draftPick.round,
          pickNumber: asset.draftPick.number,
          pickNumberKnown: asset.draftPick.number != null,
        };
      } else {
        return {
          ...base,
          ogTeamId: asset.draftPick.ogTeamId,
          year: asset.draftPick.year,
          round: asset.draftPick.round,
          pickNumber: asset.draftPick.number,
          pickNumberKnown: asset.draftPick.number != null,
          conditions: asset.conditions,
        };
      }
    });
  });

  const addAsset = () => {
    setAssets([
      ...assets,
      {
        type: 'player',
        fromTeamId: defaultFromTeamId,
        toTeamId: defaultToTeamId,
        playerName: '',
        playerPosition: 'QB',
      },
    ]);
  };

  const removeAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const updateAsset = (index: number, updates: Partial<AssetFormData>) => {
    setAssets(
      assets.map((asset, i) => (i === index ? { ...asset, ...updates } : asset))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tradeAssets: TradeAsset[] = assets.map((asset) => {
      const base = {
        fromTeamId: asset.fromTeamId,
        toTeamId: asset.toTeamId,
      };
      
      if (asset.type === 'player') {
        return {
          ...base,
          type: 'player' as const,
          player: {
            name: asset.playerName!,
            position: asset.playerPosition!,
          },
        } as PlayerAsset;
      } else if (asset.type === 'coach') {
        return {
          ...base,
          type: 'coach' as const,
          staff: {
            name: asset.staffName!,
            role: asset.staffRole!,
          },
        } as CoachAsset;
      } else if (asset.type === 'draft_pick') {
        return {
          ...base,
          type: 'draft_pick' as const,
          draftPick: {
            ogTeamId: asset.ogTeamId!,
            year: asset.year!,
            round: asset.round!,
            ...(asset.pickNumberKnown && asset.pickNumber != null ? { number: asset.pickNumber } : {}),
          },
        } as DraftPickAsset;
      } else {
        return {
          ...base,
          type: 'conditional_draft_pick' as const,
          draftPick: {
            ogTeamId: asset.ogTeamId!,
            year: asset.year!,
            round: asset.round!,
            ...(asset.pickNumberKnown && asset.pickNumber != null ? { number: asset.pickNumber } : {}),
          },
          conditions: asset.conditions!,
        } as ConditionalDraftPickAsset;
      }
    });

    // Collect all unique team IDs from assets
    const teamIdSet = new Set<TeamId>();
    tradeAssets.forEach((asset) => {
      teamIdSet.add(asset.fromTeamId);
      teamIdSet.add(asset.toTeamId);
    });

    onSubmit({
      id: value.id,
      type: 'trade',
      teamIds: Array.from(teamIdSet),
      timestamp,
      assets: tradeAssets,
    });
  };

  const renderAssetForm = (asset: AssetFormData, index: number) => {
    return (
      <div key={index} className="border border-border-default rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Asset {index + 1}</h3>
          <button
            type="button"
            onClick={() => removeAsset(index)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
          >
            Remove
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">From Team</label>
            <select
              value={asset.fromTeamId}
              onChange={(e) => updateAsset(index, { fromTeamId: e.target.value as TeamId })}
              className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
              required
            >
              {sortedTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.abbreviation} - {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">To Team</label>
            <select
              value={asset.toTeamId}
              onChange={(e) => updateAsset(index, { toTeamId: e.target.value as TeamId })}
              className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
              required
            >
              {sortedTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.abbreviation} - {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Asset Type</label>
          <select
            value={asset.type}
            onChange={(e) => {
              const newType = e.target.value as AssetType;
              const baseUpdate: Partial<AssetFormData> = { type: newType };
              
              // Reset fields when changing type
              if (newType === 'player') {
                baseUpdate.playerName = '';
                baseUpdate.playerPosition = 'QB';
              } else if (newType === 'coach') {
                baseUpdate.staffName = '';
                baseUpdate.staffRole = 'Head Coach';
              } else if (newType === 'draft_pick' || newType === 'conditional_draft_pick') {
                baseUpdate.ogTeamId = asset.fromTeamId; // Default to fromTeamId, but user can change it
                baseUpdate.year = new Date().getFullYear();
                baseUpdate.round = 1;
                if (newType === 'conditional_draft_pick') {
                  baseUpdate.conditions = '';
                }
              }
              
              updateAsset(index, baseUpdate);
            }}
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
            required
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="draft_pick">Draft Pick</option>
            <option value="conditional_draft_pick">Conditional Draft Pick</option>
          </select>
        </div>

        {asset.type === 'player' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Player Name</label>
              <input
                type="text"
                value={asset.playerName || ''}
                onChange={(e) => updateAsset(index, { playerName: e.target.value })}
                className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Position</label>
              <select
                value={asset.playerPosition || 'QB'}
                onChange={(e) => updateAsset(index, { playerPosition: e.target.value as Position })}
                className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                required
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {asset.type === 'coach' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Staff Name</label>
              <input
                type="text"
                value={asset.staffName || ''}
                onChange={(e) => updateAsset(index, { staffName: e.target.value })}
                className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={asset.staffRole || 'Head Coach'}
                onChange={(e) => updateAsset(index, { staffRole: e.target.value as Role })}
                className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                required
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(asset.type === 'draft_pick' || asset.type === 'conditional_draft_pick') && (
          <>
            <div>
              <label className="block text-sm font-medium">Original Owner</label>
              <select
                value={asset.ogTeamId || asset.fromTeamId}
                onChange={(e) => updateAsset(index, { ogTeamId: e.target.value as TeamId })}
                className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                required
              >
                {sortedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.abbreviation} - {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Year</label>
                <input
                  type="number"
                  value={asset.year || new Date().getFullYear()}
                  onChange={(e) => updateAsset(index, { year: Number(e.target.value) })}
                  min={2000}
                  max={2100}
                  className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Round</label>
                <input
                  type="number"
                  value={asset.round || 1}
                  onChange={(e) => updateAsset(index, { round: Number(e.target.value) })}
                  min={1}
                  max={7}
                  className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`pickNumberKnown-${index}`}
                  checked={asset.pickNumberKnown || false}
                  onChange={(e) =>
                    updateAsset(index, {
                      pickNumberKnown: e.target.checked,
                      pickNumber: e.target.checked ? (asset.pickNumber ?? 1) : undefined,
                    })
                  }
                />
                <label htmlFor={`pickNumberKnown-${index}`} className="text-sm font-medium">
                  Pick Number
                </label>
              </div>
              {asset.pickNumberKnown ? (
                <input
                  type="number"
                  aria-label="Pick Number"
                  value={asset.pickNumber ?? 1}
                  onChange={(e) => updateAsset(index, { pickNumber: Number(e.target.value) })}
                  min={1}
                  className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
                />
              ) : (
                <div className="mt-1 block w-full rounded border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-muted">
                  Unknown
                </div>
              )}
            </div>
          </>
        )}

        {asset.type === 'conditional_draft_pick' && (
          <div>
            <label className="block text-sm font-medium">Conditions</label>
            <textarea
              value={asset.conditions || ''}
              onChange={(e) => updateAsset(index, { conditions: e.target.value })}
              className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
              rows={3}
              required
              placeholder="e.g., If player makes Pro Bowl, becomes 2nd round pick"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
      <TransactionDateField timestamp={timestamp} onChange={setTimestamp} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium">Trade Assets</label>
          <button
            type="button"
            onClick={addAsset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center border border-border-default rounded">
            No assets added yet. Click &quot;Add Asset&quot; to get started.
          </p>
        ) : (
          <div className="space-y-4">{assets.map((asset, index) => renderAssetForm(asset, index))}</div>
        )}
      </div>
    </form>
  );
}
