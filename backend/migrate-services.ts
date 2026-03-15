import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  await db.execute(sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'`);
  console.log('✅ Added services column to agents');
  process.exit(0);
}

migrate().catch(console.error);
