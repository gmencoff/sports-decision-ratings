import { beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/server/db/schema';
import { NFL_TEAMS } from '../../src/lib/data/types';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

// Export for use in tests
export function getTestDb() {
  return db;
}

export async function truncateAllTables() {
  // Truncate in order respecting foreign keys (children first)
  await db.execute(sql`TRUNCATE TABLE vote_summaries CASCADE`);
  await db.execute(sql`TRUNCATE TABLE votes CASCADE`);
  await db.execute(sql`TRUNCATE TABLE transactions CASCADE`);
  // Don't truncate teams - they're reference data
}

async function createSchema() {
  // Create enums
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE conference AS ENUM ('AFC', 'NFC');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE division AS ENUM ('North', 'South', 'East', 'West');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE transaction_type AS ENUM ('trade', 'signing', 'draft', 'release', 'extension', 'hire', 'fire');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE sentiment AS ENUM ('good', 'bad', 'unsure');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      abbreviation VARCHAR(10) NOT NULL,
      conference conference NOT NULL,
      division division NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      type transaction_type NOT NULL,
      team_ids VARCHAR(10)[] NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      data JSONB NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS votes (
      id VARCHAR(50) PRIMARY KEY,
      transaction_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      voter_id VARCHAR(64) NOT NULL,
      sentiment sentiment NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(transaction_id, team_id, voter_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vote_summaries (
      transaction_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      good_count INTEGER NOT NULL DEFAULT 0,
      bad_count INTEGER NOT NULL DEFAULT 0,
      unsure_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (transaction_id, team_id)
    )
  `);
}

async function seedTeams() {
  for (const team of NFL_TEAMS) {
    await db
      .insert(schema.teams)
      .values({
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division,
      })
      .onConflictDoNothing();
  }
}

// Start container and set up database before all tests
beforeAll(async () => {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('test_db')
    .start();

  // Create connection pool
  pool = new Pool({
    connectionString: container.getConnectionUri(),
  });

  // Create drizzle instance
  db = drizzle(pool, { schema });

  // Create schema and seed data
  await createSchema();
  await seedTeams();
}, 60000); // 60 second timeout for container startup

// Cleanup data between tests
afterEach(async () => {
  await truncateAllTables();
});

// Stop container after all tests
afterAll(async () => {
  if (pool) {
    await pool.end();
  }
  if (container) {
    await container.stop();
  }
});

export { schema };
