import { PlayerContract } from '@/lib/data/types';
import { formatMoney } from '../format';

interface ContractDetailsProps {
  contract: PlayerContract;
  label?: string;
}

export function ContractDetails({ contract, label }: ContractDetailsProps) {
  return (
    <>
      {contract.years != null && contract.totalValue != null && (
        <div className="text-sm text-gray-600">
          {contract.years} year{label ? ` ${label}` : (contract.years !== 1 ? 's' : '')},{' '}
          {formatMoney(contract.totalValue)} total
        </div>
      )}
      {contract.guaranteed != null && (
        <div className="text-sm text-gray-500">
          {formatMoney(contract.guaranteed)} guaranteed
        </div>
      )}
    </>
  );
}
