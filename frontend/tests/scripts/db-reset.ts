import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/server/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function reset() {
  console.log('🗑️  Resetting database...');

  // Drop tables in correct order (respecting foreign keys)
  console.log('📋 Dropping tables...');
  await db.execute(sql`DROP TABLE IF EXISTS vote_summaries CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS votes CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS transactions CASCADE`);

  // Drop enums
  console.log('📋 Dropping enums...');
  await db.execute(sql`DROP TYPE IF EXISTS sentiment CASCADE`);
  await db.execute(sql`DROP TYPE IF EXISTS transaction_type CASCADE`);

  console.log('🎉 Database reset complete!');
  console.log('💡 Run "npm run db:migrate" to recreate schema');
}

reset()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
