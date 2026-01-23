'use client';

import { useState } from 'react';
import { Release } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function ReleaseForm({ value, onSubmit }: FormProps<Release>) {
  const [title, setTitle] = useState(value?.title ?? '');
  const [description, setDescription] = useState(value?.description ?? '');
  const [playerName, setPlayerName] = useState(value?.player?.name ?? '');
  const [playerPosition, setPlayerPosition] = useState(value?.player?.position ?? '');
  const [capSavings, setCapSavings] = useState(value?.capSavings ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value?.id ?? '',
      type: 'release',
      title,
      description,
      teams: value?.teams ?? [],
      timestamp: value?.timestamp ?? new Date(),
      player: { name: playerName, position: playerPosition },
      capSavings: capSavings || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

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
          <input
            type="text"
            id="playerPosition"
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="capSavings" className="block text-sm font-medium">
          Cap Savings ($) (optional)
        </label>
        <input
          type="number"
          id="capSavings"
          value={capSavings}
          onChange={(e) => setCapSavings(Number(e.target.value))}
          min={0}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {value ? 'Update Release' : 'Create Release'}
      </button>
    </form>
  );
}
