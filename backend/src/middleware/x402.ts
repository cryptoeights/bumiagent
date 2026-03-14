import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';
import { createPublicClient, http, parseAbiItem, type Hex } from 'viem';
import { celo } from 'viem/chains';

const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Viem client for reading Celo mainnet
const celoClient = createPublicClient({
  chain: celo,
  transport: http(),
});

/**
 * Verify a cUSD transfer TX on Celo mainnet.
 * Checks: correct recipient, correct token (cUSD), amount >= pricePerCall.
 */
async function verifyPaymentTx(
  txHash: Hex,
  expectedTo: string,
  minAmount: bigint,
): Promise<{ valid: boolean; amount: bigint; from: string; error?: string }> {
  try {
    const receipt = await celoClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
      return { valid: false, amount: 0n, from: '', error: 'Transaction reverted' };
    }

    // Find the Transfer event from cUSD contract
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

    for (const log of receipt.logs) {
      // Check it's from cUSD contract
      if (log.address.toLowerCase() !== cUSD.toLowerCase()) continue;

      // Check topic matches Transfer event
      if (log.topics[0] !== '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') continue;

      // Decode: topics[1] = from, topics[2] = to, data = value
      const from = ('0x' + log.topics[1]!.slice(26)).toLowerCase();
      const to = ('0x' + log.topics[2]!.slice(26)).toLowerCase();
      const value = BigInt(log.data);

      if (to === expectedTo.toLowerCase() && value >= minAmount) {
        return { valid: true, amount: value, from };
      }
    }

    return { valid: false, amount: 0n, from: '', error: 'No matching cUSD transfer found in TX' };
  } catch (err: any) {
    return { valid: false, amount: 0n, from: '', error: `TX verification failed: ${err.message}` };
  }
}

/**
 * x402 Payment Middleware
 *
 * Flow:
 * 1. Owner calls → free, pass through
 * 2. Non-owner without payment → return HTTP 402 with pricing
 * 3. Non-owner with x-payment-txhash → verify on-chain cUSD transfer → allow if valid
 */
export async function x402Middleware(c: Context, next: Next) {
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
    return next();
  }

  // Look up agent
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return next();

  // Owner calls are free
  if (callerAddress === agent.ownerAddress.toLowerCase()) {
    return next();
  }

  // Check for payment TX hash
  const txHash = c.req.header('x-payment-txhash');

  if (!txHash) {
    // Check if a premium model is selected — if so, the chat route handles 402 itself
    // This middleware only handles free-model non-owner payment gating
    return c.json({
      x402Version: 1,
      accepts: [{
        scheme: 'exact',
        network: 'celo',
        maxAmountRequired: agent.pricePerCall,
        resource: c.req.url,
        payTo: agent.agentWallet,
        asset: cUSD,
        description: `Chat with ${agent.name} — pay ${agent.pricePerCall} wei cUSD`,
      }],
    }, 402);
  }

  // Verify the on-chain TX
  const verification = await verifyPaymentTx(
    txHash as Hex,
    agent.agentWallet,
    BigInt(agent.pricePerCall),
  );

  if (!verification.valid) {
    return c.json({
      error: 'Payment verification failed',
      detail: verification.error,
      required: {
        payTo: agent.agentWallet,
        amount: agent.pricePerCall,
        asset: cUSD,
      },
    }, 402);
  }

  console.log(`✅ Payment verified: ${txHash} — ${verification.amount} wei cUSD from ${verification.from}`);

  return next();
}

/**
 * Get payment info from request headers
 */
export function getPaymentInfo(c: Context): { revenue: string; txHash: string | null } | null {
  const txHash = c.req.header('x-payment-txhash');
  if (!txHash) return null;
  return {
    revenue: '0', // Will be resolved from agent in chat handler
    txHash,
  };
}
