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

export async function addTransactionImpl(
  provider: DataProvider,
  transaction: Transaction
): Promise<Transaction> {
  return provider.addTransaction(transaction);
}

export async function addTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const provider = await getDataProvider();
  return addTransactionImpl(provider, transaction);
}

export async function editTransactionImpl(
  provider: DataProvider,
  id: string,
  transaction: Transaction
): Promise<Transaction | null> {
  return provider.editTransaction(id, transaction);
}

export async function editTransaction(
  id: string,
  transaction: Transaction
): Promise<Transaction | null> {
  const provider = await getDataProvider();
  return editTransactionImpl(provider, id, transaction);
}
