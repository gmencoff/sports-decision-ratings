'use client';

import { useState } from 'react';
import { Promotion, Role, ROLES, NFL_TEAMS, getTeamById, StaffContract } from '@/lib/data/types';
import { FormProps } from '../../interface';
import { StaffContractFormFields } from '../../components/StaffContractFormFields';
import { TransactionDateField } from '../../components/TransactionDateField';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

export function PromotionForm({ value, onSubmit }: FormProps<Promotion>) {
  const [teamAbbreviation, setTeamAbbreviation] = useState(
    getTeamById(value.teamIds[0])?.abbreviation ?? sortedTeams[0].abbreviation
  );
  const [staffName, setStaffName] = useState(value.staff.name);
  const [previousRole, setPreviousRole] = useState<Role>(value.previousRole);
  const [newRole, setNewRole] = useState<Role>(value.staff.role);
  const [contract, setContract] = useState<StaffContract>(value.contract);
  const [timestamp, setTimestamp] = useState(value.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = NFL_TEAMS.find((t) => t.abbreviation === teamAbbreviation)!;
    onSubmit({
      id: value.id,
      type: 'promotion',
      teamIds: [selectedTeam.id],
      timestamp,
      staff: { name: staffName, role: newRole },
      previousRole,
      contract,
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
          onChange={(e) => setTeamAbbreviation(e.target.value)}
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

      <div>
        <label htmlFor="staffName" className="block text-sm font-medium">
          Staff Name
        </label>
        <input
          type="text"
          id="staffName"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          className="mt-1 block w-full rounded border border-input-border px-3 py-2 bg-input-bg text-text-primary"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="previousRole" className="block text-sm font-medium">
            Previous Role
          </label>
          <select
            id="previousRole"
            value={previousRole}
            onChange={(e) => setPreviousRole(e.target.value as Role)}
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

        <div>
          <label htmlFor="newRole" className="block text-sm font-medium">
            New Role
          </label>
          <select
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
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

      <StaffContractFormFields contract={contract} onChange={setContract} />
    </form>
  );
}
