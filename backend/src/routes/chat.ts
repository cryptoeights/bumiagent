import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents, callLogs } from '../db/schema.js';
import { getTemplate } from '../data/templates.js';
import { chatCompletion, type ChatMessage } from '../services/openrouter.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import crypto from 'node:crypto';

export const chatRoutes = new Hono();

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
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

  const { message, callerAddress } = parsed.data;

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
    { role: 'user', content: message },
  ];

  // Call OpenRouter
  try {
    const response = await chatCompletion(messages, false); // isPremium will come from S03

    // Log the call
    const messageHash = '0x' + crypto.createHash('sha256').update(message).digest('hex').slice(0, 64);
    const responseHash = '0x' + crypto.createHash('sha256').update(response.content).digest('hex').slice(0, 64);

    await db.insert(callLogs).values({
      agentId,
      callerAddress: callerAddress?.toLowerCase() ?? null,
      messageHash,
      responseHash,
      revenue: '0', // Free for now — x402 in S03
      llmModel: response.model,
      llmTokensUsed: response.tokensUsed,
      isOwnerCall,
      paymentTxHash: null,
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
    if (err.message?.includes('429') || err.message?.includes('402') || err.message?.includes('spend limit')) {
      return c.json({
        error: 'Agent is resting — AI model quota reached. Try again later or check OpenRouter API key limits.',
        retryAfter: 60,
      }, 503);
    }

    return c.json({ error: 'Failed to generate response', detail: err.message }, 500);
  }
});
