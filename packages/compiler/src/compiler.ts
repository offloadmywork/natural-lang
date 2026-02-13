/**
 * Main compiler entry point
 * Orchestrates parsing, analysis, and code generation
 */

import { parse, analyze as analyzeCore } from '@natural-lang/core';
import type { NaturalDocument, Diagnostic } from '@natural-lang/core';
import { analyze } from './analyzer.js';
import {
  generateTypeScriptInterfaces,
  generateZodSchemas,
  generateExpressRoutes,
  generatePackageJson,
  generateTsConfig,
  generateMainFile,
  generateReadme,
} from './generator.js';
import { getLLMConfig } from './llm.js';
import { generateWithLLM } from './agentic-generator.js';
import type { CompileOptions, CompileResult } from './types.js';

/**
 * Compile a Natural language source file to TypeScript
 * 
 * @param source - The .nl source code
 * @param options - Compilation options
 * @returns Compilation result with generated files and diagnostics
 */
export async function compile(source: string, options: CompileOptions = {}): Promise<CompileResult> {
  const files = new Map<string, string>();
  const diagnostics: Diagnostic[] = [];

  try {
    // Step 1: Parse the source
    const doc: NaturalDocument = parse(source);

    // Step 2: Run core analyzer for diagnostics
    const coreDiagnostics = analyzeCore(doc);
    diagnostics.push(...coreDiagnostics);

    // Check for errors
    const hasErrors = coreDiagnostics.some(d => d.severity === 'error');
    if (hasErrors) {
      return { files, diagnostics };
    }

    // Step 3: Check if LLM is available
    const llmConfig = getLLMConfig();

    if (llmConfig) {
      // Use agentic LLM-powered compilation
      try {
        const result = await generateWithLLM(doc, llmConfig);
        
        // Copy generated files
        for (const [path, content] of result.files) {
          files.set(path, content);
        }

        // Add success diagnostic
        diagnostics.push({
          severity: 'info',
          message: `Code generated using AI (${result.metadata.model}). Used ${result.metadata.totalTokens || '?'} tokens.`,
          location: {
            range: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
            },
          },
        });

      } catch (llmError) {
        // LLM failed, fall back to templates
        diagnostics.push({
          severity: 'warning',
          message: `LLM compilation failed: ${llmError instanceof Error ? llmError.message : String(llmError)}. Falling back to template-based generation.`,
          location: {
            range: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
            },
          },
        });
        
        // Fall through to template-based generation
        await templateBasedGeneration(doc, files, diagnostics);
      }
    } else {
      // No LLM config, use template-based generation
      await templateBasedGeneration(doc, files, diagnostics);
      
      diagnostics.push({
        severity: 'info',
        message: 'Set OPENAI_API_KEY or NATURAL_LLM_API_KEY environment variable to enable AI-powered compilation for better results.',
        location: {
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
          },
        },
      });
    }

  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      location: {
        range: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      },
    });
  }

  return { files, diagnostics };
}

/**
 * Template-based code generation (fallback when LLM is not available)
 */
async function templateBasedGeneration(
  doc: NaturalDocument,
  files: Map<string, string>,
  diagnostics: Diagnostic[]
): Promise<void> {
  // Step 3: Analyze document structure (extract entities, routes, etc.)
  const analysis = analyze(doc);

  // Step 4: Generate code files
  
  // Generate TypeScript interfaces
  if (analysis.entities.size > 0) {
    const interfaces = generateTypeScriptInterfaces(analysis.entities);
    files.set('src/types.ts', interfaces);

    // Generate Zod schemas
    const schemas = generateZodSchemas(analysis.entities);
    files.set('src/schemas.ts', schemas);
  }

  // Generate Express routes
  if (analysis.routes.length > 0) {
    const routes = generateExpressRoutes(analysis.routes, analysis.entities);
    files.set('src/routes.ts', routes);

    // Generate main server file
    const main = generateMainFile();
    files.set('src/index.ts', main);
  }

  // Generate project configuration files
  const projectName = 'natural-app'; // TODO: Extract from file name or config
  files.set('package.json', generatePackageJson(projectName));
  files.set('tsconfig.json', generateTsConfig());
  files.set('README.md', generateReadme(projectName));
  files.set('.gitignore', 'node_modules/\ndist/\n.env\n');

  // Add info diagnostic about template-based generation
  diagnostics.push({
    severity: 'info',
    message: 'Code generated using template-based heuristics. For better results, set OPENAI_API_KEY.',
    location: {
      range: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
      },
    },
  });
}
