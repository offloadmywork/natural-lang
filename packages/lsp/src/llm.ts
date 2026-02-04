export interface LLMDiagnostic {
  line: number;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface LLMAnalysisResult {
  diagnostics: LLMDiagnostic[];
}

export class LLMAnalyzer {
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.enabled = !!this.apiKey;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async analyze(content: string): Promise<LLMAnalysisResult> {
    if (!this.enabled) {
      return { diagnostics: [] };
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/offloadmywork/natural-lang",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "system",
              content: `You are analyzing a Natural Language (.nl) specification file. Your job is to find:
1. Contradictions - statements that conflict with each other
2. Ambiguities - unclear or vague statements that could be interpreted multiple ways
3. Suggestions - improvements to make the specification clearer

For each issue found, respond with a JSON array of objects with this structure:
{
  "line": <line number (1-indexed)>,
  "message": "<description of the issue>",
  "severity": "error" | "warning" | "info"
}

Use "error" for contradictions, "warning" for ambiguities, "info" for suggestions.
Only respond with the JSON array, nothing else.`
            },
            {
              role: "user",
              content: content
            }
          ]
        })
      });

      if (!response.ok) {
        console.error(`LLM API error: ${response.status}`);
        return { diagnostics: [] };
      }

      const data: any = await response.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const diagnostics = JSON.parse(jsonMatch[0]);
        return { diagnostics };
      }

      return { diagnostics: [] };
    } catch (error) {
      console.error("LLM analysis error:", error);
      return { diagnostics: [] };
    }
  }
}
