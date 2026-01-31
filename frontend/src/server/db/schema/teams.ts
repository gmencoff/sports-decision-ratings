import { pgTable, varchar, pgEnum } from 'drizzle-orm/pg-core';

export const conferenceEnum = pgEnum('conference', ['AFC', 'NFC']);
export const divisionEnum = pgEnum('division', ['North', 'South', 'East', 'West']);

export const teams = pgTable('teams', {
  id: varchar('id', { length: 10 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 10 }).notNull(),
  conference: conferenceEnum('conference').notNull(),
  division: divisionEnum('division').notNull(),
});

export type DbTeam = typeof teams.$inferSelect;
export type NewDbTeam = typeof teams.$inferInsert;
