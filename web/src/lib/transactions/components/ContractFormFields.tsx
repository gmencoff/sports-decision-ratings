'use client';

import { PlayerContract } from '@/lib/data/types';

interface ContractFormFieldsProps {
  contract: PlayerContract;
  onChange: (contract: PlayerContract) => void;
}

const DEFAULT_YEARS = 1;
const DEFAULT_VALUE = 0;

export function ContractFormFields({ contract, onChange }: ContractFormFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="contractYearsKnown"
            checked={contract.years != null}
            onChange={(e) =>
              onChange({ ...contract, years: e.target.checked ? DEFAULT_YEARS : undefined })
            }
          />
          <label htmlFor="contractYearsKnown" className="text-sm font-medium">
            Contract Years
          </label>
        </div>
        {contract.years != null ? (
          <input
            type="number"
            id="contractYears"
            aria-label="Contract Years"
            value={contract.years}
            onChange={(e) => onChange({ ...contract, years: Number(e.target.value) })}
            min={1}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        ) : (
          <div className="mt-1 block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
            Unknown
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="totalValueKnown"
            checked={contract.totalValue != null}
            onChange={(e) =>
              onChange({ ...contract, totalValue: e.target.checked ? DEFAULT_VALUE : undefined })
            }
          />
          <label htmlFor="totalValueKnown" className="text-sm font-medium">
            Total Value ($)
          </label>
        </div>
        {contract.totalValue != null ? (
          <input
            type="number"
            id="totalValue"
            aria-label="Total Value ($)"
            value={contract.totalValue}
            onChange={(e) => onChange({ ...contract, totalValue: Number(e.target.value) })}
            min={0}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        ) : (
          <div className="mt-1 block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
            Unknown
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="guaranteedKnown"
            checked={contract.guaranteed != null}
            onChange={(e) =>
              onChange({ ...contract, guaranteed: e.target.checked ? DEFAULT_VALUE : undefined })
            }
          />
          <label htmlFor="guaranteedKnown" className="text-sm font-medium">
            Guaranteed ($)
          </label>
        </div>
        {contract.guaranteed != null ? (
          <input
            type="number"
            id="guaranteed"
            aria-label="Guaranteed ($)"
            value={contract.guaranteed}
            onChange={(e) => onChange({ ...contract, guaranteed: Number(e.target.value) })}
            min={0}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        ) : (
          <div className="mt-1 block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
            Unknown
          </div>
        )}
      </div>
    </div>
  );
}
