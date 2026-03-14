import { env } from '../config/env.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models — no API key credit needed for these
const FREE_MODELS = [
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'google/gemma-3-4b-it:free',
  'qwen/qwen3-4b:free',
];

// Premium models — require OpenRouter credits
const PREMIUM_MODELS = [
  'anthropic/claude-sonnet-4',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-001',
];

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

/**
 * Call OpenRouter for a chat completion.
 * Uses free models by default, premium models for premium agents.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  isPremium: boolean = false
): Promise<ChatResponse> {
  const models = isPremium ? PREMIUM_MODELS : FREE_MODELS;
  let lastError: Error | null = null;

  // Try models in order (fallback chain)
  for (const model of models) {
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
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        lastError = new Error(`OpenRouter ${response.status}: ${errBody}`);
        // Try next model on 429 (rate limit), 402 (quota), or 503 (unavailable)
        if (response.status === 429 || response.status === 402 || response.status === 503) continue;
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
      continue;
    }
  }

  throw lastError || new Error('All models failed');
}
