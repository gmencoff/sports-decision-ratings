'use client';

import { useState } from 'react';
import { Extension, ExtensionSubtype, EXTENSION_SUBTYPES, PlayerExtension, StaffExtension } from '@/lib/data/types';
import { FormProps } from '../../interface';
import { PlayerExtensionForm } from './PlayerExtensionFields';
import { StaffExtensionForm } from './StaffExtensionFields';

export const DEFAULT_PLAYER_EXTENSION: PlayerExtension = {
  id: '',
  type: 'extension',
  subtype: 'player',
  teams: [],
  timestamp: new Date(),
  player: { name: '', position: 'QB' },
  contract: {},
};

export const DEFAULT_STAFF_EXTENSION: StaffExtension = {
  id: '',
  type: 'extension',
  subtype: 'staff',
  teams: [],
  timestamp: new Date(),
  staff: { name: '', role: 'Head Coach' },
  contract: {},
};

export function ExtensionForm({ value, onSubmit }: FormProps<Extension>) {
  const isCreateMode = value.id === '';
  const [subtype, setSubtype] = useState<ExtensionSubtype>(value.subtype ?? 'player');

  const playerValue: PlayerExtension = value.subtype === 'player'
    ? value
    : { ...DEFAULT_PLAYER_EXTENSION, id: value.id, teams: value.teams, timestamp: value.timestamp };

  const staffValue: StaffExtension = value.subtype === 'staff'
    ? value
    : { ...DEFAULT_STAFF_EXTENSION, id: value.id, teams: value.teams, timestamp: value.timestamp };

  return (
    <div className="space-y-4">
      {isCreateMode && (
        <div>
          <label htmlFor="extensionSubtype" className="block text-sm font-medium">
            Extension Type
          </label>
          <select
            id="extensionSubtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as ExtensionSubtype)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            {EXTENSION_SUBTYPES.map((st) => (
              <option key={st} value={st}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {subtype === 'player' ? (
        <PlayerExtensionForm value={playerValue} onSubmit={onSubmit} />
      ) : (
        <StaffExtensionForm value={staffValue} onSubmit={onSubmit} />
      )}
    </div>
  );
}
