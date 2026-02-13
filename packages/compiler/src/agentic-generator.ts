/**
 * Agentic Code Generator - Uses LLM to generate code from natural language specs
 */

import type { NaturalDocument } from '@natural-lang/core';
import { callLLM, type LLMConfig, type LLMMessage } from './llm.js';

export interface GenerationResult {
  files: Map<string, string>;
  metadata: {
    model: string;
    totalTokens?: number;
  };
}

/**
 * Generate a complete TypeScript project from Natural language specification
 */
export async function generateWithLLM(
  doc: NaturalDocument,
  config: LLMConfig
): Promise<GenerationResult> {
  const files = new Map<string, string>();
  let totalTokens = 0;
  let model = '';

  // Serialize the document for the LLM
  const specText = serializeDocument(doc);

  // Step 1: Generate TypeScript types/interfaces
  console.log('🤖 Generating TypeScript types with LLM...');
  const typesResult = await generateTypes(specText, config);
  files.set('src/types.ts', typesResult.code);
  totalTokens += typesResult.tokens || 0;
  model = typesResult.model;

  // Step 2: Generate Zod validation schemas
  console.log('🤖 Generating validation schemas with LLM...');
  const schemasResult = await generateSchemas(specText, typesResult.code, config);
  files.set('src/schemas.ts', schemasResult.code);
  totalTokens += schemasResult.tokens || 0;

  // Step 3: Generate API routes/handlers
  console.log('🤖 Generating API routes with LLM...');
  const routesResult = await generateRoutes(specText, typesResult.code, schemasResult.code, config);
  files.set('src/routes.ts', routesResult.code);
  totalTokens += routesResult.tokens || 0;

  // Step 4: Generate main server file
  console.log('🤖 Generating server entry point with LLM...');
  const mainResult = await generateMain(specText, config);
  files.set('src/index.ts', mainResult.code);
  totalTokens += mainResult.tokens || 0;

  // Step 5: Generate storage/data layer (if needed)
  if (hasStorageRequirements(specText)) {
    console.log('🤖 Generating storage layer with LLM...');
    const storageResult = await generateStorage(specText, typesResult.code, config);
    files.set('src/storage.ts', storageResult.code);
    totalTokens += storageResult.tokens || 0;
  }

  // Step 6: Generate web UI (if needed)
  if (hasUIRequirements(specText)) {
    console.log('🤖 Generating web UI with LLM...');
    const uiResult = await generateUI(specText, config);
    files.set('src/public/index.html', uiResult.code);
    totalTokens += uiResult.tokens || 0;
  }

  // Step 7: Generate project configuration files
  const packageJson = generatePackageJson(extractProjectName(doc));
  const tsConfig = generateTsConfig();
  const readme = await generateReadme(specText, config);
  
  files.set('package.json', packageJson);
  files.set('tsconfig.json', tsConfig);
  files.set('README.md', readme.code);
  files.set('.gitignore', 'node_modules/\ndist/\n.env\n.DS_Store\n');
  totalTokens += readme.tokens || 0;

  return {
    files,
    metadata: {
      model,
      totalTokens,
    },
  };
}

function serializeDocument(doc: NaturalDocument): string {
  let text = '';
  
  for (const concept of doc.concepts) {
    text += `@${concept.name}\n`;
    for (const prose of concept.prose) {
      text += `${prose.text}\n\n`;
    }
    text += '\n';
  }
  
  return text.trim();
}

function extractProjectName(doc: NaturalDocument): string {
  // Try to infer project name from concepts
  for (const concept of doc.concepts) {
    if (concept.name.toLowerCase().includes('app') || concept.name.toLowerCase().includes('system')) {
      return concept.name.toLowerCase().replace(/app|system/gi, '').trim() || 'natural-app';
    }
  }
  return 'natural-app';
}

function hasStorageRequirements(spec: string): boolean {
  return /\b(storage|database|persist|save|store)\b/i.test(spec);
}

function hasUIRequirements(spec: string): boolean {
  return /\b(web|ui|interface|frontend|display)\b/i.test(spec);
}

async function generateTypes(spec: string, config: LLMConfig): Promise<{ code: string; tokens?: number; model: string }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a TypeScript code generator. Generate clean, well-typed TypeScript interfaces from natural language specifications.

Rules:
- Export all interfaces
- Use proper TypeScript types (string, number, boolean, Date, arrays, unions)
- Add JSDoc comments for clarity
- Use camelCase for property names
- Mark optional properties with ?
- Infer types from context (e.g., "ID" → string, "count" → number, "timestamp" → Date)
- No implementation code, only type definitions

Output ONLY the TypeScript code, no explanations or markdown formatting.`,
    },
    {
      role: 'user',
      content: `Generate TypeScript interfaces for this specification:

${spec}`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
    model: response.model,
  };
}

async function generateSchemas(spec: string, types: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a TypeScript code generator specializing in Zod validation schemas.

Rules:
- Import { z } from 'zod'
- Create Zod schemas that match the TypeScript interfaces
- Apply validation rules from the spec (min/max length, required fields, formats)
- Use z.infer<> for type inference
- Export all schemas
- Add .describe() for better error messages

Output ONLY the TypeScript code with Zod schemas, no explanations.`,
    },
    {
      role: 'user',
      content: `Given these TypeScript interfaces:

${types}

And this specification:

${spec}

Generate corresponding Zod validation schemas with proper validation rules.`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
  };
}

async function generateRoutes(spec: string, types: string, schemas: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a TypeScript code generator specializing in Express.js REST APIs.

Rules:
- Import express, { Router, Request, Response } from 'express'
- Import types and schemas from './types.js' and './schemas.js'
- Create route handlers for all API endpoints mentioned in the spec
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use Zod schemas for request validation
- Return appropriate status codes (200, 201, 400, 404, 500)
- Return JSON responses
- Handle errors gracefully
- Use a storage layer (assume getStorage() returns storage interface)
- Export the router as default

Output ONLY the TypeScript code, no explanations.`,
    },
    {
      role: 'user',
      content: `Given these types:

${types}

These schemas:

${schemas}

And this API specification:

${spec}

Generate Express.js route handlers implementing the API.`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
  };
}

async function generateMain(spec: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a TypeScript code generator. Generate a main Express.js server entry point.

Rules:
- Import express from 'express'
- Import routes from './routes.js'
- Set up Express middleware (express.json(), CORS if needed)
- Serve static files from './public' if UI exists
- Mount routes on /api or root
- Start server on PORT from env or 3000
- Add error handling middleware
- Log server startup

Output ONLY the TypeScript code, no explanations.`,
    },
    {
      role: 'user',
      content: `Generate a main server file for this application:

${spec}`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
  };
}

async function generateStorage(spec: string, types: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a TypeScript code generator specializing in data storage layers.

Rules:
- Create an in-memory storage implementation using Map
- Import types from './types.js'
- Implement CRUD operations for all entities
- Use UUIDs for auto-generated IDs (import { randomUUID } from 'crypto')
- Add timestamps for created/updated dates
- Export a getStorage() function that returns the storage interface
- Make it easy to swap for a real database later

Output ONLY the TypeScript code, no explanations.`,
    },
    {
      role: 'user',
      content: `Given these types:

${types}

And this storage specification:

${spec}

Generate an in-memory storage implementation.`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
  };
}

async function generateUI(spec: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a web developer. Generate a single-page HTML application with embedded CSS and JavaScript.

Rules:
- Use modern, clean HTML5
- Embed CSS in <style> tag (use a nice, minimal design)
- Embed JavaScript in <script> tag (vanilla JS, no frameworks)
- Make API calls to /api endpoints
- Use fetch() for HTTP requests
- Add proper error handling and loading states
- Mobile-responsive design
- Include all functionality described in the spec

Output ONLY the HTML code, no explanations.`,
    },
    {
      role: 'user',
      content: `Generate a web UI for this application:

${spec}`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: cleanCodeOutput(response.content),
    tokens: response.usage?.total_tokens,
  };
}

async function generateReadme(spec: string, config: LLMConfig): Promise<{ code: string; tokens?: number }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a technical writer. Generate a comprehensive README.md file.

Rules:
- Include project overview
- List features based on the specification
- Add setup instructions (npm install, npm run dev)
- Document API endpoints
- Add usage examples
- Include environment variables (if any)
- Use proper markdown formatting

Output ONLY the markdown content, no code blocks around it.`,
    },
    {
      role: 'user',
      content: `Generate a README.md for this project:

${spec}`,
    },
  ];

  const response = await callLLM(messages, config);
  
  return {
    code: response.content,
    tokens: response.usage?.total_tokens,
  };
}

function generatePackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
      },
      dependencies: {
        express: '^4.18.2',
        zod: '^3.22.4',
        cors: '^2.8.5',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/cors': '^2.8.17',
        '@types/node': '^20.0.0',
        typescript: '^5.3.3',
        tsx: '^4.7.0',
      },
    },
    null,
    2
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'node',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

function cleanCodeOutput(content: string): string {
  // Remove markdown code fences if present
  let cleaned = content.trim();
  
  // Remove ```typescript or ```javascript or ``` at start
  cleaned = cleaned.replace(/^```(?:typescript|javascript|ts|js)?\n/i, '');
  
  // Remove ``` at end
  cleaned = cleaned.replace(/\n```$/, '');
  
  return cleaned.trim();
}
