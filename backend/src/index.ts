import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { agentRoutes } from './routes/agents.js';
import { chatRoutes } from './routes/chat.js';
import { templateRoutes } from './routes/templates.js';

const app = new Hono().basePath('/api');

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/agents', agentRoutes);
app.route('/agents', chatRoutes);
app.route('/templates', templateRoutes);

// Start
console.log(`🚀 CeloSpawn API starting on port ${env.PORT}`);
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`);
});

export default app;
