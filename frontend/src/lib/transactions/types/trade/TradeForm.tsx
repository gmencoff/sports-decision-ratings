'use client';

import { useState } from 'react';
import {
  Trade,
  TradeAsset,
  PlayerAsset,
  CoachAsset,
  DraftPickAsset,
  ConditionalDraftPickAsset,
  NFL_TEAMS,
  Position,
  POSITIONS,
  Role,
  ROLES,
  Team,
} from '@/lib/data/types';
import { FormProps } from '../../interface';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

type AssetType = 'player' | 'coach' | 'draft_pick' | 'conditional_draft_pick';

interface AssetFormData {
  type: AssetType;
  fromTeamId: string;
  toTeamId: string;
  // Player fields
  playerName?: string;
  playerPosition?: Position;
  // Coach fields
  staffName?: string;
  staffRole?: Role;
  // Draft pick fields
  ogTeamId?: string; // Team that originally owns the draft pick
  year?: number;
  round?: number;
  // Conditional draft pick fields
  conditions?: string;
}

export function TradeForm({ value, onSubmit }: FormProps<Trade>) {
  const defaultFromTeamId = value.teams[0]?.id ?? sortedTeams[0].id;
  const defaultToTeamId = value.teams[1]?.id ?? sortedTeams[1]?.id ?? sortedTeams[0].id;
  
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
          ogTeamId: asset.ogTeamId,
          year: asset.year,
          round: asset.round,
        };
      } else {
        return {
          ...base,
          ogTeamId: asset.ogTeamId,
          year: asset.year,
          round: asset.round,
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
          ogTeamId: asset.ogTeamId!,
          year: asset.year!,
          round: asset.round!,
        } as DraftPickAsset;
      } else {
        return {
          ...base,
          type: 'conditional_draft_pick' as const,
          ogTeamId: asset.ogTeamId!,
          year: asset.year!,
          round: asset.round!,
          conditions: asset.conditions!,
        } as ConditionalDraftPickAsset;
      }
    });

    // Collect all unique teams from assets
    const teamIds = new Set<string>();
    tradeAssets.forEach((asset) => {
      teamIds.add(asset.fromTeamId);
      teamIds.add(asset.toTeamId);
      // For draft picks, also include the team that originally owns the pick
      if (asset.type === 'draft_pick' || asset.type === 'conditional_draft_pick') {
        teamIds.add(asset.ogTeamId);
      }
    });
    const teams: Team[] = Array.from(teamIds)
      .map((id) => NFL_TEAMS.find((t) => t.id === id))
      .filter((t): t is Team => t !== undefined);

    onSubmit({
      id: value.id,
      type: 'trade',
      teams,
      timestamp: value.timestamp,
      assets: tradeAssets,
    });
  };

  const renderAssetForm = (asset: AssetFormData, index: number) => {
    return (
      <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Asset {index + 1}</h3>
          <button
            type="button"
            onClick={() => removeAsset(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">From Team</label>
            <select
              value={asset.fromTeamId}
              onChange={(e) => updateAsset(index, { fromTeamId: e.target.value })}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
              onChange={(e) => updateAsset(index, { toTeamId: e.target.value })}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Position</label>
              <select
                value={asset.playerPosition || 'QB'}
                onChange={(e) => updateAsset(index, { playerPosition: e.target.value as Position })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={asset.staffRole || 'Head Coach'}
                onChange={(e) => updateAsset(index, { staffRole: e.target.value as Role })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
                onChange={(e) => updateAsset(index, { ogTeamId: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
          </>
        )}

        {asset.type === 'conditional_draft_pick' && (
          <div>
            <label className="block text-sm font-medium">Conditions</label>
            <textarea
              value={asset.conditions || ''}
              onChange={(e) => updateAsset(index, { conditions: e.target.value })}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
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
          <p className="text-sm text-gray-500 py-4 text-center border border-gray-200 rounded">
            No assets added yet. Click &quot;Add Asset&quot; to get started.
          </p>
        ) : (
          <div className="space-y-4">{assets.map((asset, index) => renderAssetForm(asset, index))}</div>
        )}
      </div>
    </form>
  );
}
