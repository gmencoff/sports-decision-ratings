'use client';

import { Trade } from '@/lib/data/types';
import { FormProps } from '../../interface';

export function TradeForm({ value, onSubmit }: FormProps<Trade>) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: value.id,
      type: 'trade',
      teams: value.teams,
      timestamp: value.timestamp,
      assets: value.assets,
    });
  };

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: Add teams and assets editing */}
      <p className="text-sm text-gray-500">Trade asset editing coming soon...</p>
    </form>
  );
}
