/**
 * Step 2: Analyze parsed .nl content with LLM
 */

import type { ParseResult, Analysis } from './types.js';
import type { LLMClient } from './llm.js';

export class Analyzer {
  constructor(private llm: LLMClient) {}

  async analyze(parseResult: ParseResult): Promise<Analysis> {
    const prompt = this.buildAnalysisPrompt(parseResult);

    const systemPrompt = `You are an expert programming language analyzer. 
Analyze the provided Natural language program specification and extract structured information.
Return ONLY valid JSON, no markdown or explanations.`;

    const response = await this.llm.complete(prompt, systemPrompt);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || response.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('Failed to parse LLM response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[1]);
    return this.validateAnalysis(analysis);
  }

  private buildAnalysisPrompt(parseResult: ParseResult): string {
    const conceptsList = parseResult.concepts
      .map((c) => `@${c.name}\n${c.content}`)
      .join('\n\n');

    return `Analyze this Natural language program specification:

${conceptsList}

Extract and return a JSON object with this structure:
{
  "dataModels": [
    {
      "name": "ModelName",
      "fields": [
        {
          "name": "fieldName",
          "type": "string|number|boolean|date|array|object",
          "required": true|false,
          "validation": "optional validation rule description"
        }
      ]
    }
  ],
  "behaviors": [
    {
      "name": "BehaviorName",
      "description": "what it does",
      "inputs": ["input1", "input2"],
      "outputs": ["output1"]
    }
  ],
  "uiComponents": [
    {
      "name": "ComponentName",
      "type": "page|component|layout",
      "description": "what it shows/does",
      "interactions": ["user can do X", "clicking Y does Z"]
    }
  ],
  "businessRules": [
    {
      "context": "when/where this applies",
      "rule": "the constraint or validation"
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET|POST|PUT|PATCH|DELETE",
      "path": "/path/:param",
      "description": "what it does"
    }
  ],
  "storage": "description of storage requirements"
}

Be thorough but concise. Infer standard patterns (e.g., auto-generated IDs, timestamps).`;
  }

  private validateAnalysis(analysis: any): Analysis {
    // Basic validation
    if (!analysis.dataModels) analysis.dataModels = [];
    if (!analysis.behaviors) analysis.behaviors = [];
    if (!analysis.uiComponents) analysis.uiComponents = [];
    if (!analysis.businessRules) analysis.businessRules = [];

    return analysis as Analysis;
  }
}

export function createAnalyzer(llm: LLMClient): Analyzer {
  return new Analyzer(llm);
}
