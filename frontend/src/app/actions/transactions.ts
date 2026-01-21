'use server';

import { Transaction, PaginatedResult } from '@/lib/data/types';
import { DataProvider, getDataProvider } from '@/lib/data';

export async function getTransactionsImpl(
  provider: DataProvider,
  limit?: number,
  cursor?: string
): Promise<PaginatedResult<Transaction>> {
  return provider.getTransactions(limit, cursor);
}

export async function getTransactions(
  limit?: number,
  cursor?: string
): Promise<PaginatedResult<Transaction>> {
  const provider = await getDataProvider();
  return getTransactionsImpl(provider, limit, cursor);
}

export async function getTransactionImpl(
  provider: DataProvider,
  id: string
): Promise<Transaction | null> {
  return provider.getTransaction(id);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const provider = await getDataProvider();
  return getTransactionImpl(provider, id);
}
