import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents, callLogs } from '../db/schema.js';
import { getTemplate } from '../data/templates.js';
import { chatCompletion, type ChatMessage } from '../services/openrouter.js';
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
});

// ─── POST /agents/:agentId/chat ─────────────────────────

chatRoutes.post('/:agentId/chat', async (c) => {
  const agentId = Number(c.req.param('agentId'));
  if (isNaN(agentId)) return c.json({ error: 'Invalid agent ID' }, 400);

  // Body may have been parsed by x402 middleware (stored in header)
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { message, callerAddress, history } = parsed.data;

  // Look up agent
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (!agent.isActive) return c.json({ error: 'Agent is inactive' }, 403);

  // Determine if caller is the owner (free) or public (paid via x402 — S03)
  const isOwnerCall = callerAddress?.toLowerCase() === agent.ownerAddress.toLowerCase();

  // Rate limiting for free tier (owner calls)
  if (isOwnerCall) {
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
    // Include conversation history for context (last 20 messages max)
    ...(history || []).slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  // Call OpenRouter
  try {
    const response = await chatCompletion(messages, false); // isPremium will come from S03

    // Log the call
    const messageHash = '0x' + crypto.createHash('sha256').update(message).digest('hex').slice(0, 64);
    const responseHash = '0x' + crypto.createHash('sha256').update(response.content).digest('hex').slice(0, 64);
    const paymentInfo = getPaymentInfo(c);

    await db.insert(callLogs).values({
      agentId,
      callerAddress: callerAddress?.toLowerCase() ?? null,
      messageHash,
      responseHash,
      revenue: paymentInfo?.revenue || '0',
      llmModel: response.model,
      llmTokensUsed: response.tokensUsed,
      isOwnerCall,
      paymentTxHash: paymentInfo?.txHash || null,
    });

    return c.json({
      response: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
      agentId,
    });
  } catch (err: any) {
    console.error(`Chat error for agent ${agentId}:`, err.message);

    // Graceful fallback
    const errMsg = err.message || '';
    if (errMsg.includes('429') || errMsg.includes('402') || errMsg.includes('spend limit')) {
      return c.json({
        error: 'All AI models are temporarily busy. Retrying in a moment should work.',
        retryAfter: 10,
      }, 503);
    }

    if (errMsg.includes('All models failed')) {
      return c.json({
        error: 'All AI models are currently unavailable. Please try again in a few seconds.',
        retryAfter: 10,
      }, 503);
    }

    return c.json({ error: 'Failed to generate response', detail: err.message }, 500);
  }
});
