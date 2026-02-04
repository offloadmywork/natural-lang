/**
 * Minimal parser for .nl files
 * Extracts @concepts and their content
 */

import type { ParseResult, Concept } from './types.js';

export class Parser {
  parse(content: string): ParseResult {
    const concepts: Concept[] = [];
    
    // Split by @ConceptName pattern
    const lines = content.split('\n');
    let currentConcept: Concept | null = null;
    
    for (const line of lines) {
      const conceptMatch = line.match(/^@(\w+)/);
      
      if (conceptMatch) {
        // Save previous concept if exists
        if (currentConcept) {
          concepts.push(currentConcept);
        }
        
        // Start new concept
        currentConcept = {
          name: conceptMatch[1],
          content: '',
        };
      } else if (currentConcept && line.trim()) {
        // Add content to current concept
        currentConcept.content += (currentConcept.content ? '\n' : '') + line;
      }
    }
    
    // Don't forget the last concept
    if (currentConcept) {
      concepts.push(currentConcept);
    }
    
    return { concepts };
  }
}

export function createParser(): Parser {
  return new Parser();
}
