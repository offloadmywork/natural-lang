/**
 * Step 5: Assemble generated files into output directory
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedFile } from './types.js';

export class Assembler {
  async assemble(files: GeneratedFile[], outputDir: string): Promise<string[]> {
    const writtenPaths: string[] = [];

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const file of files) {
      const fullPath = path.join(outputDir, file.path);
      const dir = path.dirname(fullPath);

      // Create directories
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, file.content, 'utf-8');
      writtenPaths.push(file.path);
      console.log(`  ✓ ${file.path}`);
    }

    return writtenPaths;
  }
}

export function createAssembler(): Assembler {
  return new Assembler();
}
