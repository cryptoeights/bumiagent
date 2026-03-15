import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents, callLogs } from '../db/schema.js';
import { getTemplate } from '../data/templates.js';
import { chatCompletion, getModelDef, getModelsForTier, type ChatMessage } from '../services/openrouter.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { getPaymentInfo } from '../middleware/x402.js';
import crypto from 'node:crypto';

export const chatRoutes = new Hono();

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(50).optional(),
  modelId: z.string().optional(), // Optional model selection
});

// ─── GET /agents/:agentId/models — Available models (tier-aware) ─────

chatRoutes.get('/:agentId/models', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  // Look up agent to get subscription tier
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  const agentTier = (agent?.subscriptionTier as 'free' | 'premium') || 'free';
  const models = getModelsForTier(agentTier);

  return c.json({ models, agentTier });
});

// ─── POST /agents/:agentId/chat ─────────────────────────

chatRoutes.post('/:agentId/chat', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { message, callerAddress, history, modelId } = parsed.data;

  // Look up agent
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (!agent.isActive) return c.json({ error: 'Agent is inactive' }, 403);

  const isOwnerCall = callerAddress?.toLowerCase() === agent.ownerAddress.toLowerCase();
  const agentTier = (agent.subscriptionTier as 'free' | 'premium') || 'free';

  // Model cost logic:
  // - Free models: owner = free, non-owner = agent price (handled by x402 middleware)
  // - Premium models: everyone pays per call UNLESS agent has premium subscription (included)
  const selectedModel = modelId ? getModelDef(modelId) : undefined;
  const isPremiumModel = selectedModel?.tier === 'premium' || (!selectedModel && agentTier === 'premium');

  if (isPremiumModel) {
    // Premium model payment check:
    // - Premium subscription agents: premium models included (no per-call payment)
    // - Free-tier agents: everyone pays per call for premium models
    const premiumIncluded = agentTier === 'premium';

    if (!premiumIncluded) {
      const txHash = c.req.header('x-payment-txhash');
      if (!txHash) {
        const modelForPayment = selectedModel || getModelDef('sonnet-4.6');
        return c.json({
          x402Version: 1,
          accepts: [{
            scheme: 'exact',
            network: 'celo',
            maxAmountRequired: modelForPayment!.costPerCall,
            resource: c.req.url,
            payTo: agent.agentWallet,
            asset: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
            description: `${modelForPayment!.name} — ${modelForPayment!.costPerCall} wei cUSD per call`,
            modelId: modelForPayment!.id,
          }],
        }, 402);
      }
    }
    // TX verification is done by x402 middleware for non-owners
  }

  // Free model: rate limit for owner, x402 for non-owner (already handled by middleware)
  if (!isPremiumModel && isOwnerCall) {
    const rateLimitResult = await checkRateLimit(agentId);
    if (!rateLimitResult.allowed) {
      return c.json({
        error: 'Rate limit exceeded',
        limit: rateLimitResult.limit,
        remaining: 0,
        resetAt: rateLimitResult.resetAt,
      }, 429);
    }
  }

  // Build messages with template system prompt
  const template = getTemplate(agent.templateId);
  const basePrompt = template?.systemPrompt || 'You are a helpful AI assistant.';
  const systemPrompt = agent.customSystemPrompt
    ? `${basePrompt}\n\n---\n\n## Agent Skills\n\n${agent.customSystemPrompt}`
    : basePrompt;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await chatCompletion(messages, modelId, agentTier);

    // Log the call
    const messageHash = '0x' + crypto.createHash('sha256').update(message).digest('hex').slice(0, 64);
    const responseHash = '0x' + crypto.createHash('sha256').update(response.content).digest('hex').slice(0, 64);
    const paymentInfo = getPaymentInfo(c);

    const revenue = isPremiumModel
      ? (selectedModel?.costPerCall || '0')
      : (paymentInfo?.revenue || '0');

    // EarthPool split logic:
    // - Premium subscription: premium models included, owner keeps all revenue
    // - Free tier + premium model: 100% to EarthPool
    // - Free tier + free model: 15% to EarthPool, 85% to owner
    const ownerTier = agentTier;
    const revenueBigInt = BigInt(revenue);
    let earthPoolShare = 0n;
    let ownerShare = 0n;

    if (ownerTier === 'premium') {
      // Premium subscription: owner keeps 100%
      earthPoolShare = 0n;
      ownerShare = revenueBigInt;
    } else {
      // Free tier
      if (isPremiumModel) {
        // Sonnet on free tier: 100% to EarthPool
        earthPoolShare = revenueBigInt;
        ownerShare = 0n;
      } else {
        // Free model on free tier: 15% to EarthPool, 85% to owner
        earthPoolShare = (revenueBigInt * 15n) / 100n;
        ownerShare = revenueBigInt - earthPoolShare;
      }
    }

    await db.insert(callLogs).values({
      agentId,
      callerAddress: callerAddress?.toLowerCase() ?? null,
      messageHash,
      responseHash,
      revenue,
      earthPoolShare: earthPoolShare.toString(),
      ownerShare: ownerShare.toString(),
      llmModel: response.model,
      llmTokensUsed: response.tokensUsed,
      modelTier: response.modelTier,
      isOwnerCall: isOwnerCall && !isPremiumModel,
      paymentTxHash: paymentInfo?.txHash || c.req.header('x-payment-txhash') || null,
    });

    return c.json({
      response: response.content,
      model: response.model,
      modelTier: response.modelTier,
      modelId: modelId || 'auto',
      tokensUsed: response.tokensUsed,
      agentId,
    });
  } catch (err: any) {
    console.error(`Chat error for agent ${agentId}:`, err.message);

    const errMsg = err.message || '';
    if (errMsg.includes('429') || errMsg.includes('402') || errMsg.includes('spend limit')) {
      return c.json({ error: 'AI model temporarily busy. Try again in a moment.', retryAfter: 10 }, 503);
    }
    if (errMsg.includes('All models failed')) {
      return c.json({ error: 'All AI models unavailable. Please try again.', retryAfter: 10 }, 503);
    }

    return c.json({ error: 'Failed to generate response', detail: err.message }, 500);
  }
});
