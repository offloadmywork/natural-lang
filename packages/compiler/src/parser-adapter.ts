/**
 * Adapter to convert core parser AST to compiler's ParseResult
 */

import { Parser as CoreParser } from '@natural-lang/core';
import type { ParseResult as CoreParseResult } from '@natural-lang/core';
import type { ParseResult, Concept } from './types.js';

export function parseFile(content: string): ParseResult {
  const coreParser = new CoreParser(content);
  const coreResult: CoreParseResult = coreParser.parse();

  // Extract concepts from AST sections
  const conceptMap = new Map<string, string>();

  for (const section of coreResult.ast.sections) {
    const definitionConcepts = section.concepts.filter(c => c.type === 'definition');
    
    for (const concept of definitionConcepts) {
      if (!conceptMap.has(concept.name)) {
        conceptMap.set(concept.name, section.text);
      }
    }
  }

  const concepts: Concept[] = Array.from(conceptMap.entries()).map(([name, content]) => ({
    name,
    content,
  }));

  return { concepts };
}
