import { DraftSelection } from '@/lib/data/types';
import { CardProps } from '../../interface';

export function DraftCard({ transaction }: CardProps<DraftSelection>) {
  const { draftPick } = transaction;
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-text-muted">({transaction.player.position})</span>
      </div>
      <div className="text-sm text-text-secondary">
        {draftPick.year} Round {draftPick.round}
        {draftPick.number != null && `, Pick ${draftPick.number}`}
      </div>
    </div>
  );
}
