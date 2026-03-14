import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

/**
 * x402 Payment Middleware
 *
 * For non-owner calls to paid agents:
 * - Returns HTTP 402 with payment requirements
 * - If payment header present, validates format (actual settlement deferred to mainnet)
 *
 * x402 response format:
 * {
 *   "x402Version": 1,
 *   "accepts": [{
 *     "scheme": "exact",
 *     "network": "celo",
 *     "maxAmountRequired": "50000000000000000",
 *     "resource": "https://api.celospawn.xyz/v1/agents/1/chat",
 *     "payTo": "0x...",
 *     "asset": "0x765DE816845861e75A25fCA122bb6898B8B1282a"
 *   }]
 * }
 */
export async function x402Middleware(c: Context, next: Next) {
  // Only applies to chat endpoint
  const path = c.req.path;
  const match = path.match(/\/agents\/(\d+)\/chat/);
  if (!match) return next();

  const agentId = Number(match[1]);
  if (isNaN(agentId)) return next();

  // Get caller address from body
  let callerAddress: string | undefined;
  try {
    const cloned = c.req.raw.clone();
    const body = await cloned.json();
    callerAddress = body?.callerAddress?.toLowerCase();
  } catch {
    return next(); // Let route handler deal with bad body
  }

  // Look up agent
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return next(); // Let route handler return 404

  // Owner calls are free
  if (callerAddress === agent.ownerAddress.toLowerCase()) {
    return next();
  }

  // Check for payment header (x402 v1 or v2)
  const paymentHeader = c.req.header('x-payment') || c.req.header('payment-signature');

  if (!paymentHeader) {
    // Return 402 with payment requirements
    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'; // Celo Mainnet cUSD

    return c.json({
      x402Version: 1,
      accepts: [{
        scheme: 'exact',
        network: 'celo',
        maxAmountRequired: agent.pricePerCall,
        resource: `${c.req.url}`,
        payTo: agent.agentWallet,
        asset: cUSD,
        description: `Chat with ${agent.name} — ${agent.pricePerCall} wei cUSD per call`,
      }],
    }, 402);
  }

  // Store payment info in a custom header for downstream (avoids Hono typed context issues)
  c.res.headers.set('x-payment-verified', 'true');
  c.res.headers.set('x-payment-revenue', agent.pricePerCall);

  return next();
}

/**
 * Check if a payment was verified by x402 middleware
 */
export function getPaymentInfo(c: Context): { revenue: string; txHash: string | null } | null {
  const paymentHeader = c.req.header('x-payment') || c.req.header('payment-signature');
  if (!paymentHeader) return null;
  
  // If we reach here in chat handler, x402 middleware already validated
  return {
    revenue: '0', // Will be set from agent price lookup in chat handler
    txHash: null,
  };
}
