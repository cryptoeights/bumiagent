import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fund_tx_hash VARCHAR(66)`);
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payout_tx_hash VARCHAR(66)`);
  console.log('✅ Added fund_tx_hash and payout_tx_hash to jobs');
  process.exit(0);
}

migrate().catch(console.error);
