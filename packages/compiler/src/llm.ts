/**
 * LLM Integration for Agentic Compilation
 * Uses OpenAI-compatible API to generate code from natural language
 */

export interface LLMConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call LLM with OpenAI-compatible API
 */
export async function callLLM(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const baseURL = config.baseURL || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4';
  
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3, // Lower temperature for more consistent code generation
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage,
  };
}

/**
 * Get LLM configuration from environment variables
 */
export function getLLMConfig(): LLMConfig | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NATURAL_LLM_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseURL: process.env.NATURAL_LLM_BASE_URL || process.env.OPENAI_BASE_URL,
    model: process.env.NATURAL_LLM_MODEL || 'gpt-4o',
  };
}
