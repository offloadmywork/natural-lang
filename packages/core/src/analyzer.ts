import { NaturalDocument, ConceptDefinition, ConceptReference, Diagnostic, DiagnosticSeverity, } from './types.js';

export interface AnalysisResult {
  diagnostics: Diagnostic[];
  definitions: Map<string, ConceptDefinition>;
  references: Map<string, ConceptReference[]>;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Find similar concept names for "Did you mean?" suggestions
 */
function findSimilarConcepts(name: string, definitions: Map<string, ConceptDefinition>): string[] {
  const candidates: Array<{ name: string; distance: number }> = [];
  const threshold = Math.min(3, name.length / 2);
  for (const [definedName] of definitions) {
    const distance = levenshteinDistance(name.toLowerCase(), definedName.toLowerCase());
    if (distance <= threshold && distance > 0) {
      candidates.push({ name: definedName, distance });
    }
  }
  // Sort by distance and return top matches
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.slice(0, 3).map(c => c.name);
}

export class Analyzer {
  private document: NaturalDocument;
  private definitions: Map<string, ConceptDefinition> = new Map();
  private references: Map<string, ConceptReference[]> = new Map();
  private diagnostics: Diagnostic[] = [];

  constructor(document: NaturalDocument) {
    this.document = document;
  }
  /**
   * Collect all concept definitions
   */
  private collectDefinitions(): void {
    for (const concept of this.document.concepts) {
      const name = concept.name;
      // Check for duplicate definitions
      if (this.definitions.has(name)) {
        const existing = this.definitions.get(name)!;
        const lines = [...new Set([existing.location.range.start.line, concept.location.range.start.line])].sort();
        const linesStr = lines.length === 1 ? `line ${lines[0]}` : `lines ${lines.join(' and ')}`;
        this.diagnostics.push({
          severity: 'error',
          message: `❌ Duplicate concept definition: @${name}\n\n   Defined multiple times (${linesStr})\n\n   💡 Fix: Remove one of the duplicate definitions, or rename one to differentiate them`,
          location: concept.location,
          code: 'duplicate-definition',
        });
      } else {
        this.definitions.set(name, concept);
      }
    }
  }
  /**
   * Collect all concept references
   */
  private collectReferences(): void {
    for (const concept of this.document.concepts) {
      for (const prose of concept.prose) {
        for (const ref of prose.references) {
          const name = ref.name;
          if (!this.references.has(name)) {
            this.references.set(name, []);
          }
          this.references.get(name)!.push(ref);
        }
      }
    }
  }
  /**
   * Detect undefined references (used but never defined)
   */
  private detectUndefinedReferences(): void {
    for (const [name, refs] of this.references.entries()) {
      if (!this.definitions.has(name)) {
        const suggestions = findSimilarConcepts(name, this.definitions);
        for (const ref of refs) {
          let message = `❌ Undefined concept: @${name}\n\n   💡 Fix: Define @${name} before using it, or check for typos`;
          if (suggestions.length > 0) {
            const suggestionsList = suggestions.map(s => `@${s}`).join(', ');
            message = `❌ Undefined concept: @${name}\n\n   🤔 Did you mean: ${suggestionsList}?\n\n   💡 Fix: Either define @${name} or use one of the suggested concepts`;
          }
          this.diagnostics.push({
            severity: 'error',
            message,
            location: ref.location,
            code: 'undefined-reference',
          });
        }
      }
    }
  }
  /**
   * Detect unused concepts (defined but never referenced)
   */
  private detectUnusedConcepts(): void {
    for (const [name, definition] of this.definitions.entries()) {
      if (!this.references.has(name)) {
        this.diagnostics.push({
          severity: 'warning',
          message: `⚠️  Unused concept: @${name}\n\n   💡 Tip: Add a reference to @${name} in another concept to connect it to your application`,
          location: definition.location,
          code: 'unused-concept',
        });
      }
    }
  }
  /**
   * Run complete analysis
   */
  public analyze(): AnalysisResult {
    this.collectDefinitions();
    this.collectReferences();
    this.detectUndefinedReferences();
    this.detectUnusedConcepts();
    return {
      diagnostics: this.diagnostics,
      definitions: this.definitions,
      references: this.references,
    };
  }
}
/**
 * Analyze a Natural Language document and return diagnostics
 */
export function analyze(document: NaturalDocument): Diagnostic[] {
  const analyzer = new Analyzer(document);
  const result = analyzer.analyze();
  return result.diagnostics;
}
/**
 * Get all concept definitions from a document
 */
export function getDefinitions(document: NaturalDocument): Map<string, ConceptDefinition> {
  const analyzer = new Analyzer(document);
  const result = analyzer.analyze();
  return result.definitions;
}
/**
 * Get all concept references from a document
 */
export function getReferences(document: NaturalDocument): Map<string, ConceptReference[]> {
  const analyzer = new Analyzer(document);
  const result = analyzer.analyze();
  return result.references;
}
