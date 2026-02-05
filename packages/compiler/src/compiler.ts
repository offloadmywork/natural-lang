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
import type { CompileOptions, CompileResult } from './types.js';

/**
 * Compile a Natural language source file to TypeScript
 * 
 * @param source - The .nl source code
 * @param options - Compilation options
 * @returns Compilation result with generated files and diagnostics
 */
export function compile(source: string, options: CompileOptions = {}): CompileResult {
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
      message: 'Code generated using template-based heuristics. Future versions will use LLM for better accuracy.',
      location: {
        range: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      },
    });

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
