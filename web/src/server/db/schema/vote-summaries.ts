import { pgTable, varchar, integer, primaryKey } from 'drizzle-orm/pg-core';
import { transactions } from './transactions';

export const voteSummaries = pgTable(
  'vote_summaries',
  {
    transactionId: varchar('transaction_id', { length: 50 })
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    teamId: varchar('team_id', { length: 10 }).notNull(),
    goodCount: integer('good_count').notNull().default(0),
    badCount: integer('bad_count').notNull().default(0),
    unsureCount: integer('unsure_count').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.transactionId, table.teamId] })]
);

export type DbVoteSummary = typeof voteSummaries.$inferSelect;
export type NewDbVoteSummary = typeof voteSummaries.$inferInsert;
