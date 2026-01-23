'use client';

import { useState } from 'react';
import { Hire } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function HireForm({ value, onSubmit }: FormProps<Hire>) {
  const [title, setTitle] = useState(value?.title ?? '');
  const [description, setDescription] = useState(value?.description ?? '');
  const [staffName, setStaffName] = useState(value?.staff?.name ?? '');
  const [staffRole, setStaffRole] = useState(value?.staff?.role ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value?.id ?? '',
      type: 'hire',
      title,
      description,
      teams: value?.teams ?? [],
      timestamp: value?.timestamp ?? new Date(),
      staff: { name: staffName, role: staffRole },
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
          <input
            type="text"
            id="staffRole"
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
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
