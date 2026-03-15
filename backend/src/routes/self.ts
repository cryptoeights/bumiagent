import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

const SELF_API = 'https://app.ai.self.xyz/api/agent';
const CELO_CHAIN_ID = 42220;

export const selfRoutes = new Hono();

// ─── POST /self/register — Start Self Agent ID registration ──

const registerSchema = z.object({
  humanAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  celospawnAgentId: z.number().optional(),
});

selfRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

  try {
    const res = await fetch(`${SELF_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'linked',
        network: 'mainnet',
        humanAddress: parsed.data.humanAddress,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return c.json({ error: data.error || 'Self registration failed', status: res.status }, res.status as any);
    }

    return c.json({
      sessionToken: data.sessionToken,
      deepLink: data.deepLink,
      agentAddress: data.agentAddress,
      qrData: data.qrData,
      humanInstructions: data.humanInstructions || [],
      expiresAt: data.expiresAt,
    });
  } catch (err: any) {
    return c.json({ error: `Self API error: ${err.message}` }, 502);
  }
});

// ─── GET /self/status — Poll registration status ──

selfRoutes.get('/status', async (c) => {
  const token = c.req.query('token');
  const celospawnAgentId = c.req.query('agentId');
  if (!token) return c.json({ error: 'token required' }, 400);

  try {
    const res = await fetch(`${SELF_API}/register/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return c.json({ error: data.error || 'Status check failed', status: res.status }, res.status as any);
    }

    // If completed, save to our DB
    if (data.stage === 'completed' && celospawnAgentId) {
      const agentIdNum = parseInt(celospawnAgentId, 10);
      if (!isNaN(agentIdNum)) {
        await db.update(agents)
          .set({
            selfVerified: true,
            selfAgentId: data.agentId || null,
            updatedAt: new Date(),
          })
          .where(eq(agents.agentId, agentIdNum));
      }
    }

    return c.json(data);
  } catch (err: any) {
    return c.json({ error: `Self API error: ${err.message}` }, 502);
  }
});

// ─── GET /self/verify/:agentId — Check if Bumi Agent is Self verified ──

selfRoutes.get('/verify/:agentId', async (c) => {
  const agentId = parseInt(c.req.param('agentId'), 10);
  if (isNaN(agentId)) return c.json({ verified: false, error: 'Invalid agentId' });

  try {
    // Check our DB first
    const [agent] = await db.select({
      selfVerified: agents.selfVerified,
      selfAgentId: agents.selfAgentId,
      ownerAddress: agents.ownerAddress,
    })
      .from(agents)
      .where(eq(agents.agentId, agentId))
      .limit(1);

    if (!agent) return c.json({ verified: false, error: 'Agent not found' });

    // If already marked verified in DB
    if (agent.selfVerified) {
      // If we have a Self agent ID, double-check on-chain
      if (agent.selfAgentId) {
        try {
          const selfRes = await fetch(`${SELF_API}/verify/${CELO_CHAIN_ID}/${agent.selfAgentId}`);
          const selfData = await selfRes.json();
          return c.json({
            verified: selfData.isVerified === true,
            selfAgentId: agent.selfAgentId,
            verificationStrength: selfData.verificationStrength,
            strengthLabel: selfData.strengthLabel,
          });
        } catch {
          // Self API unreachable, trust our DB
          return c.json({ verified: true, selfAgentId: agent.selfAgentId });
        }
      }
      // No Self agent ID but marked verified — trust DB
      return c.json({ verified: true });
    }

    // Not verified in DB — also check Self by human address as fallback
    try {
      const res = await fetch(`${SELF_API}/agents/${CELO_CHAIN_ID}/${agent.ownerAddress}`);
      const data = await res.json();
      if ((data.agents || []).length > 0) {
        // Found on Self — update our DB
        const selfAgentId = data.agents[0]?.agentId;
        await db.update(agents)
          .set({ selfVerified: true, selfAgentId: selfAgentId || null, updatedAt: new Date() })
          .where(eq(agents.agentId, agentId));
        return c.json({ verified: true, selfAgentId });
      }
    } catch {}

    return c.json({ verified: false });
  } catch (err: any) {
    return c.json({ verified: false, error: err.message });
  }
});

// ─── POST /self/mark-verified/:agentId — Manually mark agent verified after Self app completion ──

const markSchema = z.object({
  selfAgentId: z.number().optional(),
  selfAgentAddress: z.string().optional(),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

selfRoutes.post('/mark-verified/:agentId', async (c) => {
  const agentId = parseInt(c.req.param('agentId'), 10);
  if (isNaN(agentId)) return c.json({ error: 'Invalid agentId' }, 400);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const parsed = markSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400);

  // Verify ownership
  const [agent] = await db.select({ ownerAddress: agents.ownerAddress })
    .from(agents).where(eq(agents.agentId, agentId)).limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.ownerAddress.toLowerCase() !== parsed.data.ownerAddress.toLowerCase()) {
    return c.json({ error: 'Not the agent owner' }, 403);
  }

  await db.update(agents)
    .set({
      selfVerified: true,
      selfAgentId: parsed.data.selfAgentId || null,
      updatedAt: new Date(),
    })
    .where(eq(agents.agentId, agentId));

  return c.json({ success: true, agentId, selfVerified: true });
});

// ─── GET /self/info/:agentId — Get agent info from Self ──

selfRoutes.get('/info/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  try {
    const res = await fetch(`${SELF_API}/info/${CELO_CHAIN_ID}/${agentId}`);
    const data = await res.json();

    if (!res.ok) {
      return c.json({ found: false, error: data.error });
    }

    return c.json({ found: true, ...data });
  } catch (err: any) {
    return c.json({ found: false, error: err.message });
  }
});
