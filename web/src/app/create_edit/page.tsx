import { getTransaction } from '@/app/actions/transactions';
import { TransactionEditor } from './TransactionEditor';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function CreateEditPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  const existingTransaction = id ? await getTransaction(id) : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {existingTransaction ? 'Edit Transaction' : 'Create Transaction'}
      </h1>

      <TransactionEditor existingTransaction={existingTransaction} />
    </div>
  );
}
