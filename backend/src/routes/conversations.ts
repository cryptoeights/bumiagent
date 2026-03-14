import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { conversations } from '../db/schema.js';

export const conversationRoutes = new Hono();

const createSchema = z.object({
  agentId: z.number().int().positive(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  title: z.string().min(1).max(200),
});

const updateMessagesSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
});

// ─── GET /conversations?userAddress=0x...&agentId=1 ─────

conversationRoutes.get('/', async (c) => {
  const userAddress = c.req.query('userAddress')?.toLowerCase();
  if (!userAddress) return c.json({ error: 'userAddress required' }, 400);

  const agentId = c.req.query('agentId') ? Number(c.req.query('agentId')) : undefined;

  let conditions = [eq(conversations.userAddress, userAddress)];
  if (agentId !== undefined) {
    conditions.push(eq(conversations.agentId, agentId));
  }

  const results = await db.select({
    id: conversations.id,
    agentId: conversations.agentId,
    title: conversations.title,
    messageCount: conversations.messages,
    createdAt: conversations.createdAt,
    updatedAt: conversations.updatedAt,
  })
  .from(conversations)
  .where(and(...conditions))
  .orderBy(desc(conversations.updatedAt));

  // Return with message count instead of full messages for list view
  const list = results.map(r => ({
    id: r.id,
    agentId: r.agentId,
    title: r.title,
    messageCount: Array.isArray(r.messageCount) ? r.messageCount.length : 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return c.json({ conversations: list });
});

// ─── POST /conversations — Create new conversation ──────

conversationRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

  const [conv] = await db.insert(conversations).values({
    agentId: parsed.data.agentId,
    userAddress: parsed.data.userAddress.toLowerCase(),
    title: parsed.data.title,
    messages: [],
  }).returning();

  return c.json({ conversation: conv }, 201);
});

// ─── GET /conversations/:id — Get full conversation ─────

conversationRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400);

  const [conv] = await db.select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  if (!conv) return c.json({ error: 'Conversation not found' }, 404);

  return c.json({ conversation: conv });
});

// ─── PATCH /conversations/:id/messages — Append messages ─

conversationRoutes.patch('/:id/messages', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const parsed = updateMessagesSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

  const [conv] = await db.select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  if (!conv) return c.json({ error: 'Conversation not found' }, 404);

  const existingMessages = Array.isArray(conv.messages) ? conv.messages : [];
  const updatedMessages = [...existingMessages, ...parsed.data.messages];

  // Auto-update title from first user message if title is generic
  let newTitle = conv.title;
  if (conv.title === 'New Chat' && parsed.data.messages.length > 0) {
    const firstUserMsg = parsed.data.messages.find((m: any) => m.role === 'user');
    if (firstUserMsg) {
      newTitle = firstUserMsg.content.slice(0, 80) + (firstUserMsg.content.length > 80 ? '...' : '');
    }
  }

  await db.update(conversations)
    .set({ 
      messages: updatedMessages, 
      title: newTitle,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));

  return c.json({ success: true, messageCount: updatedMessages.length, title: newTitle });
});

// ─── DELETE /conversations/:id ──────────────────────────

conversationRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400);

  await db.delete(conversations).where(eq(conversations.id, id));

  return c.json({ success: true });
});
