'use client';

interface TransactionDateFieldProps {
  timestamp: Date;
  onChange: (date: Date) => void;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TransactionDateField({ timestamp, onChange }: TransactionDateFieldProps) {
  const today = formatDateForInput(new Date());

  return (
    <div>
      <label htmlFor="transactionDate" className="block text-sm font-medium">
        Transaction Date
      </label>
      <input
        type="date"
        id="transactionDate"
        value={formatDateForInput(timestamp)}
        max={today}
        onChange={(e) => {
          const [year, month, day] = e.target.value.split('-').map(Number);
          onChange(new Date(year, month - 1, day));
        }}
        className="mt-1 block w-full rounded border border-input-border bg-input-bg px-3 py-2 text-text-primary"
        required
      />
    </div>
  );
}
