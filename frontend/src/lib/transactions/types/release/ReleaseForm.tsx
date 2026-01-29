'use client';

import { useState } from 'react';
import { Release, Position, POSITIONS, NFL_TEAMS } from '@/lib/data/types';
import { FormProps } from '../../interface';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

export function ReleaseForm({ value, onSubmit }: FormProps<Release>) {
  const [teamAbbreviation, setTeamAbbreviation] = useState(value.teams[0]?.abbreviation ?? sortedTeams[0].abbreviation);
  const [playerName, setPlayerName] = useState(value.player.name);
  const [playerPosition, setPlayerPosition] = useState<Position>(value.player.position);
  const [capSavings, setCapSavings] = useState(value.capSavings ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = NFL_TEAMS.find((t) => t.abbreviation === teamAbbreviation)!;
    onSubmit({
      id: value.id,
      type: 'release',
      teams: [selectedTeam],
      timestamp: value.timestamp,
      player: { name: playerName, position: playerPosition },
      capSavings: capSavings || undefined,
    });
  };

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="team" className="block text-sm font-medium">
          Team
        </label>
        <select
          id="team"
          value={teamAbbreviation}
          onChange={(e) => setTeamAbbreviation(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        >
          {sortedTeams.map((team) => (
            <option key={team.abbreviation} value={team.abbreviation}>
              {team.abbreviation} - {team.name}
            </option>
          ))}
        </select>
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
    </form>
  );
}
