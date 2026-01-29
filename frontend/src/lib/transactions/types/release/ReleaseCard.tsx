import { Release } from '@/lib/data/types';
import { CardProps } from '../../interface';

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export function ReleaseCard({ transaction }: CardProps<Release>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-gray-500">({transaction.player.position})</span>
      </div>
      {transaction.capSavings && (
        <div className="text-sm text-gray-600">
          Cap savings: {formatMoney(transaction.capSavings)}
        </div>
      )}
    </div>
  );
}
