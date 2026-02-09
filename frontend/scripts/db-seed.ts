// Database seeding script
// Currently no data needs to be seeded - teams are hardcoded in types.ts
// This file exists for future use when seeding is needed

async function seed() {
  console.log('🌱 Database seeding...');
  console.log('ℹ️  No data to seed - teams are loaded from application code');
  console.log('🎉 Database ready!');
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
