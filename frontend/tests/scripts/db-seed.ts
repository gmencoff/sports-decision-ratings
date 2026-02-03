import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../src/server/db/schema';
import { NFL_TEAMS } from '../../src/lib/data/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding test database...');

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

  // Seed sample transactions for testing
  console.log('📋 Seeding sample transactions...');
  const sampleTransactions = [
    {
      id: 'trade-1',
      type: 'trade' as const,
      teamIds: ['KC', 'NYJ'],
      timestamp: new Date('2024-03-15T10:00:00Z'),
      data: {
        assets: [
          {
            type: 'player',
            fromTeamId: 'NYJ',
            toTeamId: 'KC',
            player: { name: 'Sample Player', position: 'WR' },
          },
          {
            type: 'draft_pick',
            fromTeamId: 'KC',
            toTeamId: 'NYJ',
            ogTeamId: 'KC',
            year: 2025,
            round: 3,
          },
        ],
      },
    },
    {
      id: 'signing-1',
      type: 'signing' as const,
      teamIds: ['SF'],
      timestamp: new Date('2024-03-14T15:30:00Z'),
      data: {
        player: { name: 'Free Agent Star', position: 'CB' },
        contractYears: 4,
        totalValue: 80000000,
        guaranteed: 50000000,
      },
    },
    {
      id: 'draft-1',
      type: 'draft' as const,
      teamIds: ['CHI'],
      timestamp: new Date('2024-04-25T20:00:00Z'),
      data: {
        player: { name: 'Caleb Williams', position: 'QB' },
        round: 1,
        pick: 1,
      },
    },
    {
      id: 'hire-1',
      type: 'hire' as const,
      teamIds: ['LV'],
      timestamp: new Date('2024-02-01T12:00:00Z'),
      data: {
        staff: { name: 'Antonio Pierce', role: 'Head Coach' },
      },
    },
  ];

  for (const txn of sampleTransactions) {
    await db.insert(schema.transactions).values(txn).onConflictDoNothing();
  }
  console.log(`✅ Seeded ${sampleTransactions.length} sample transactions`);

  console.log('🎉 Test database seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
