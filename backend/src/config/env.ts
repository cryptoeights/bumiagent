import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  OPENROUTER_API_KEY: z.string().min(1),
  ENCRYPTION_MASTER_KEY: z.string().length(64, 'Must be 64 hex chars (32 bytes)'),
  TREASURY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be valid Ethereum address'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
