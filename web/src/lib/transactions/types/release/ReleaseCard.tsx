import { Release } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { formatMoney } from '../../format';

export function ReleaseCard({ transaction }: CardProps<Release>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-text-muted">({transaction.player.position})</span>
      </div>
      {transaction.capSavings && (
        <div className="text-sm text-text-secondary">
          Cap savings: {formatMoney(transaction.capSavings)}
        </div>
      )}
    </div>
  );
}
