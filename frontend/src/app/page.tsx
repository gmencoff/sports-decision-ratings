import { TransactionCard } from '@/components/TransactionCard';
import { getTransactions } from './actions/transactions';
import { loadVotes, submitVote } from './actions/votes';

export default async function Home() {
  const { data: transactions } = await getTransactions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Latest Transactions</h1>
        <p className="text-gray-600 mt-1">
          Vote on NFL transactions. Was it a good move or a bad move?
        </p>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            loadVotes={loadVotes}
            submitVote={submitVote}
          />
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No transactions yet. Check back soon!
        </div>
      )}
    </div>
  );
}
