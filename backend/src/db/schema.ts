import { pgTable, serial, integer, varchar, text, numeric, boolean, timestamp, smallint } from 'drizzle-orm/pg-core';

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').unique().notNull(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
  agentWallet: varchar('agent_wallet', { length: 42 }).unique().notNull(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  templateId: smallint('template_id').notNull(),
  customSystemPrompt: text('custom_system_prompt'),
  pricePerCall: numeric('price_per_call', { precision: 78, scale: 0 }).notNull(),
  agentUri: text('agent_uri').notNull().default(''),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const callLogs = pgTable('call_logs', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').notNull(),
  callerAddress: varchar('caller_address', { length: 42 }),
  messageHash: varchar('message_hash', { length: 66 }),
  responseHash: varchar('response_hash', { length: 66 }),
  revenue: numeric('revenue', { precision: 78, scale: 0 }).default('0'),
  llmModel: varchar('llm_model', { length: 100 }),
  llmTokensUsed: integer('llm_tokens_used'),
  isOwnerCall: boolean('is_owner_call').default(false),
  paymentTxHash: varchar('payment_tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').unique().notNull(),
  agentId: integer('agent_id').notNull(),
  clientAddress: varchar('client_address', { length: 42 }).notNull(),
  description: text('description').notNull(),
  budget: numeric('budget', { precision: 78, scale: 0 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  deliverableIpfsCid: varchar('deliverable_ipfs_cid', { length: 100 }),
  resultText: text('result_text'),
  createdAt: timestamp('created_at').defaultNow(),
  fundedAt: timestamp('funded_at'),
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
});
