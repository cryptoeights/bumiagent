import { Hono } from 'hono';
import { templates } from '../data/templates.js';

export const templateRoutes = new Hono();

// ─── GET /templates ─────────────────────────────────────

templateRoutes.get('/', (c) => {
  return c.json({
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      suggestedPrice: t.suggestedPrice,
      icon: t.icon,
      category: t.category,
    })),
  });
});

// ─── GET /templates/:templateId ─────────────────────────

templateRoutes.get('/:templateId', (c) => {
  const id = Number(c.req.param('templateId'));
  const template = templates.find(t => t.id === id);

  if (!template) return c.json({ error: 'Template not found' }, 404);

  return c.json({ template });
});
