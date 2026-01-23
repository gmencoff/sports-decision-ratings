'use client';

import { useState } from 'react';
import { DraftSelection } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function DraftForm({ value, onSubmit }: FormProps<DraftSelection>) {
  const [title, setTitle] = useState(value?.title ?? '');
  const [description, setDescription] = useState(value?.description ?? '');
  const [playerName, setPlayerName] = useState(value?.player?.name ?? '');
  const [playerPosition, setPlayerPosition] = useState(value?.player?.position ?? '');
  const [round, setRound] = useState(value?.round ?? 1);
  const [pick, setPick] = useState(value?.pick ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value?.id ?? '',
      type: 'draft',
      title,
      description,
      teams: value?.teams ?? [],
      timestamp: value?.timestamp ?? new Date(),
      player: { name: playerName, position: playerPosition },
      round,
      pick,
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

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {value ? 'Update Draft Selection' : 'Create Draft Selection'}
      </button>
    </form>
  );
}
