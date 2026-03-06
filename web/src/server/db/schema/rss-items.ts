import { pgTable, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

export const rssItemStatusEnum = pgEnum('rss_item_status', [
  'pending',
  'processed',
  'failed',
]);

export type RssItemStatus = (typeof rssItemStatusEnum.enumValues)[number];

export const rssItems = pgTable(
  'rss_items',
  {
    guid: varchar('guid', { length: 500 }).primaryKey(),
    source: varchar('source', { length: 50 }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    link: varchar('link', { length: 1000 }).notNull(),
    pubDate: timestamp('pub_date', { withTimezone: true }).notNull(),
    status: rssItemStatusEnum('status').notNull().default('pending'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    transactionIds: varchar('transaction_ids', { length: 50 }).array().notNull().default([]),
    error: text('error'),
  },
  (table) => [index('rss_items_status_idx').on(table.status)]
);

export type DbRssItem = typeof rssItems.$inferSelect;
export type NewDbRssItem = typeof rssItems.$inferInsert;
