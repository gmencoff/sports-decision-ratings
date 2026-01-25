'use client';

import { useState } from 'react';
import { DraftSelection, Position, POSITIONS } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function DraftForm({ value, onSubmit }: FormProps<DraftSelection>) {
  const [playerName, setPlayerName] = useState(value.player.name);
  const [playerPosition, setPlayerPosition] = useState<Position>(value.player.position);
  const [round, setRound] = useState(value.round);
  const [pick, setPick] = useState(value.pick);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value.id,
      type: 'draft',
      teams: value.teams,
      timestamp: value.timestamp,
      player: { name: playerName, position: playerPosition },
      round,
      pick,
    });
  };

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium">
            Player Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="playerPosition" className="block text-sm font-medium">
            Position
          </label>
          <select
            id="playerPosition"
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value as Position)}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="round" className="block text-sm font-medium">
            Round
          </label>
          <input
            type="number"
            id="round"
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
            min={1}
            max={7}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="pick" className="block text-sm font-medium">
            Pick
          </label>
          <input
            type="number"
            id="pick"
            value={pick}
            onChange={(e) => setPick(Number(e.target.value))}
            min={1}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>
      </div>
    </form>
  );
}
