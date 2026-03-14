import { env } from '../config/env.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model definitions with pricing
export interface ModelDef {
  id: string;
  slug: string; // OpenRouter model slug
  name: string;
  tier: 'free' | 'premium';
  costPerCall: string; // wei cUSD (0 for free)
  description: string;
  webSearch: boolean;
}

export const AVAILABLE_MODELS: ModelDef[] = [
  // Free tier models
  {
    id: 'step-flash',
    slug: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash',
    tier: 'free',
    costPerCall: '0',
    description: 'Fast free model, good for general chat',
    webSearch: false,
  },
  {
    id: 'gemma-4b',
    slug: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    tier: 'free',
    costPerCall: '0',
    description: 'Lightweight free model by Google',
    webSearch: false,
  },
  {
    id: 'gemma-27b',
    slug: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    tier: 'free',
    costPerCall: '0',
    description: 'Larger free model, better reasoning',
    webSearch: false,
  },
  // Premium models
  {
    id: 'sonnet-4.6',
    slug: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    tier: 'premium',
    costPerCall: '100000000000000000', // 0.10 cUSD
    description: 'Most capable model — web search, deep reasoning',
    webSearch: true,
  },
  {
    id: 'sonnet-4.6-online',
    slug: 'anthropic/claude-sonnet-4.6:online',
    name: 'Claude Sonnet 4.6 + Web',
    tier: 'premium',
    costPerCall: '150000000000000000', // 0.15 cUSD (extra for web search)
    description: 'Claude with real-time web search for latest info',
    webSearch: true,
  },
];

// Free model fallback chain
const FREE_FALLBACKS = AVAILABLE_MODELS.filter(m => m.tier === 'free').map(m => m.slug);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokensUsed: number;
  finishReason: string;
}

export function getModelDef(modelId: string): ModelDef | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Call OpenRouter for a chat completion.
 * If modelId is provided, use that specific model.
 * Otherwise, use free model fallback chain.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  modelId?: string,
): Promise<ChatResponse> {
  const specificModel = modelId ? getModelDef(modelId) : undefined;
  const modelsToTry = specificModel ? [specificModel.slug] : FREE_FALLBACKS;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://celospawn.xyz',
          'X-Title': 'CeloSpawn Agent',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        lastError = new Error(`OpenRouter ${response.status} [${model}]: ${errBody}`);
        console.warn(`Model ${model} failed (${response.status}), trying next...`);
        if ([429, 402, 503, 400, 404].includes(response.status)) continue;
        throw lastError;
      }

      const data = await response.json() as any;
      const choice = data.choices?.[0];

      if (!choice?.message?.content) {
        lastError = new Error(`Empty response from model ${model}`);
        continue;
      }

      return {
        content: choice.message.content,
        model: data.model || model,
        tokensUsed: data.usage?.total_tokens || 0,
        finishReason: choice.finish_reason || 'unknown',
      };
    } catch (err) {
      lastError = err as Error;
      console.warn(`Model ${model} error:`, (err as Error).message);
      continue;
    }
  }

  throw lastError || new Error('All models failed');
}
