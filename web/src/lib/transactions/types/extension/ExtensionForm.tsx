'use client';

import { useState } from 'react';
import { Extension, ExtensionSubtype, EXTENSION_SUBTYPES, PlayerExtension, StaffExtension } from '@/lib/data/types';
import { FormProps } from '../../interface';
import { PlayerExtensionForm } from './PlayerExtensionFields';
import { StaffExtensionForm } from './StaffExtensionFields';
import { TransactionDateField } from '../../components/TransactionDateField';

export const DEFAULT_PLAYER_EXTENSION: PlayerExtension = {
  id: '',
  type: 'extension',
  subtype: 'player',
  teamIds: [],
  timestamp: new Date(),
  player: { name: '', position: 'QB' },
  contract: {},
};

export const DEFAULT_STAFF_EXTENSION: StaffExtension = {
  id: '',
  type: 'extension',
  subtype: 'staff',
  teamIds: [],
  timestamp: new Date(),
  staff: { name: '', role: 'Head Coach' },
  contract: {},
};

export function ExtensionForm({ value, onSubmit }: FormProps<Extension>) {
  const isCreateMode = value.id === '';
  const [subtype, setSubtype] = useState<ExtensionSubtype>(value.subtype ?? 'player');
  const [timestamp, setTimestamp] = useState(value.timestamp);

  const playerValue: PlayerExtension = value.subtype === 'player'
    ? { ...value, timestamp }
    : { ...DEFAULT_PLAYER_EXTENSION, id: value.id, teamIds: value.teamIds, timestamp };

  const staffValue: StaffExtension = value.subtype === 'staff'
    ? { ...value, timestamp }
    : { ...DEFAULT_STAFF_EXTENSION, id: value.id, teamIds: value.teamIds, timestamp };

  return (
    <div className="space-y-4">
      <TransactionDateField timestamp={timestamp} onChange={setTimestamp} />

      {isCreateMode && (
        <div>
          <label htmlFor="extensionSubtype" className="block text-sm font-medium">
            Extension Type
          </label>
          <select
            id="extensionSubtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as ExtensionSubtype)}
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
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
