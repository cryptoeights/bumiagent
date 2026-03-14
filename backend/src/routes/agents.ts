import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents, callLogs, jobs } from '../db/schema.js';
import { generateAgentWallet } from '../services/wallet.js';

export const agentRoutes = new Hono();

// ─── Validation ─────────────────────────────────────────

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.number().int().min(0).max(9),
  pricePerCall: z.string().regex(/^\d+$/, 'Must be a numeric string (wei)'),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  customSystemPrompt: z.string().max(5000).optional(),
});

// ─── POST /agents — Register new agent ──────────────────

agentRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { name, templateId, pricePerCall, ownerAddress, customSystemPrompt } = parsed.data;

  // Generate wallet
  const wallet = generateAgentWallet();

  // Get next agent ID (auto-increment from DB, matches on-chain later)
  // For MVP, we use DB sequence. On-chain registration happens separately.
  const [agent] = await db.insert(agents).values({
    agentId: 0, // Placeholder — will be updated after on-chain registration
    ownerAddress: ownerAddress.toLowerCase(),
    agentWallet: wallet.address.toLowerCase(),
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    name,
    templateId,
    customSystemPrompt: customSystemPrompt ?? null,
    pricePerCall,
    agentUri: '',
    isActive: true,
  }).returning();

  // Update agentId to match DB id (for MVP, DB id = on-chain id)
  await db.update(agents)
    .set({ agentId: agent.id })
    .where(eq(agents.id, agent.id));

  return c.json({
    success: true,
    agent: {
      id: agent.id,
      agentId: agent.id,
      name: agent.name,
      templateId: agent.templateId,
      pricePerCall: agent.pricePerCall,
      ownerAddress: agent.ownerAddress,
      agentWallet: wallet.address.toLowerCase(),
      isActive: agent.isActive,
      createdAt: agent.createdAt,
    },
  }, 201);
});

// ─── GET /agents — List agents ──────────────────────────

agentRoutes.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 20), 100);
  const offset = Number(c.req.query('offset') || 0);

  const results = await db.select({
    id: agents.id,
    agentId: agents.agentId,
    name: agents.name,
    templateId: agents.templateId,
    pricePerCall: agents.pricePerCall,
    ownerAddress: agents.ownerAddress,
    agentWallet: agents.agentWallet,
    isActive: agents.isActive,
    createdAt: agents.createdAt,
  })
  .from(agents)
  .where(eq(agents.isActive, true))
  .orderBy(desc(agents.createdAt))
  .limit(limit)
  .offset(offset);

  return c.json({ agents: results, limit, offset });
});

// ─── GET /agents/:agentId — Agent detail ────────────────

agentRoutes.get('/:agentId', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const [agent] = await db.select({
    id: agents.id,
    agentId: agents.agentId,
    name: agents.name,
    templateId: agents.templateId,
    pricePerCall: agents.pricePerCall,
    ownerAddress: agents.ownerAddress,
    agentWallet: agents.agentWallet,
    isActive: agents.isActive,
    createdAt: agents.createdAt,
    updatedAt: agents.updatedAt,
  })
  .from(agents)
  .where(eq(agents.agentId, agentId))
  .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  return c.json({ agent });
});

// ─── GET /agents/:agentId/stats ─────────────────────────

agentRoutes.get('/:agentId/stats', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  // Aggregate call stats
  const [stats] = await db.select({
    totalCalls: sql<number>`count(*)::int`,
    totalRevenue: sql<string>`coalesce(sum(${callLogs.revenue}), 0)::text`,
    ownerCalls: sql<number>`count(*) filter (where ${callLogs.isOwnerCall} = true)::int`,
    paidCalls: sql<number>`count(*) filter (where ${callLogs.isOwnerCall} = false)::int`,
  })
  .from(callLogs)
  .where(eq(callLogs.agentId, agentId));

  return c.json({
    agentId,
    name: agent.name,
    totalCalls: stats?.totalCalls || 0,
    totalRevenue: stats?.totalRevenue || '0',
    ownerCalls: stats?.ownerCalls || 0,
    paidCalls: stats?.paidCalls || 0,
    createdAt: agent.createdAt,
  });
});

// ─── GET /agents/:agentId/jobs ──────────────────────────

agentRoutes.get('/:agentId/jobs', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const agentJobs = await db.select()
    .from(jobs)
    .where(eq(jobs.agentId, agentId))
    .orderBy(desc(jobs.createdAt));

  return c.json({ jobs: agentJobs });
});
