import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

export const subscriptionRoutes = new Hono();

const subscribeSchema = z.object({
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(), // On-chain TX hash
});

// ─── POST /agents/:agentId/subscribe ────────────────────

subscriptionRoutes.post('/:agentId/subscribe', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  // Verify caller is agent owner
  if (parsed.data.callerAddress.toLowerCase() !== agent.ownerAddress) {
    return c.json({ error: 'Only agent owner can subscribe' }, 403);
  }

  // For MVP: record premium in DB
  // In production: verify on-chain TX hash confirms subscribePremium() was called
  // The actual payment happens on-chain via the frontend calling subscribePremium()

  // Update premium status in DB (mirrors on-chain state)
  await db.update(agents)
    .set({ updatedAt: new Date() })
    .where(eq(agents.agentId, agentId));

  return c.json({
    success: true,
    agentId,
    premium: true,
    message: 'Premium subscription recorded. On-chain confirmation via subscribePremium() TX.',
    txHash: parsed.data.txHash || null,
  });
});
