import { Signing } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { ContractDetails } from '../../components/ContractDetails';

export function SigningCard({ transaction }: CardProps<Signing>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-gray-500">({transaction.player.position})</span>
      </div>
      <ContractDetails contract={transaction.contract} />
    </div>
  );
}
