/**
 * @natural-lang/core
 * 
 * Core parser and analysis engine for Natural programming language
 */

// Export public API
export { parse } from './parser.js';
export { analyze, getDefinitions, getReferences } from './analyzer.js';

// Export AST types
export type {
  Position,
  Range,
  Location,
  ConceptReference,
  ProseBlock,
  ConceptDefinition,
  NaturalDocument,
  Diagnostic,
  DiagnosticSeverity,
} from './types.js';
