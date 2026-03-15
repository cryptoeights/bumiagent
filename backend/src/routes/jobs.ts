import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs, agents } from '../db/schema.js';
import { chatCompletion, type ChatMessage } from '../services/openrouter.js';
import { getTemplate } from '../data/templates.js';

export const jobRoutes = new Hono();

// ─── Validation ─────────────────────────────────────────

const createJobSchema = z.object({
  agentId: z.number().int().positive(),
  clientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  description: z.string().min(1).max(5000),
  budget: z.string().regex(/^\d+$/, 'Must be numeric string (wei)'),
  deadlineHours: z.number().int().min(1).max(720).default(24), // 1h - 30 days
});

const addressSchema = z.object({
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

type JobStatus = 'open' | 'funded' | 'submitted' | 'completed' | 'rejected' | 'expired';

// Valid state transitions
const VALID_TRANSITIONS: Record<string, JobStatus[]> = {
  open: ['funded', 'rejected'],
  funded: ['submitted', 'rejected', 'expired'],
  submitted: ['completed', 'rejected', 'expired'],
  completed: [],
  rejected: [],
  expired: [],
};

// ─── POST /jobs — Create job ────────────────────────────

jobRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { agentId, clientAddress, description, budget, deadlineHours } = parsed.data;

  // Verify agent exists
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, agentId))
    .limit(1);

  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const [job] = await db.insert(jobs).values({
    jobId: 0, // placeholder
    agentId,
    clientAddress: clientAddress.toLowerCase(),
    description,
    budget,
    status: 'open',
    deliverableIpfsCid: null,
    resultText: null,
  }).returning();

  // Set jobId = id
  await db.update(jobs)
    .set({ jobId: job.id })
    .where(eq(jobs.id, job.id));

  return c.json({
    success: true,
    job: {
      jobId: job.id,
      agentId,
      clientAddress: clientAddress.toLowerCase(),
      description,
      budget,
      status: 'open',
      createdAt: job.createdAt,
    },
  }, 201);
});

const fundSchema = z.object({
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

// ─── POST /jobs/:jobId/fund ─────────────────────────────

jobRoutes.post('/:jobId/fund', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  const body = await c.req.json().catch(() => null);
  const parsed = fundSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'callerAddress required' }, 400);

  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  if (parsed.data.callerAddress.toLowerCase() !== job.clientAddress) {
    return c.json({ error: 'Only job client can fund' }, 403);
  }

  const transitionError = validateTransition(job.status as JobStatus, 'funded');
  if (transitionError) return c.json({ error: transitionError }, 400);

  await db.update(jobs)
    .set({
      status: 'funded',
      fundedAt: new Date(),
      fundTxHash: parsed.data.txHash || null,
    })
    .where(eq(jobs.jobId, jobId));

  // Auto-process: agent generates deliverable in background
  processJobInBackground(jobId).catch(err =>
    console.error(`[jobs] Auto-process failed for job ${jobId}:`, err)
  );

  return c.json({ success: true, jobId, status: 'funded' });
});

// ─── POST /jobs/:jobId/submit ───────────────────────────

jobRoutes.post('/:jobId/submit', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  const body = await c.req.json().catch(() => null);

  const submitSchema = z.object({
    deliverableCid: z.string().min(1).max(100),
    resultText: z.string().max(10000).optional(),
  });

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'deliverableCid required' }, 400);

  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  const transitionError = validateTransition(job.status as JobStatus, 'submitted');
  if (transitionError) return c.json({ error: transitionError }, 400);

  await db.update(jobs)
    .set({
      status: 'submitted',
      deliverableIpfsCid: parsed.data.deliverableCid,
      resultText: parsed.data.resultText ?? null,
      submittedAt: new Date(),
    })
    .where(eq(jobs.jobId, jobId));

  return c.json({ success: true, jobId, status: 'submitted' });
});

// ─── POST /jobs/:jobId/complete ─────────────────────────

const completeSchema = z.object({
  callerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

jobRoutes.post('/:jobId/complete', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  const body = await c.req.json().catch(() => null);
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'callerAddress required' }, 400);

  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  // Only client (evaluator) can complete
  if (parsed.data.callerAddress.toLowerCase() !== job.clientAddress) {
    return c.json({ error: 'Only evaluator can complete job' }, 403);
  }

  const transitionError = validateTransition(job.status as JobStatus, 'completed');
  if (transitionError) return c.json({ error: transitionError }, 400);

  await db.update(jobs)
    .set({
      status: 'completed',
      completedAt: new Date(),
      payoutTxHash: parsed.data.txHash || job.fundTxHash || null,
    })
    .where(eq(jobs.jobId, jobId));

  // Calculate fees (for display — actual on-chain settlement is in the contract)
  const budget = BigInt(job.budget);
  const fee = budget * 500n / 10000n; // 5%
  const payout = budget - fee;

  return c.json({
    success: true,
    jobId,
    status: 'completed',
    payout: payout.toString(),
    platformFee: fee.toString(),
  });
});

// ─── POST /jobs/:jobId/reject ───────────────────────────

jobRoutes.post('/:jobId/reject', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  const body = await c.req.json().catch(() => null);
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'callerAddress required' }, 400);

  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  // Allow client or agent owner to reject
  const caller = parsed.data.callerAddress.toLowerCase();
  const [agent] = await db.select({ ownerAddress: agents.ownerAddress })
    .from(agents).where(eq(agents.agentId, job.agentId)).limit(1);

  if (caller !== job.clientAddress && caller !== agent?.ownerAddress) {
    return c.json({ error: 'Only client or agent owner can reject' }, 403);
  }

  const transitionError = validateTransition(job.status as JobStatus, 'rejected');
  if (transitionError) return c.json({ error: transitionError }, 400);

  await db.update(jobs)
    .set({ status: 'rejected' })
    .where(eq(jobs.jobId, jobId));

  return c.json({ success: true, jobId, status: 'rejected' });
});

// ─── POST /jobs/:jobId/process — Retry processing ──────

jobRoutes.post('/:jobId/process', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);
  if (job.status !== 'funded') return c.json({ error: `Job is ${job.status}, must be funded to process` }, 400);

  processJobInBackground(jobId).catch(err =>
    console.error(`[jobs] Manual process failed for job ${jobId}:`, err)
  );

  return c.json({ success: true, jobId, message: 'Processing started — agent is working on it' });
});

// ─── GET /jobs/:jobId ───────────────────────────────────

jobRoutes.get('/:jobId', async (c) => {
  const jobId = Number(c.req.param('jobId'));
  if (isNaN(jobId)) return c.json({ error: 'Invalid job ID' }, 400);

  const job = await getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  return c.json({ job });
});

// ─── Auto-Process Job ───────────────────────────────────

async function processJobInBackground(jobId: number) {
  // Small delay to let the fund response return first
  await new Promise(r => setTimeout(r, 1000));

  const job = await getJob(jobId);
  if (!job || job.status !== 'funded') return;

  // Get the agent and its template
  const [agent] = await db.select()
    .from(agents)
    .where(eq(agents.agentId, job.agentId))
    .limit(1);

  if (!agent) {
    console.error(`[jobs] Agent ${job.agentId} not found for job ${jobId}`);
    return;
  }

  const template = getTemplate(agent.templateId);
  const basePrompt = template?.systemPrompt || 'You are a helpful AI assistant.';
  const systemPrompt = agent.customSystemPrompt
    ? `${basePrompt}\n\n---\n\n## Agent Skills\n\n${agent.customSystemPrompt}`
    : basePrompt;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `You have been hired for a job. Complete the following task thoroughly and deliver a high-quality result.\n\n## Job Description\n\n${job.description}\n\n## Instructions\n- Provide a complete, detailed deliverable\n- Be thorough and professional\n- Format your response in clean markdown`,
    },
  ];

  console.log(`[jobs] Processing job #${jobId} for agent ${agent.name}...`);

  try {
    const result = await chatCompletion(messages);
    const resultText = result.content;
    // Generate a pseudo-IPFS CID from the content hash
    const cidHash = Buffer.from(resultText.slice(0, 64)).toString('base64url').slice(0, 46);
    const deliverableCid = `Qm${cidHash}`;

    await db.update(jobs)
      .set({
        status: 'submitted',
        resultText,
        deliverableIpfsCid: deliverableCid,
        submittedAt: new Date(),
      })
      .where(eq(jobs.jobId, jobId));

    console.log(`[jobs] Job #${jobId} completed by agent ${agent.name} (${resultText.length} chars)`);
  } catch (err) {
    console.error(`[jobs] LLM failed for job #${jobId}:`, err);
    // Don't change status — stays funded, can be retried
  }
}

// ─── Helpers ────────────────────────────────────────────

async function getJob(jobId: number) {
  if (isNaN(jobId)) return null;
  const [job] = await db.select()
    .from(jobs)
    .where(eq(jobs.jobId, jobId))
    .limit(1);
  return job || null;
}

function validateTransition(current: JobStatus, target: JobStatus): string | null {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return `Invalid transition: ${current} → ${target}`;
  }
  return null;
}
