import { TransactionsList } from '@/components/TransactionsList';
import { getTransactions } from './actions/transactions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: transactions, hasMore, nextCursor } = await getTransactions();

  return (
    <div>
      <TransactionsList
        initialTransactions={transactions}
        initialHasMore={hasMore}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
