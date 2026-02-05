import {
  NaturalDocument,
  ConceptDefinition,
  ConceptReference,
  Diagnostic,
  DiagnosticSeverity,
} from './types.js';

export interface AnalysisResult {
  diagnostics: Diagnostic[];
  definitions: Map<string, ConceptDefinition>;
  references: Map<string, ConceptReference[]>;
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
        this.diagnostics.push({
          severity: 'error',
          message: `Duplicate concept definition: @${name} is already defined at line ${existing.location.range.start.line}`,
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
        for (const ref of refs) {
          this.diagnostics.push({
            severity: 'error',
            message: `Undefined concept: @${name} is referenced but never defined`,
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
          message: `Unused concept: @${name} is defined but never referenced`,
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
