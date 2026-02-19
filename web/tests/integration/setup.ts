import { beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/server/db/schema';

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

  // Apply migrations from drizzle/ directory
  await migrate(db, { migrationsFolder: './drizzle' });
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
