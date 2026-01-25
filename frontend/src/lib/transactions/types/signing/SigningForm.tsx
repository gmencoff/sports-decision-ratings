'use client';

import { useState } from 'react';
import { Signing, Position, POSITIONS } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function SigningForm({ value, onSubmit }: FormProps<Signing>) {
  const [playerName, setPlayerName] = useState(value.player.name);
  const [playerPosition, setPlayerPosition] = useState<Position>(value.player.position);
  const [contractYears, setContractYears] = useState(value.contractYears);
  const [totalValue, setTotalValue] = useState(value.totalValue);
  const [guaranteed, setGuaranteed] = useState(value.guaranteed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value.id,
      type: 'signing',
      teams: value.teams,
      timestamp: value.timestamp,
      player: { name: playerName, position: playerPosition },
      contractYears,
      totalValue,
      guaranteed,
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="contractYears" className="block text-sm font-medium">
            Contract Years
          </label>
          <input
            type="number"
            id="contractYears"
            value={contractYears}
            onChange={(e) => setContractYears(Number(e.target.value))}
            min={1}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="totalValue" className="block text-sm font-medium">
            Total Value ($)
          </label>
          <input
            type="number"
            id="totalValue"
            value={totalValue}
            onChange={(e) => setTotalValue(Number(e.target.value))}
            min={0}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="guaranteed" className="block text-sm font-medium">
            Guaranteed ($)
          </label>
          <input
            type="number"
            id="guaranteed"
            value={guaranteed}
            onChange={(e) => setGuaranteed(Number(e.target.value))}
            min={0}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>
      </div>
    </form>
  );
}
