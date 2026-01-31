import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Singleton pool instance
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }

    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Database instance type
export type Database = ReturnType<typeof drizzle<typeof schema>>;

// Singleton database instance
let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

// Re-export schema for convenience
export { schema };
