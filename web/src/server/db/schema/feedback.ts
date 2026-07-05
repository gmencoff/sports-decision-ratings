import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const feedback = pgTable('feedback', {
  id: varchar('id', { length: 50 }).primaryKey(),
  content: text('content').notNull(),
  pageUrl: varchar('page_url', { length: 500 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbFeedback = typeof feedback.$inferSelect;
export type NewDbFeedback = typeof feedback.$inferInsert;
