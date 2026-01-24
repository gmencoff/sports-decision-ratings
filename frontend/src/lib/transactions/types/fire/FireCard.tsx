import { Fire } from '@/lib/data/types';
import { CardProps } from '../../interface';

export function FireCard({ transaction }: CardProps<Fire>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.staff.name}
      </div>
      <div className="text-sm text-gray-600">
        {transaction.staff.role}
      </div>
    </div>
  );
}
