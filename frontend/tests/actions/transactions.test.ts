import { describe, it, expect, vi } from 'vitest';
import { getTransactionsImpl, getTransactionImpl } from '@/app/actions/transactions';
import { createMockDataProvider, createMockTransaction } from '../mocks/mockDataProvider';

describe('transactions actions', () => {
  describe('getTransactionsImpl', () => {
    it('should return transactions from the provider', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1', title: 'Transaction 1' }),
        createMockTransaction({ id: 'tx-2', title: 'Transaction 2' }),
      ];

      const mockProvider = createMockDataProvider({
        getTransactions: vi.fn().mockResolvedValue({
          data: mockTransactions,
          hasMore: true,
          nextCursor: 'cursor-123',
        }),
      });

      const result = await getTransactionsImpl(mockProvider);

      expect(mockProvider.getTransactions).toHaveBeenCalledWith(undefined, undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Transaction 1');
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-123');
    });

    it('should pass limit and cursor to the provider', async () => {
      const mockProvider = createMockDataProvider();

      await getTransactionsImpl(mockProvider, 10, 'my-cursor');

      expect(mockProvider.getTransactions).toHaveBeenCalledWith(10, 'my-cursor');
    });

    it('should return empty array when no transactions exist', async () => {
      const mockProvider = createMockDataProvider({
        getTransactions: vi.fn().mockResolvedValue({
          data: [],
          hasMore: false,
        }),
      });

      const result = await getTransactionsImpl(mockProvider);

      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getTransactionImpl', () => {
    it('should return a transaction by id', async () => {
      const mockTransaction = createMockTransaction({
        id: 'tx-123',
        title: 'Specific Transaction',
      });

      const mockProvider = createMockDataProvider({
        getTransaction: vi.fn().mockResolvedValue(mockTransaction),
      });

      const result = await getTransactionImpl(mockProvider, 'tx-123');

      expect(mockProvider.getTransaction).toHaveBeenCalledWith('tx-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('tx-123');
      expect(result?.title).toBe('Specific Transaction');
    });

    it('should return null when transaction not found', async () => {
      const mockProvider = createMockDataProvider({
        getTransaction: vi.fn().mockResolvedValue(null),
      });

      const result = await getTransactionImpl(mockProvider, 'nonexistent');

      expect(mockProvider.getTransaction).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });
});
