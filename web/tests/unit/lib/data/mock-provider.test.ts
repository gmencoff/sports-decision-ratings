import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '@/lib/data/mock';
import { Transaction } from '@/lib/data/types';

describe('MockDataProvider Pagination', () => {
  let provider: MockDataProvider;

  beforeEach(() => {
    provider = new MockDataProvider();
  });

  it('should not duplicate items across pagination boundaries', async () => {
    // Add 5 transactions with distinct IDs and FUTURE timestamps (so they sort first)
    const transactionIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const id = `pagination-test-${i}`;
      transactionIds.push(id);
      const tx: Transaction = {
        id,
        type: 'signing',
        teams: [{ id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' }],
        // Use future timestamps to ensure they sort before default mock data
        timestamp: new Date(`2026-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
        player: { name: `Player ${i}`, position: 'QB' },
        contractYears: 1,
        totalValue: 1000000,
        guaranteed: 500000,
      };
      await provider.addTransaction(tx);
    }

    // Fetch in pages of 2
    const allFetchedIds: string[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    do {
      const page = await provider.getTransactions(2, cursor);
      pageCount++;
      
      // Collect all IDs from this page
      for (const tx of page.data) {
        allFetchedIds.push(tx.id);
      }
      
      cursor = page.nextCursor;
      
      // Safety limit to prevent infinite loop
      if (pageCount > 10) break;
    } while (cursor);

    // Filter to only our test transactions
    const ourTransactionIds = allFetchedIds.filter(id => id.startsWith('pagination-test-'));
    
    // Verify we got exactly 5 of our test transactions
    expect(ourTransactionIds).toHaveLength(5);
    
    // Verify all original IDs are present (no skips)
    for (const expectedId of transactionIds) {
      expect(ourTransactionIds).toContain(expectedId);
    }
    
    // Verify no duplicates in our transactions
    const uniqueIds = new Set(ourTransactionIds);
    expect(uniqueIds.size).toBe(ourTransactionIds.length);
  });

  it('should handle pagination with items having the same timestamp', async () => {
    // Add 5 transactions with the SAME FUTURE timestamp but different IDs
    const sameTimestamp = new Date('2026-02-01T10:00:00Z');
    const transactionIds: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const id = `same-ts-${i}`;
      transactionIds.push(id);
      const tx: Transaction = {
        id,
        type: 'signing',
        teams: [{ id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' }],
        timestamp: sameTimestamp,
        player: { name: `Player ${i}`, position: 'QB' },
        contractYears: 1,
        totalValue: 1000000,
        guaranteed: 500000,
      };
      await provider.addTransaction(tx);
    }

    // Fetch in pages of 2
    const allFetchedIds: string[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    do {
      const page = await provider.getTransactions(2, cursor);
      
      for (const tx of page.data) {
        allFetchedIds.push(tx.id);
      }
      
      cursor = page.nextCursor;
      
      // Safety limit
      if (pageCount++ > 10) break;
    } while (cursor);

    // Filter to only our test transactions
    const ourTransactionIds = allFetchedIds.filter(id => id.startsWith('same-ts-'));
    
    // Verify no duplicates
    const uniqueIds = new Set(ourTransactionIds);
    expect(uniqueIds.size).toBe(ourTransactionIds.length);
    
    // Verify we got all 5 transactions
    expect(ourTransactionIds).toHaveLength(5);
  });
});
