import { Hono } from 'hono';
import { z } from 'zod';

const SELF_API = 'https://app.ai.self.xyz/api/agent';
const CELO_CHAIN_ID = 42220;

export const selfRoutes = new Hono();

// ─── POST /self/register — Start Self Agent ID registration ──

const registerSchema = z.object({
  humanAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
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
      qrData: data.deepLink, // For QR rendering
    });
  } catch (err: any) {
    return c.json({ error: `Self API error: ${err.message}` }, 502);
  }
});

// ─── GET /self/status?token=xxx — Poll registration status ──

selfRoutes.get('/status', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'token required' }, 400);

  try {
    const res = await fetch(`${SELF_API}/register/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return c.json({ error: data.error || 'Status check failed', status: res.status }, res.status as any);
    }

    return c.json(data);
  } catch (err: any) {
    return c.json({ error: `Self API error: ${err.message}` }, 502);
  }
});

// ─── GET /self/verify/:agentId — Check if CeloSpawn agent's owner is verified ──

selfRoutes.get('/verify/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  // First get the agent's owner address from our DB (via agents API)
  try {
    const agentRes = await fetch(`http://localhost:3001/api/agents/${agentId}`);
    if (!agentRes.ok) return c.json({ verified: false, error: 'Agent not found' });
    const agentData = await agentRes.json() as { agent: { ownerAddress: string } };
    const ownerAddress = agentData.agent.ownerAddress;

    // Check if this human has any verified agents on Self
    const res = await fetch(`${SELF_API}/agents/${CELO_CHAIN_ID}/${ownerAddress}`);
    const data = await res.json();

    if (!res.ok) {
      return c.json({ verified: false, error: data.error });
    }

    const hasVerified = (data.agents || []).length > 0;

    return c.json({
      verified: hasVerified,
      selfAgents: data.agents || [],
      totalCount: data.totalCount || 0,
    });
  } catch (err: any) {
    return c.json({ verified: false, error: err.message });
  }
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
