'use client';

import { PlayerContract } from '@/lib/data/types';

interface ContractFormFieldsProps {
  contract: PlayerContract;
  onChange: (contract: PlayerContract) => void;
}

export function ContractFormFields({ contract, onChange }: ContractFormFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label htmlFor="contractYears" className="block text-sm font-medium">
          Contract Years
        </label>
        <input
          type="number"
          id="contractYears"
          value={contract.years ?? 1}
          onChange={(e) => onChange({ ...contract, years: Number(e.target.value) })}
          min={1}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="totalValue" className="block text-sm font-medium">
          Total Value ($)
        </label>
        <input
          type="number"
          id="totalValue"
          value={contract.totalValue ?? 0}
          onChange={(e) => onChange({ ...contract, totalValue: Number(e.target.value) })}
          min={0}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="guaranteed" className="block text-sm font-medium">
          Guaranteed ($)
        </label>
        <input
          type="number"
          id="guaranteed"
          value={contract.guaranteed ?? 0}
          onChange={(e) => onChange({ ...contract, guaranteed: Number(e.target.value) })}
          min={0}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>
    </div>
  );
}
