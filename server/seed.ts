import 'dotenv/config';
import { initSupabase } from './config/supabase.ts';
import { ensureSeeded } from './utils/seedData.ts';

async function runSeed() {
  const sbReady = await initSupabase();
  await ensureSeeded();
  console.log(
    sbReady
      ? '[Seed] Supabase PostgreSQL seeded successfully.'
      : '[Seed] Local fallback store (.data/db.json) seeded successfully.'
  );
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[Seed] Error seeding database:', err);
  process.exit(1);
});
