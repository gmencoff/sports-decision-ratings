import { PlayerContract } from '@/lib/data/types';
import { formatMoney } from '../format';

interface ContractDetailsProps {
  contract: PlayerContract;
  label?: string;
}

export function ContractDetails({ contract, label }: ContractDetailsProps) {
  const hasYears = contract.years != null;
  const hasTotalValue = contract.totalValue != null;
  const hasGuaranteed = contract.guaranteed != null;

  if (!hasYears && !hasTotalValue && !hasGuaranteed) {
    return <div className="text-sm text-text-muted">Contract details unknown</div>;
  }

  const yearsPart = hasYears
    ? `${contract.years} year${label ? ` ${label}` : (contract.years !== 1 ? 's' : '')}`
    : null;
  const totalPart = hasTotalValue ? `${formatMoney(contract.totalValue!)} total` : null;

  const summaryParts = [yearsPart, totalPart].filter(Boolean).join(', ');

  return (
    <>
      {summaryParts && (
        <div className="text-sm text-text-secondary">{summaryParts}</div>
      )}
      {hasGuaranteed && (
        <div className="text-sm text-text-muted">
          {formatMoney(contract.guaranteed!)} guaranteed
        </div>
      )}
    </>
  );
}
