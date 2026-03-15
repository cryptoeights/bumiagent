import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { agentRoutes } from './routes/agents.js';
import { chatRoutes } from './routes/chat.js';
import { templateRoutes } from './routes/templates.js';
import { jobRoutes } from './routes/jobs.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { conversationRoutes } from './routes/conversations.js';
import { selfRoutes } from './routes/self.js';
import { x402Middleware } from './middleware/x402.js';

const app = new Hono().basePath('/api');

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3005',
      'https://bumiagent.one',
      'https://www.bumiagent.one',
    ];
    if (allowed.includes(origin)) return origin;
    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// x402 payment middleware (before chat route)
app.use('/agents/:agentId/chat', x402Middleware);

// Routes
app.route('/agents', subscriptionRoutes);
app.route('/agents', agentRoutes);
app.route('/agents', chatRoutes);
app.route('/templates', templateRoutes);
app.route('/jobs', jobRoutes);
app.route('/conversations', conversationRoutes);
app.route('/self', selfRoutes);

// Start
console.log(`🚀 Bumi Agent API starting on port ${env.PORT}`);
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`);
});

export default app;
