'use client';

import { useState } from 'react';
import { StaffExtension, Role, ROLES, NFL_TEAMS, StaffContract } from '@/lib/data/types';
import { StaffContractFormFields } from '../../components/StaffContractFormFields';
import { TransactionDateField } from '../../components/TransactionDateField';

const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

interface StaffExtensionFormProps {
  value: StaffExtension;
  onSubmit: (value: StaffExtension) => void;
}

export function StaffExtensionForm({ value, onSubmit }: StaffExtensionFormProps) {
  const [teamAbbreviation, setTeamAbbreviation] = useState(value.teams[0]?.abbreviation ?? sortedTeams[0].abbreviation);
  const [staffName, setStaffName] = useState(value.staff.name);
  const [staffRole, setStaffRole] = useState<Role>(value.staff.role);
  const [contract, setContract] = useState<StaffContract>(value.contract);
  const [timestamp, setTimestamp] = useState(value.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = NFL_TEAMS.find((t) => t.abbreviation === teamAbbreviation)!;
    onSubmit({
      id: value.id,
      type: 'extension',
      subtype: 'staff',
      teams: [selectedTeam],
      timestamp,
      staff: { name: staffName, role: staffRole },
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
          <label htmlFor="staffName" className="block text-sm font-medium">
            Staff Name
          </label>
          <input
            type="text"
            id="staffName"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="staffRole" className="block text-sm font-medium">
            Role
          </label>
          <select
            id="staffRole"
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value as Role)}
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

      <StaffContractFormFields contract={contract} onChange={setContract} />
    </form>
  );
}
