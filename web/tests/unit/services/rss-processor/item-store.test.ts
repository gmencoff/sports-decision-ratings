import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveNewItems, markItemStatus } from '@/server/services/rss-processor/item-store';
import type { RssItem } from '@/lib/data';
import { createMockDataProvider } from '../../../mocks/mockDataProvider';

const mockRssItem = (guid: string): RssItem => ({
  guid,
  source: 'espn',
  title: `Title ${guid}`,
  description: `Description ${guid}`,
  link: `https://espn.com/${guid}`,
  pubDate: new Date('2026-02-28T10:00:00Z'),
});

describe('item-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveNewItems', () => {
    it('delegates to provider.saveNewRssItems and returns its result', async () => {
      const items = [mockRssItem('guid-1'), mockRssItem('guid-2')];
      const provider = createMockDataProvider({
        saveNewRssItems: vi.fn().mockResolvedValue(items),
      });

      const result = await saveNewItems(provider, items);

      expect(provider.saveNewRssItems).toHaveBeenCalledWith(items);
      expect(result).toEqual(items);
    });

    it('returns empty array when provider returns none', async () => {
      const items = [mockRssItem('guid-1')];
      const provider = createMockDataProvider({
        saveNewRssItems: vi.fn().mockResolvedValue([]),
      });

      const result = await saveNewItems(provider, items);

      expect(result).toEqual([]);
    });
  });

  describe('markItemStatus', () => {
    it('delegates to provider.markRssItemStatus with status processed', async () => {
      const provider = createMockDataProvider();

      await markItemStatus(provider, 'guid-1', 'processed');

      expect(provider.markRssItemStatus).toHaveBeenCalledWith('guid-1', 'processed', undefined, undefined);
    });

    it('delegates to provider.markRssItemStatus with status failed and error message', async () => {
      const provider = createMockDataProvider();

      await markItemStatus(provider, 'guid-1', 'failed', [], 'Something went wrong');

      expect(provider.markRssItemStatus).toHaveBeenCalledWith('guid-1', 'failed', [], 'Something went wrong');
    });

    it('passes transactionIds to provider.markRssItemStatus', async () => {
      const provider = createMockDataProvider();

      await markItemStatus(provider, 'guid-1', 'processed', ['tx-1', 'tx-2']);

      expect(provider.markRssItemStatus).toHaveBeenCalledWith('guid-1', 'processed', ['tx-1', 'tx-2'], undefined);
    });
  });
});
