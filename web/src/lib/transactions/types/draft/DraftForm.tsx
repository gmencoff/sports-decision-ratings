'use client';

import { useState } from 'react';
import { DraftSelection, Position, POSITIONS, NFL_TEAMS } from '@/lib/data/types';
import { FormProps } from '../../interface';
import { TransactionDateField } from '../../components/TransactionDateField';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

export function DraftForm({ value, onSubmit }: FormProps<DraftSelection>) {
  const [teamAbbreviation, setTeamAbbreviation] = useState(value.teams[0]?.abbreviation ?? sortedTeams[0].abbreviation);
  const [playerName, setPlayerName] = useState(value.player.name);
  const [playerPosition, setPlayerPosition] = useState<Position>(value.player.position);
  const [year, setYear] = useState(value.draftPick.year);
  const [round, setRound] = useState(value.draftPick.round);
  const [pick, setPick] = useState(value.draftPick.number ?? 1);
  const [differentOriginalTeam, setDifferentOriginalTeam] = useState(
    value.draftPick.ogTeamId !== '' && value.draftPick.ogTeamId !== (value.teams[0]?.id ?? '')
  );
  const [ogTeamId, setOgTeamId] = useState(value.draftPick.ogTeamId || (value.teams[0]?.id ?? sortedTeams[0].id));
  const [timestamp, setTimestamp] = useState(value.timestamp);

  const handleTeamChange = (abbreviation: string) => {
    setTeamAbbreviation(abbreviation);
    if (!differentOriginalTeam) {
      const team = NFL_TEAMS.find((t) => t.abbreviation === abbreviation);
      if (team) setOgTeamId(team.id);
    }
  };

  const handleDifferentOriginalTeamChange = (checked: boolean) => {
    setDifferentOriginalTeam(checked);
    if (!checked) {
      const team = NFL_TEAMS.find((t) => t.abbreviation === teamAbbreviation);
      if (team) setOgTeamId(team.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = NFL_TEAMS.find((t) => t.abbreviation === teamAbbreviation)!;
    onSubmit({
      id: value.id,
      type: 'draft',
      teams: [selectedTeam],
      timestamp,
      player: { name: playerName, position: playerPosition },
      draftPick: {
        ogTeamId: ogTeamId,
        year,
        round,
        number: pick,
      },
    });
  };

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
      <TransactionDateField timestamp={timestamp} onChange={setTimestamp} />

      <div>
        <label htmlFor="team" className="block text-sm font-medium">
          Team
        </label>
        <select
          id="team"
          value={teamAbbreviation}
          onChange={(e) => handleTeamChange(e.target.value)}
          className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
          required
        >
          {sortedTeams.map((team) => (
            <option key={team.abbreviation} value={team.abbreviation}>
              {team.abbreviation} - {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="differentOriginalTeam"
          checked={differentOriginalTeam}
          onChange={(e) => handleDifferentOriginalTeamChange(e.target.checked)}
        />
        <label htmlFor="differentOriginalTeam" className="text-sm font-medium">
          Original team differs from selecting team
        </label>
      </div>

      {differentOriginalTeam && (
        <div>
          <label htmlFor="ogTeam" className="block text-sm font-medium">
            Original Team
          </label>
          <select
            id="ogTeam"
            value={ogTeamId}
            onChange={(e) => setOgTeamId(e.target.value)}
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
      )}

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
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium">
            Year
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={2100}
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
            required
          />
        </div>

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
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
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
            className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
            required
          />
        </div>
      </div>
    </form>
  );
}
