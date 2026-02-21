import { PlayerExtension } from '@/lib/data/types';
import { ContractDetails } from '../../components/ContractDetails';

interface PlayerExtensionCardProps {
  transaction: PlayerExtension;
}

export function PlayerExtensionCard({ transaction }: PlayerExtensionCardProps) {
  return (
    <div className="space-y-2">
      <div className="font-medium">
        {transaction.player.name}
        <span className="ml-2 text-sm text-text-muted">({transaction.player.position})</span>
      </div>
      <ContractDetails contract={transaction.contract} label="extension" />
    </div>
  );
}
