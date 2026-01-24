'use client';

import { useState } from 'react';
import { Hire, Role, ROLES } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function HireForm({ value, onSubmit }: FormProps<Hire>) {
  const [staffName, setStaffName] = useState(value?.staff?.name ?? '');
  const [staffRole, setStaffRole] = useState<Role>(value?.staff?.role ?? 'Head Coach');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value?.id ?? '',
      type: 'hire',
      teams: value?.teams ?? [],
      timestamp: value?.timestamp ?? new Date(),
      staff: { name: staffName, role: staffRole },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {value ? 'Update Hire' : 'Create Hire'}
      </button>
    </form>
  );
}
