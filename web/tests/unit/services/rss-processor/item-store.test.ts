import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveNewItems, getPendingItems, markItemStatus } from '@/server/services/rss-processor/item-store';
import type { RssItem } from '@/server/services/rss-processor/feed-fetcher';
import type { Database } from '@/server/db';

// Helper to build a chainable Drizzle-like mock
function buildSelectChain(finalValue: unknown) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockResolvedValue(finalValue);
  return chain;
}

function buildInsertChain() {
  const chain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  return chain;
}

function buildUpdateChain() {
  const chain = {
    set: vi.fn(),
    where: vi.fn(),
  };
  chain.set.mockReturnValue(chain);
  chain.where.mockResolvedValue(undefined);
  return chain;
}

function createMockDb(overrides: Partial<{
  selectResult: unknown;
  insertValues: ReturnType<typeof vi.fn>;
  updateResult: unknown;
}> = {}): Database {
  const selectChain = buildSelectChain(overrides.selectResult ?? []);
  const insertChain = buildInsertChain();
  const updateChain = buildUpdateChain();

  return {
    select: vi.fn().mockReturnValue(selectChain),
    insert: vi.fn().mockReturnValue(insertChain),
    update: vi.fn().mockReturnValue(updateChain),
  } as unknown as Database;
}

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
    it('inserts and returns new items when no existing GUIDs', async () => {
      const items = [mockRssItem('guid-1'), mockRssItem('guid-2')];
      const db = createMockDb({ selectResult: [] }); // No existing GUIDs

      const result = await saveNewItems(db, items);

      expect(result).toHaveLength(2);
      expect(db.insert).toHaveBeenCalledOnce();
      const insertedValues = (db.insert as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(insertedValues).toBeDefined();
    });

    it('skips existing GUIDs and returns only new items', async () => {
      const items = [mockRssItem('guid-1'), mockRssItem('guid-2'), mockRssItem('guid-3')];
      // guid-1 already exists
      const db = createMockDb({ selectResult: [{ guid: 'guid-1' }] });

      const result = await saveNewItems(db, items);

      expect(result).toHaveLength(2);
      expect(result.map((i) => i.guid)).toEqual(['guid-2', 'guid-3']);
    });

    it('returns empty array when all GUIDs already exist', async () => {
      const items = [mockRssItem('guid-1'), mockRssItem('guid-2')];
      const db = createMockDb({ selectResult: [{ guid: 'guid-1' }, { guid: 'guid-2' }] });

      const result = await saveNewItems(db, items);

      expect(result).toEqual([]);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('returns empty array for empty input', async () => {
      const db = createMockDb();

      const result = await saveNewItems(db, []);

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  describe('getPendingItems', () => {
    it('returns pending items from the database', async () => {
      const pendingItems = [
        { guid: 'guid-1', source: 'espn', title: 'Title 1', status: 'pending' },
        { guid: 'guid-2', source: 'yahoo', title: 'Title 2', status: 'pending' },
      ];
      const db = createMockDb({ selectResult: pendingItems });

      const result = await getPendingItems(db);

      expect(result).toEqual(pendingItems);
      expect(db.select).toHaveBeenCalledOnce();
    });

    it('returns empty array when no pending items', async () => {
      const db = createMockDb({ selectResult: [] });

      const result = await getPendingItems(db);

      expect(result).toEqual([]);
    });
  });

  describe('markItemStatus', () => {
    it('updates status to processed', async () => {
      const db = createMockDb();

      await markItemStatus(db, 'guid-1', 'processed');

      expect(db.update).toHaveBeenCalledOnce();
      const updateChain = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processed' })
      );
    });

    it('updates status to failed with error message', async () => {
      const db = createMockDb();

      await markItemStatus(db, 'guid-1', 'failed', 'Something went wrong');

      const updateChain = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', error: 'Something went wrong' })
      );
    });

    it('updates status to no_transactions', async () => {
      const db = createMockDb();

      await markItemStatus(db, 'guid-1', 'no_transactions');

      const updateChain = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'no_transactions' })
      );
    });

    it('includes processedAt timestamp', async () => {
      const db = createMockDb();

      await markItemStatus(db, 'guid-1', 'processed');

      const updateChain = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ processedAt: expect.any(Date) })
      );
    });
  });
});
