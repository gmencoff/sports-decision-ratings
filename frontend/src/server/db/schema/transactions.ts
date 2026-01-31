import { pgTable, varchar, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { TRANSACTION_TYPES } from '@/lib/data/types';

export const transactionTypeEnum = pgEnum('transaction_type', [...TRANSACTION_TYPES]);

export const transactions = pgTable(
  'transactions',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    type: transactionTypeEnum('type').notNull(),
    teamIds: varchar('team_ids', { length: 10 }).array().notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    data: jsonb('data').notNull(),
  },
  (table) => [index('transactions_timestamp_idx').on(table.timestamp.desc())]
);

export type DbTransaction = typeof transactions.$inferSelect;
export type NewDbTransaction = typeof transactions.$inferInsert;
