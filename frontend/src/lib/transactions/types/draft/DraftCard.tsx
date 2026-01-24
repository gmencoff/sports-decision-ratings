import { DraftSelection } from '@/lib/data/types';
import { CardProps } from '../../interface';

export function DraftCard({ transaction }: CardProps<DraftSelection>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-gray-500">({transaction.player.position})</span>
      </div>
      <div className="text-sm text-gray-600">
        Round {transaction.round}, Pick {transaction.pick}
      </div>
    </div>
  );
}
