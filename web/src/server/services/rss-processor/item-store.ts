import { type DataProvider, type RssItem, type RssItemStatus } from '@/lib/data';

export async function saveNewItems(provider: DataProvider, items: RssItem[]): Promise<RssItem[]> {
  return provider.saveNewRssItems(items);
}

export async function markItemStatus(
  provider: DataProvider,
  guid: string,
  status: RssItemStatus,
  transactionIds?: string[],
  error?: string
): Promise<void> {
  return provider.markRssItemStatus(guid, status, transactionIds, error);
}
