import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataProvider } from '@/lib/data';
import type { LlmClient } from '@/server/services/rss-processor/llm-client';

// Module mocks must be at top level
vi.mock('@/server/services/rss-processor/feed-fetcher', () => ({
  fetchRssItems: vi.fn(),
}));
vi.mock('@/server/services/rss-processor/item-store', () => ({
  saveNewItems: vi.fn(),
  markItemStatus: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/server/services/rss-processor/transaction-extractor', () => ({
  extractTransactions: vi.fn(),
}));
vi.mock('@/server/services/rss-processor/duplicate-detector', () => ({
  isDuplicate: vi.fn(),
}));
vi.mock('@/app/actions/transactions', () => ({
  addTransactionImpl: vi.fn(),
}));

import { processRssFeeds } from '@/server/services/rss-processor';
import { fetchRssItems } from '@/server/services/rss-processor/feed-fetcher';
import { saveNewItems, markItemStatus } from '@/server/services/rss-processor/item-store';
import { extractTransactions } from '@/server/services/rss-processor/transaction-extractor';
import { isDuplicate } from '@/server/services/rss-processor/duplicate-detector';
import { addTransactionImpl } from '@/app/actions/transactions';
import type { RssItem } from '@/lib/data';
import type { TransactionInput } from '@/lib/data/types';

const mockProvider = {} as DataProvider;
const mockLlm = {} as LlmClient;

const mockRssItem: RssItem = {
  guid: 'guid-1',
  source: 'espn',
  title: 'Bills sign WR John Doe',
  description: 'Buffalo Bills signed WR John Doe.',
  link: 'https://espn.com/1',
  pubDate: new Date('2026-02-28T10:00:00Z'),
};

const mockSigningInput: TransactionInput = {
  type: 'signing',
  teamIds: ['BUF'],
  timestamp: new Date('2026-02-28T10:00:00Z'),
  player: { name: 'John Doe', position: 'WR' },
  contract: { years: 4, totalValue: 48000000 },
};

const mockTransaction = {
  id: 'tx-new-1',
  ...mockSigningInput,
};

describe('processRssFeeds (orchestrator)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markItemStatus).mockResolvedValue(undefined);
    vi.mocked(addTransactionImpl).mockResolvedValue(mockTransaction as never);
  });

  it('happy path: fetches feeds, saves new items, extracts and adds transactions', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem]);
    vi.mocked(extractTransactions).mockResolvedValue([mockSigningInput]);
    vi.mocked(isDuplicate).mockResolvedValue(false);

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.itemsChecked).toBe(1);
    expect(result.newItemsFound).toBe(1);
    expect(result.transactionsExtracted).toBe(1);
    expect(result.transactionsAdded).toBe(1);
    expect(result.errors).toEqual([]);
    expect(addTransactionImpl).toHaveBeenCalledWith(mockProvider, mockSigningInput);
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'processed', ['tx-new-1']);
  });

  it('marks item as processed with empty transactionIds when extraction returns []', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem]);
    vi.mocked(extractTransactions).mockResolvedValue([]);

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.transactionsExtracted).toBe(0);
    expect(result.transactionsAdded).toBe(0);
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'processed', []);
  });

  it('skips duplicate transactions and marks item processed with empty transactionIds', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem]);
    vi.mocked(extractTransactions).mockResolvedValue([mockSigningInput]);
    vi.mocked(isDuplicate).mockResolvedValue(true);

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.transactionsExtracted).toBe(1);
    expect(result.transactionsAdded).toBe(0);
    expect(addTransactionImpl).not.toHaveBeenCalled();
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'processed', []);
  });

  it('marks item as failed when processing throws', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem]);
    vi.mocked(extractTransactions).mockRejectedValue(new Error('LLM exploded'));

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('LLM exploded');
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'failed', [], expect.any(String));
  });

  it('returns early with error when RSS fetch fails', async () => {
    vi.mocked(fetchRssItems).mockRejectedValue(new Error('Network failure'));

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.itemsChecked).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('RSS fetch failed');
    expect(saveNewItems).not.toHaveBeenCalled();
  });

  it('handles no new items (all GUIDs already seen)', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([]); // All already seen

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.itemsChecked).toBe(1);
    expect(result.newItemsFound).toBe(0);
    expect(result.transactionsExtracted).toBe(0);
    expect(result.transactionsAdded).toBe(0);
    expect(extractTransactions).not.toHaveBeenCalled();
  });

  it('processes multiple new items and accumulates counts', async () => {
    const item2: RssItem = { ...mockRssItem, guid: 'guid-2', title: 'Chiefs release RB' };
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem, item2]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem, item2]);
    vi.mocked(extractTransactions)
      .mockResolvedValueOnce([mockSigningInput])
      .mockResolvedValueOnce([mockSigningInput, mockSigningInput]); // 2 transactions in item2
    vi.mocked(isDuplicate).mockResolvedValue(false);

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.newItemsFound).toBe(2);
    expect(result.transactionsExtracted).toBe(3);
    expect(result.transactionsAdded).toBe(3);
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'processed', ['tx-new-1']);
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-2', 'processed', ['tx-new-1', 'tx-new-1']);
  });

  it('adds addTransaction error to errors array but continues processing', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue([mockRssItem]);
    vi.mocked(saveNewItems).mockResolvedValue([mockRssItem]);
    vi.mocked(extractTransactions).mockResolvedValue([mockSigningInput]);
    vi.mocked(isDuplicate).mockResolvedValue(false);
    vi.mocked(addTransactionImpl).mockRejectedValue(new Error('DB insert failed'));

    const result = await processRssFeeds(mockProvider, mockLlm);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('DB insert failed');
    expect(result.transactionsAdded).toBe(0);
    expect(markItemStatus).toHaveBeenCalledWith(mockProvider, 'guid-1', 'processed', []);
  });
});
