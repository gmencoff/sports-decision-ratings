import { pgTable, varchar, timestamp, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { SENTIMENTS } from '@/lib/data/types';
import { transactions } from './transactions';

export const sentimentEnum = pgEnum('sentiment', [...SENTIMENTS]);

export const votes = pgTable(
  'votes',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    transactionId: varchar('transaction_id', { length: 50 })
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    teamId: varchar('team_id', { length: 10 }).notNull(),
    voterId: varchar('voter_id', { length: 64 }).notNull(), // SHA-256 hash
    sentiment: sentimentEnum('sentiment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('votes_transaction_id_idx').on(table.transactionId),
    index('votes_voter_id_idx').on(table.voterId),
    unique('votes_transaction_team_voter_unique').on(
      table.transactionId,
      table.teamId,
      table.voterId
    ),
  ]
);

export type DbVote = typeof votes.$inferSelect;
export type NewDbVote = typeof votes.$inferInsert;
