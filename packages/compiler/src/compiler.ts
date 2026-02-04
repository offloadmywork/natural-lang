/**
 * Main compiler orchestration
 * Pipeline: Parse → Analyze → Plan → Generate → Assemble
 */

import * as fs from 'fs';
import { parseFile } from './parser-adapter.js';
import { createAnalyzer } from './analyzer.js';
import { createPlanner } from './planner.js';
import { createGenerator } from './generator.js';
import { createAssembler } from './assembler.js';
import { createLLMClient } from './llm.js';
import type { CompileOptions, CompileResult } from './types.js';

export class Compiler {
  async compile(inputPath: string, options: CompileOptions): Promise<CompileResult> {
    try {
      console.log('🚀 Starting compilation...\n');

      // Read input file
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      const content = fs.readFileSync(inputPath, 'utf-8');

      // Step 1: Parse
      console.log('📖 Step 1: Parsing...');
      const parseResult = parseFile(content);
      console.log(`  Found ${parseResult.concepts.length} concepts\n`);

      // Check for API key
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable not set');
      }

      // Create LLM client
      const llm = createLLMClient(apiKey, options.model);

      // Step 2: Analyze
      console.log('🔍 Step 2: Analyzing with LLM...');
      const analyzer = createAnalyzer(llm);
      const analysis = await analyzer.analyze(parseResult);
      console.log(`  Identified:`);
      console.log(`    - ${analysis.dataModels.length} data models`);
      console.log(`    - ${analysis.behaviors.length} behaviors`);
      console.log(`    - ${analysis.uiComponents.length} UI components`);
      console.log(`    - ${analysis.businessRules.length} business rules\n`);

      // Step 3: Plan
      console.log('📋 Step 3: Planning files...');
      const planner = createPlanner();
      const filePlans = planner.plan(analysis);
      console.log(`  Planned ${filePlans.length} files\n`);

      if (options.verbose) {
        filePlans.forEach((plan) => {
          console.log(`    - ${plan.path} (${plan.type})`);
        });
        console.log();
      }

      // Step 4: Generate
      console.log('⚙️  Step 4: Generating code...');
      const generator = createGenerator(llm);
      const generatedFiles = await generator.generate(filePlans, analysis);
      console.log(`  Generated ${generatedFiles.length} files\n`);

      // Step 5: Assemble
      console.log('📦 Step 5: Writing files...');
      const assembler = createAssembler();
      const writtenPaths = await assembler.assemble(generatedFiles, options.outputDir);
      console.log();

      console.log('✅ Compilation complete!\n');
      console.log(`Output directory: ${options.outputDir}`);
      console.log(`Files written: ${writtenPaths.length}`);

      return {
        success: true,
        outputDir: options.outputDir,
        files: writtenPaths,
      };
    } catch (error) {
      console.error('\n❌ Compilation failed:', error);
      return {
        success: false,
        outputDir: options.outputDir,
        files: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Check syntax without compiling (no LLM calls)
   */
  check(inputPath: string): { success: boolean; errors: string[] } {
    try {
      if (!fs.existsSync(inputPath)) {
        return {
          success: false,
          errors: [`File not found: ${inputPath}`],
        };
      }

      const content = fs.readFileSync(inputPath, 'utf-8');
      const parseResult = parseFile(content);

      if (parseResult.concepts.length === 0) {
        return {
          success: false,
          errors: ['No @concepts found in file'],
        };
      }

      console.log(`✓ File is valid`);
      console.log(`  Found ${parseResult.concepts.length} concepts:`);
      parseResult.concepts.forEach((c) => {
        console.log(`    - @${c.name}`);
      });

      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export function createCompiler(): Compiler {
  return new Compiler();
}
