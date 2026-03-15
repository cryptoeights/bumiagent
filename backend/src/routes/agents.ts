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
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  templateId: z.number().int().min(0).max(9),
  pricePerCall: z.string().regex(/^\d+$/, 'Must be a numeric string (wei)'),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  customSystemPrompt: z.string().max(10000).optional(),
});

// ─── POST /agents — Register new agent ──────────────────

agentRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { name, description, logoUrl, templateId, pricePerCall, ownerAddress, customSystemPrompt } = parsed.data;

  // Generate wallet
  const wallet = generateAgentWallet();

  const [agent] = await db.insert(agents).values({
    agentId: 0,
    ownerAddress: ownerAddress.toLowerCase(),
    agentWallet: wallet.address.toLowerCase(),
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    name,
    description: description || '',
    logoUrl: logoUrl || '',
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
      privateKey: wallet.privateKey, // Shown ONCE at deploy — user must save this
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
    description: agents.description,
    logoUrl: agents.logoUrl,
    templateId: agents.templateId,
    pricePerCall: agents.pricePerCall,
    ownerAddress: agents.ownerAddress,
    agentWallet: agents.agentWallet,
    isActive: agents.isActive,
    selfVerified: agents.selfVerified,
    subscriptionTier: agents.subscriptionTier,
    createdAt: agents.createdAt,
  })
  .from(agents)
  .where(eq(agents.isActive, true))
  .orderBy(desc(agents.createdAt))
  .limit(limit)
  .offset(offset);

  return c.json({ agents: results, limit, offset });
});

// ─── PATCH /agents/:agentId — Update agent (owner only) ──

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  customSystemPrompt: z.string().max(10000).optional(),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

agentRoutes.patch('/:agentId', async (c) => {
  const agentId = parseInt(c.req.param('agentId'), 10);
  if (isNaN(agentId)) return c.json({ error: 'Invalid agentId' }, 400);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

  // Check ownership
  const [agent] = await db.select({ ownerAddress: agents.ownerAddress })
    .from(agents).where(eq(agents.agentId, agentId)).limit(1);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.ownerAddress !== parsed.data.ownerAddress.toLowerCase()) {
    return c.json({ error: 'Not the agent owner' }, 403);
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.logoUrl !== undefined) updates.logoUrl = parsed.data.logoUrl;
  if (parsed.data.customSystemPrompt !== undefined) updates.customSystemPrompt = parsed.data.customSystemPrompt;

  const [updated] = await db.update(agents)
    .set(updates)
    .where(eq(agents.agentId, agentId))
    .returning();

  return c.json({ agent: { agentId: updated.agentId, name: updated.name, description: updated.description, logoUrl: updated.logoUrl, customSystemPrompt: updated.customSystemPrompt } });
});

// ─── GET /agents/:agentId — Agent detail ────────────────

agentRoutes.get('/:agentId', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const [agent] = await db.select({
    id: agents.id,
    agentId: agents.agentId,
    name: agents.name,
    description: agents.description,
    logoUrl: agents.logoUrl,
    templateId: agents.templateId,
    customSystemPrompt: agents.customSystemPrompt,
    pricePerCall: agents.pricePerCall,
    ownerAddress: agents.ownerAddress,
    agentWallet: agents.agentWallet,
    isActive: agents.isActive,
    selfVerified: agents.selfVerified,
    subscriptionTier: agents.subscriptionTier,
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

  // Aggregate call stats with tier breakdown
  const [stats] = await db.select({
    totalCalls: sql<number>`count(*)::int`,
    totalRevenue: sql<string>`coalesce(sum(${callLogs.revenue}), 0)::text`,
    totalEarthPool: sql<string>`coalesce(sum(${callLogs.earthPoolShare}), 0)::text`,
    totalOwnerShare: sql<string>`coalesce(sum(${callLogs.ownerShare}), 0)::text`,
    ownerCalls: sql<number>`count(*) filter (where ${callLogs.isOwnerCall} = true)::int`,
    paidCalls: sql<number>`count(*) filter (where ${callLogs.isOwnerCall} = false)::int`,
    freeModelCalls: sql<number>`count(*) filter (where ${callLogs.modelTier} = 'free' or ${callLogs.modelTier} is null)::int`,
    premiumModelCalls: sql<number>`count(*) filter (where ${callLogs.modelTier} = 'premium')::int`,
  })
  .from(callLogs)
  .where(eq(callLogs.agentId, agentId));

  return c.json({
    agentId,
    name: agent.name,
    subscriptionTier: agent.subscriptionTier || 'free',
    totalCalls: stats?.totalCalls || 0,
    totalRevenue: stats?.totalRevenue || '0',
    totalEarthPool: stats?.totalEarthPool || '0',
    totalOwnerShare: stats?.totalOwnerShare || '0',
    ownerCalls: stats?.ownerCalls || 0,
    paidCalls: stats?.paidCalls || 0,
    freeModelCalls: stats?.freeModelCalls || 0,
    premiumModelCalls: stats?.premiumModelCalls || 0,
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
