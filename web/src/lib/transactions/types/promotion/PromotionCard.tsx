import { Promotion } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { StaffContractDetails } from '../../components/StaffContractDetails';

export function PromotionCard({ transaction }: CardProps<Promotion>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.staff.name}
      </div>
      <div className="text-sm text-gray-600">
        {transaction.previousRole} &rarr; {transaction.staff.role}
      </div>
      <StaffContractDetails contract={transaction.contract} />
    </div>
  );
}
