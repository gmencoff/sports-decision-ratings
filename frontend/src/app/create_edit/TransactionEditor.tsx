'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, TransactionInput, TransactionType } from '@/lib/data/types';
import { getModule, getAllModules } from '@/lib/transactions';
import { addTransaction, editTransaction } from '@/app/actions/transactions';

interface TransactionEditorProps {
  existingTransaction: Transaction | null;
}

export function TransactionEditor({ existingTransaction }: TransactionEditorProps) {
  const router = useRouter();
  const allModules = getAllModules();

  const [selectedType, setSelectedType] = useState<TransactionType>(
    existingTransaction?.type ?? 'trade'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModule = getModule(selectedType);
  const FormComponent = currentModule.Form;

  const isEditing = existingTransaction !== null;

  // Get the value to pass to the form
  const formValue = isEditing
    ? existingTransaction
    : currentModule.createDefault();

  const handleSubmit = async (transaction: Transaction) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await editTransaction(existingTransaction.id, transaction);
      } else {
        // Strip the id - it will be generated server-side
        const { id: _, ...input } = transaction;
        await addTransaction(input as TransactionInput);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isEditing && (
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium">
            Transaction Type
          </label>
          <select
            id="transactionType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TransactionType)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            {allModules.map((module) => (
              <option key={module.type} value={module.type}>
                {module.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {isEditing && (
        <p className="text-sm text-gray-600">
          Editing: {currentModule.label}
        </p>
      )}

      {error && (
        <div className="rounded bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <FormComponent
        value={formValue}
        onSubmit={handleSubmit}
      />

      <button
        type="submit"
        form="transaction-form"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : isEditing ? `Update ${currentModule.label}` : `Create ${currentModule.label}`}
      </button>
    </div>
  );
}
