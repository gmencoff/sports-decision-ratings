import { StaffExtension } from '@/lib/data/types';
import { StaffContractDetails } from '../../components/StaffContractDetails';

interface StaffExtensionCardProps {
  transaction: StaffExtension;
}

export function StaffExtensionCard({ transaction }: StaffExtensionCardProps) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.staff.name}
        <span className="ml-2 text-sm text-gray-500">({transaction.staff.role})</span>
      </div>
      <StaffContractDetails contract={transaction.contract} label="extension" />
    </div>
  );
}
