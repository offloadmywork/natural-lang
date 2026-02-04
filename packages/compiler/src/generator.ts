/**
 * Step 4: Generate code for each file in the plan
 */

import type { Analysis, FilePlan, GeneratedFile } from './types.js';
import type { LLMClient } from './llm.js';

export class Generator {
  constructor(private llm: LLMClient) {}

  async generate(plan: FilePlan[], analysis: Analysis): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const filePlan of plan) {
      console.log(`  Generating ${filePlan.path}...`);
      
      try {
        const content = await this.generateFile(filePlan, analysis, plan);
        files.push({
          path: filePlan.path,
          content,
        });
      } catch (error) {
        console.error(`  ❌ Failed to generate ${filePlan.path}:`, error);
        throw error;
      }
    }

    return files;
  }

  private async generateFile(
    filePlan: FilePlan,
    analysis: Analysis,
    allPlans: FilePlan[]
  ): Promise<string> {
    // For config files, use templates instead of LLM
    if (filePlan.type === 'config' || filePlan.type === 'entry') {
      return this.generateConfigFile(filePlan, analysis);
    }

    const prompt = this.buildGenerationPrompt(filePlan, analysis, allPlans);
    const systemPrompt = `You are an expert TypeScript and React developer.
Generate production-quality code based on the specification.
Return ONLY the code, no markdown code blocks, no explanations.
Use modern best practices: TypeScript, React hooks, Zustand for state, Zod for validation.`;

    const response = await this.llm.complete(prompt, systemPrompt);
    
    // Clean up response (remove markdown code blocks if present)
    let code = response.trim();
    const codeBlockMatch = code.match(/```(?:typescript|tsx|ts|javascript|jsx|js)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }
    
    return code;
  }

  private buildGenerationPrompt(
    filePlan: FilePlan,
    analysis: Analysis,
    allPlans: FilePlan[]
  ): string {
    const context = this.buildContext(analysis);
    
    return `Generate the file: ${filePlan.path}

Purpose: ${filePlan.purpose}

Context from analysis:
${context}

Dependencies: ${filePlan.dependencies.length > 0 ? filePlan.dependencies.join(', ') : 'none'}

Requirements:
- Use TypeScript with proper types
- Follow modern best practices
- Include proper imports
- Add helpful comments
- Handle errors gracefully
${filePlan.path.endsWith('.tsx') ? '- Use React hooks and functional components' : ''}
${filePlan.path.includes('/types/') ? '- Export TypeScript interface and Zod schema' : ''}
${filePlan.path.includes('/hooks/') ? '- Export a custom React hook' : ''}
${filePlan.path.includes('/store/') ? '- Use Zustand for state management' : ''}

Generate complete, production-ready code for this file.`;
  }

  private buildContext(analysis: Analysis): string {
    let context = '';
    
    if (analysis.dataModels.length > 0) {
      context += 'Data Models:\n';
      for (const model of analysis.dataModels) {
        context += `- ${model.name}: ${model.fields.map(f => `${f.name} (${f.type}${f.required ? ', required' : ''})`).join(', ')}\n`;
      }
      context += '\n';
    }
    
    if (analysis.behaviors.length > 0) {
      context += 'Behaviors:\n';
      for (const behavior of analysis.behaviors) {
        context += `- ${behavior.name}: ${behavior.description}\n`;
      }
      context += '\n';
    }
    
    if (analysis.uiComponents.length > 0) {
      context += 'UI Components:\n';
      for (const component of analysis.uiComponents) {
        context += `- ${component.name} (${component.type}): ${component.description}\n`;
      }
      context += '\n';
    }
    
    if (analysis.businessRules.length > 0) {
      context += 'Business Rules:\n';
      for (const rule of analysis.businessRules) {
        context += `- ${rule.context}: ${rule.rule}\n`;
      }
      context += '\n';
    }
    
    return context;
  }

  private generateConfigFile(filePlan: FilePlan, analysis: Analysis): string {
    const fileName = filePlan.path.split('/').pop() || '';
    
    switch (fileName) {
      case 'package.json':
        return this.generatePackageJson(analysis);
      case 'tsconfig.json':
        return this.generateTsConfig();
      case 'vite.config.ts':
        return this.generateViteConfig();
      case 'index.html':
        return this.generateIndexHtml();
      case 'tailwind.config.js':
        return this.generateTailwindConfig();
      case 'postcss.config.js':
        return this.generatePostcssConfig();
      case 'index.css':
        return this.generateIndexCss();
      default:
        return `// ${filePlan.purpose}\n`;
    }
  }

  private generatePackageJson(analysis: Analysis): string {
    return JSON.stringify({
      name: 'natural-app',
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        zustand: '^4.4.0',
        zod: '^3.22.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        tailwindcss: '^3.4.0',
        typescript: '^5.3.0',
        vite: '^5.0.0',
      },
    }, null, 2);
  }

  private generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    }, null, 2);
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;
  }

  private generateIndexHtml(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Natural App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  }

  private generatePostcssConfig(): string {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
  }

  private generateIndexCss(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
  }
}

export function createGenerator(llm: LLMClient): Generator {
  return new Generator(llm);
}
