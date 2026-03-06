import { type DataProvider } from '@/lib/data';
import { addTransactionImpl, editTransactionImpl } from '@/app/actions/transactions';
import { fetchRssItems } from './feed-fetcher';
import { saveNewItems, markItemStatus } from './item-store';
import { extractTransactions } from './transaction-extractor';
import { checkDuplicate } from './duplicate-detector';
import { type LlmClient } from './llm-client';

export interface ProcessingResult {
  itemsChecked: number;
  newItemsFound: number;
  transactionsExtracted: number;
  transactionsAdded: number;
  transactionsUpdated: number;
  errors: string[];
}

export async function processRssFeeds(
  provider: DataProvider,
  llm: LlmClient
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    itemsChecked: 0,
    newItemsFound: 0,
    transactionsExtracted: 0,
    transactionsAdded: 0,
    transactionsUpdated: 0,
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
  const newItems = await saveNewItems(provider, rssItems);
  result.newItemsFound = newItems.length;

  // Step 3: Process each new item
  for (const item of newItems) {
    const addedTransactionIds: string[] = [];

    try {
      // Extract candidate transactions from this RSS item
      const { transactions: candidates } = await extractTransactions(item, llm);
      result.transactionsExtracted += candidates.length;

      // Check each candidate for duplicates and add/update accordingly
      for (const candidate of candidates) {
        try {
          const check = await checkDuplicate(candidate, provider, llm);
          if (check.action === 'new') {
            const added = await addTransactionImpl(provider, candidate);
            addedTransactionIds.push(added.id);
            result.transactionsAdded++;
          } else if (check.action === 'update') {
            await editTransactionImpl(provider, check.existingTransactionId, check.updatedTransaction);
            result.transactionsUpdated++;
          }
          // 'duplicate' — skip
        } catch (err) {
          result.errors.push(`Failed to add transaction from ${item.guid}: ${err}`);
        }
      }

      await markItemStatus(provider, item.guid, 'processed', addedTransactionIds);
    } catch (err) {
      const errMsg = `Error processing item ${item.guid}: ${err}`;
      result.errors.push(errMsg);
      await markItemStatus(provider, item.guid, 'failed', [], String(err)).catch(() => {});
    }
  }

  return result;
}
