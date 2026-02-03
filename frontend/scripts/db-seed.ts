import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/server/db/schema';
import { NFL_TEAMS } from '../src/lib/data/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed teams from NFL_TEAMS constant
  console.log('📋 Seeding teams...');
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
  console.log(`✅ Seeded ${NFL_TEAMS.length} teams`);

  console.log('🎉 Database seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
