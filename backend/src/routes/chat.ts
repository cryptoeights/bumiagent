import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents, callLogs } from '../db/schema.js';
import { getTemplate } from '../data/templates.js';
import { chatCompletion, getModelDef, AVAILABLE_MODELS, type ChatMessage } from '../services/openrouter.js';
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

// ─── GET /agents/:agentId/models — Available models ─────

chatRoutes.get('/:agentId/models', async (c) => {
  // Return available models with pricing
  const models = AVAILABLE_MODELS.map(m => ({
    id: m.id,
    name: m.name,
    tier: m.tier,
    costPerCall: m.costPerCall,
    description: m.description,
    webSearch: m.webSearch,
  }));

  return c.json({ models });
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

  // Model cost logic:
  // - Free models: owner = free, non-owner = agent price (handled by x402 middleware)
  // - Premium models: everyone pays model cost per call
  const selectedModel = modelId ? getModelDef(modelId) : undefined;
  const isPremiumModel = selectedModel?.tier === 'premium';

  if (isPremiumModel) {
    // Premium model requires payment from EVERYONE (including owner)
    const txHash = c.req.header('x-payment-txhash');
    if (!txHash) {
      return c.json({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'celo',
          maxAmountRequired: selectedModel!.costPerCall,
          resource: c.req.url,
          payTo: agent.agentWallet,
          asset: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
          description: `${selectedModel!.name} — ${selectedModel!.costPerCall} wei cUSD per call`,
          modelId: selectedModel!.id,
        }],
      }, 402);
    }
    // TX verification is done by x402 middleware for non-owners
    // For owners using premium models, we trust the TX hash (middleware only checks non-owners)
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
  const systemPrompt = agent.customSystemPrompt || template?.systemPrompt || 'You are a helpful AI assistant.';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await chatCompletion(messages, modelId);

    // Log the call
    const messageHash = '0x' + crypto.createHash('sha256').update(message).digest('hex').slice(0, 64);
    const responseHash = '0x' + crypto.createHash('sha256').update(response.content).digest('hex').slice(0, 64);
    const paymentInfo = getPaymentInfo(c);

    const revenue = isPremiumModel
      ? selectedModel!.costPerCall
      : (paymentInfo?.revenue || '0');

    await db.insert(callLogs).values({
      agentId,
      callerAddress: callerAddress?.toLowerCase() ?? null,
      messageHash,
      responseHash,
      revenue,
      llmModel: response.model,
      llmTokensUsed: response.tokensUsed,
      isOwnerCall: isOwnerCall && !isPremiumModel,
      paymentTxHash: paymentInfo?.txHash || c.req.header('x-payment-txhash') || null,
    });

    return c.json({
      response: response.content,
      model: response.model,
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
