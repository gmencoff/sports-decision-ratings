import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TransactionCard } from '@/components/TransactionCard';
import { getTransaction } from '@/app/actions/transactions';
import { loadVotes, submitVote } from '@/app/actions/votes';

interface TransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { id } = await params;
  const transaction = await getTransaction(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to all transactions
      </Link>

      <TransactionCard
        transaction={transaction}
        loadVotes={loadVotes}
        submitVote={submitVote}
        showLink={false}
      />

      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-2">Share this transaction</h2>
        <p className="text-sm text-gray-600">
          Copy the URL to share this transaction with others.
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: TransactionPageProps) {
  const { id } = await params;
  const transaction = await getTransaction(id);

  if (!transaction) {
    return {
      title: 'Transaction Not Found',
    };
  }

  return {
    title: `${transaction.title} | NFL Transactions`,
    description: transaction.description,
  };
}
