'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction, PaginatedResult } from '@/lib/data/types';
import { TransactionCard } from './TransactionCard';
import { getTransactions } from '@/app/actions/transactions';

export type LoadMoreAction = (cursor?: string) => Promise<PaginatedResult<Transaction>>;

interface TransactionsListProps {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  initialNextCursor?: string;
  loadMoreTransactions?: LoadMoreAction;
}

export function TransactionsList({
  initialTransactions,
  initialHasMore,
  initialNextCursor,
  loadMoreTransactions = (cursor) => getTransactions(undefined, cursor),
}: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await loadMoreTransactions(nextCursor);
      setTransactions((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, nextCursor, loadMoreTransactions]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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

      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isLoading && (
            <div className="text-text-muted">Loading more transactions...</div>
          )}
        </div>
      )}
    </div>
  );
}
