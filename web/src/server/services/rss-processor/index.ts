import Anthropic from '@anthropic-ai/sdk';
import { type Database } from '@/server/db';
import { type DataProvider } from '@/lib/data';
import { addTransactionImpl } from '@/app/actions/transactions';
import { fetchRssItems } from './feed-fetcher';
import { saveNewItems, markItemStatus } from './item-store';
import { extractTransactions } from './transaction-extractor';
import { isDuplicate } from './duplicate-detector';

export interface ProcessingResult {
  itemsChecked: number;
  newItemsFound: number;
  transactionsExtracted: number;
  transactionsAdded: number;
  errors: string[];
}

export async function processRssFeeds(
  db: Database,
  provider: DataProvider,
  anthropic: Anthropic
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    itemsChecked: 0,
    newItemsFound: 0,
    transactionsExtracted: 0,
    transactionsAdded: 0,
    errors: [],
  };

  // Step 1: Fetch RSS feeds
  let rssItems;
  try {
    rssItems = await fetchRssItems();
  } catch (err) {
    result.errors.push(`RSS fetch failed: ${err}`);
    return result;
  }
  result.itemsChecked = rssItems.length;

  // Step 2: Save new items (dedup by GUID)
  const newItems = await saveNewItems(db, rssItems);
  result.newItemsFound = newItems.length;

  // Step 3: Process each new item
  for (const item of newItems) {
    let transactionsAddedForItem = 0;

    try {
      // Extract candidate transactions from this RSS item
      const candidates = await extractTransactions(item, anthropic);
      result.transactionsExtracted += candidates.length;

      if (candidates.length === 0) {
        await markItemStatus(db, item.guid, 'no_transactions');
        continue;
      }

      // Check each candidate for duplicates and add if new
      for (const candidate of candidates) {
        try {
          const dup = await isDuplicate(candidate, db, anthropic);
          if (!dup) {
            await addTransactionImpl(provider, candidate);
            result.transactionsAdded++;
            transactionsAddedForItem++;
          }
        } catch (err) {
          result.errors.push(`Failed to add transaction from ${item.guid}: ${err}`);
        }
      }

      await markItemStatus(
        db,
        item.guid,
        transactionsAddedForItem > 0 ? 'processed' : 'no_transactions'
      );
    } catch (err) {
      const errMsg = `Error processing item ${item.guid}: ${err}`;
      result.errors.push(errMsg);
      await markItemStatus(db, item.guid, 'failed', String(err)).catch(() => {});
    }
  }

  return result;
}
