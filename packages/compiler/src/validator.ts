/**
 * Step 5: Validate generated TypeScript code
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { GeneratedFile } from './types.js';
import type { LLMClient } from './llm.js';

const execAsync = promisify(exec);

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export class Validator {
  constructor(
    private llm: LLMClient,
    private maxRetries: number = 3
  ) {}

  async validate(files: GeneratedFile[], outputDir: string): Promise<ValidationResult> {
    let attempt = 0;
    let currentFiles = [...files];
    const errors: string[] = [];

    while (attempt < this.maxRetries) {
      attempt++;
      console.log(`\nValidation attempt ${attempt}/${this.maxRetries}...`);

      // Write files to disk
      await this.writeFiles(currentFiles, outputDir);

      // Install dependencies
      if (attempt === 1) {
        console.log('Installing dependencies...');
        try {
          await execAsync('npm install', { cwd: outputDir });
        } catch (error: any) {
          console.warn('npm install had warnings, continuing...');
        }
      }

      // Run TypeScript compiler
      const tscResult = await this.runTypeScriptCheck(outputDir);

      if (tscResult.success) {
        console.log('✓ TypeScript validation passed!');
        return { success: true, errors: [] };
      }

      console.log('✗ TypeScript validation failed');
      console.log(tscResult.errors.join('\n'));

      if (attempt < this.maxRetries) {
        console.log(`\nAttempting to fix errors with LLM...`);
        currentFiles = await this.fixErrors(currentFiles, tscResult.errors);
      } else {
        errors.push(...tscResult.errors);
      }
    }

    return {
      success: false,
      errors,
    };
  }

  private async writeFiles(files: GeneratedFile[], outputDir: string): Promise<void> {
    for (const file of files) {
      const filePath = path.join(outputDir, file.path);
      const dir = path.dirname(filePath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }
  }

  private async runTypeScriptCheck(outputDir: string): Promise<ValidationResult> {
    try {
      // Check if tsconfig exists, if not create a basic one
      const tsconfigPath = path.join(outputDir, 'tsconfig.json');
      try {
        await fs.access(tsconfigPath);
      } catch {
        // Create minimal tsconfig if it doesn't exist
        await fs.writeFile(
          tsconfigPath,
          JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2020',
                module: 'ESNext',
                jsx: 'react-jsx',
                strict: true,
                moduleResolution: 'bundler',
                skipLibCheck: true,
                noEmit: true,
              },
              include: ['src'],
            },
            null,
            2
          )
        );
      }

      await execAsync('npx tsc --noEmit', { cwd: outputDir });
      return { success: true, errors: [] };
    } catch (error: any) {
      const stderr = error.stderr || error.stdout || error.message;
      const errors = stderr
        .split('\n')
        .filter((line: string) => line.includes('error TS'))
        .slice(0, 10); // Limit to 10 errors

      return {
        success: false,
        errors: errors.length > 0 ? errors : [stderr],
      };
    }
  }

  private async fixErrors(files: GeneratedFile[], errors: string[]): Promise<GeneratedFile[]> {
    const errorSummary = errors.slice(0, 5).join('\n');

    const systemPrompt = `You are an expert TypeScript debugger.
Fix TypeScript compilation errors in the provided code.
Return the corrected code ONLY, no explanations.`;

    const fixedFiles: GeneratedFile[] = [];

    // Try to identify which files have errors
    const filesWithErrors = new Set<string>();
    for (const error of errors) {
      const match = error.match(/([^(]+)\(/);
      if (match) {
        filesWithErrors.add(match[1]);
      }
    }

    // If we can't identify specific files, try to fix the first few TypeScript files
    if (filesWithErrors.size === 0) {
      const tsFiles = files.filter((f) => f.path.match(/\.(ts|tsx)$/));
      tsFiles.slice(0, 3).forEach((f) => filesWithErrors.add(f.path));
    }

    for (const file of files) {
      if (filesWithErrors.has(file.path)) {
        console.log(`  Fixing ${file.path}...`);

        const prompt = `Fix the TypeScript errors in this file:

File: ${file.path}

Code:
\`\`\`typescript
${file.content}
\`\`\`

Errors:
${errorSummary}

Return the corrected code.`;

        try {
          const response = await this.llm.complete(prompt, systemPrompt);
          const codeMatch = response.match(/```(?:typescript|tsx|ts)?\s*\n([\s\S]*?)\n```/);
          const fixedContent = codeMatch ? codeMatch[1] : response;

          fixedFiles.push({
            path: file.path,
            content: fixedContent,
          });
        } catch (error) {
          console.warn(`  Failed to fix ${file.path}, keeping original`);
          fixedFiles.push(file);
        }
      } else {
        fixedFiles.push(file);
      }
    }

    return fixedFiles;
  }
}

export function createValidator(llm: LLMClient, maxRetries?: number): Validator {
  return new Validator(llm, maxRetries);
}
