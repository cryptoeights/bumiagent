import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

export const subscriptionRoutes = new Hono();

// Premium subscription price: 5 cUSD
const PREMIUM_PRICE = '5000000000000000000'; // 5e18 wei
const PREMIUM_PRICE_DISPLAY = '5.00';

// ─── GET /subscription/pricing — Get tier pricing info ──

subscriptionRoutes.get('/pricing', async (c) => {
  return c.json({
    free: {
      price: '0',
      priceDisplay: '0',
      features: [
        'Unlimited free model calls',
        'Earn 85% of agent revenue',
        '15% revenue to EarthPool 🌍',
        'Premium models: 100% cost to EarthPool',
      ],
    },
    premium: {
      price: PREMIUM_PRICE,
      priceDisplay: PREMIUM_PRICE_DISPLAY,
      currency: 'cUSD',
      period: 'one-time',
      features: [
        'Everything in Free',
        'Keep 100% of all revenue',
        'Premium models: revenue stays with you',
        '0% EarthPool contribution',
        'Priority in registry listings',
      ],
    },
  });
});

// ─── POST /agents/:agentId/subscribe — Upgrade to premium ──

const subscribeSchema = z.object({
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

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

  if (parsed.data.callerAddress.toLowerCase() !== agent.ownerAddress) {
    return c.json({ error: 'Only agent owner can subscribe' }, 403);
  }

  if (agent.subscriptionTier === 'premium') {
    return c.json({ error: 'Already premium' }, 409);
  }

  // TODO: verify TX receipt on-chain (same pattern as x402 middleware)
  // For hackathon MVP: trust the txHash and flip tier

  await db.update(agents)
    .set({ subscriptionTier: 'premium', updatedAt: new Date() })
    .where(eq(agents.agentId, agentId));

  return c.json({
    success: true,
    agentId,
    subscriptionTier: 'premium',
    txHash: parsed.data.txHash,
  });
});
