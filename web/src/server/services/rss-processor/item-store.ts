import { eq, inArray } from 'drizzle-orm';
import { type Database } from '@/server/db';
import { rssItems, type DbRssItem, type RssItemStatus } from '@/server/db/schema/rss-items';
import { type RssItem } from './feed-fetcher';

export async function saveNewItems(db: Database, items: RssItem[]): Promise<RssItem[]> {
  if (items.length === 0) return [];

  const guids = items.map((i) => i.guid);

  // Find existing GUIDs
  const existing = await db
    .select({ guid: rssItems.guid })
    .from(rssItems)
    .where(inArray(rssItems.guid, guids));

  const existingGuids = new Set(existing.map((r) => r.guid));
  const newItems = items.filter((i) => !existingGuids.has(i.guid));

  if (newItems.length === 0) return [];

  await db.insert(rssItems).values(
    newItems.map((item) => ({
      guid: item.guid,
      source: item.source,
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate,
      status: 'pending' as RssItemStatus,
    }))
  );

  return newItems;
}

export async function getPendingItems(db: Database): Promise<DbRssItem[]> {
  return db
    .select()
    .from(rssItems)
    .where(eq(rssItems.status, 'pending'));
}

export async function markItemStatus(
  db: Database,
  guid: string,
  status: RssItemStatus,
  transactionIds?: string[],
  error?: string
): Promise<void> {
  await db
    .update(rssItems)
    .set({
      status,
      processedAt: new Date(),
      ...(transactionIds !== undefined ? { transactionIds } : {}),
      ...(error !== undefined ? { error } : {}),
    })
    .where(eq(rssItems.guid, guid));
}
