import { env } from '../config/env.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models — March 2026 verified working (order = priority)
const FREE_MODELS = [
  'stepfun/step-3.5-flash:free',
  'google/gemma-3-4b-it:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-4b:free',
];

// Premium models — require OpenRouter credits
const PREMIUM_MODELS = [
  'google/gemini-3-flash',
  'anthropic/claude-sonnet-4.6',
  'openai/gpt-5.4',
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
 * Tries each model in order as fallback chain.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  isPremium: boolean = false
): Promise<ChatResponse> {
  const models = isPremium ? PREMIUM_MODELS : FREE_MODELS;
  let lastError: Error | null = null;

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
        lastError = new Error(`OpenRouter ${response.status} [${model}]: ${errBody}`);
        console.warn(`Model ${model} failed (${response.status}), trying next...`);
        // Try next model on 429 (rate limit), 402 (quota), 503 (unavailable), 400 (model not found)
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
