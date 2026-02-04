/**
 * LLM client for OpenRouter API
 */

export interface LLMClient {
  complete(prompt: string, systemPrompt: string): Promise<string>;
}

export class OpenRouterClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(apiKey: string, model: string = 'anthropic/claude-sonnet-4-5') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/offloadmywork/natural-lang',
        'X-Title': 'Natural Language Compiler',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }
}

export function createLLMClient(apiKey: string, model?: string): LLMClient {
  return new OpenRouterClient(apiKey, model);
}
