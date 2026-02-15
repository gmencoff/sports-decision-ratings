import { Extension } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { ContractDetails } from '../../components/ContractDetails';

export function ExtensionCard({ transaction }: CardProps<Extension>) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-gray-500">({transaction.player.position})</span>
      </div>
      <ContractDetails contract={transaction.contract} label="extension" />
    </div>
  );
}
