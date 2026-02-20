import { TransactionCard } from '@/components/TransactionCard';
import { getTransactions } from './actions/transactions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: transactions } = await getTransactions();

  return (
    <div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No transactions yet. Check back soon!
        </div>
      )}
    </div>
  );
}
