import { Hire } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { StaffContractDetails } from '../../components/StaffContractDetails';

export function HireCard({ transaction }: CardProps<Hire>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.staff.name}
      </div>
      <div className="text-sm text-gray-600">
        {transaction.staff.role}
      </div>
      <StaffContractDetails contract={transaction.contract} />
    </div>
  );
}
