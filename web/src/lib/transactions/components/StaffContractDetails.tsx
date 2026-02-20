import { StaffContract } from '@/lib/data/types';
import { formatMoney } from '../format';

interface StaffContractDetailsProps {
  contract: StaffContract;
  label?: string;
}

export function StaffContractDetails({ contract, label }: StaffContractDetailsProps) {
  const hasYears = contract.years != null;
  const hasTotalValue = contract.totalValue != null;

  if (!hasYears && !hasTotalValue) {
    return null;
  }

const yearsPart = hasYears
    ? `${contract.years} year${label ? ` ${label}` : (contract.years !== 1 ? 's' : '')}`
    : null;
  const totalPart = hasTotalValue ? `${formatMoney(contract.totalValue!)} total` : null;

  const summaryParts = [yearsPart, totalPart].filter(Boolean).join(', ');

  return (
    <>
      {summaryParts && (
        <div className="text-sm text-gray-600">{summaryParts}</div>
      )}
    </>
  );
}
