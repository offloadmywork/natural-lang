/**
 * Position in source code (line and column, 1-indexed)
 */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/**
 * Range in source code
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Location in source code with source file information
 */
export interface Location {
  range: Range;
  source?: string;
}

/**
 * Reference to another concept within prose
 */
export interface ConceptReference {
  type: 'ConceptReference';
  name: string;
  location: Location;
}

/**
 * A block of prose (free-form text)
 */
export interface ProseBlock {
  type: 'ProseBlock';
  text: string;
  references: ConceptReference[];
  location: Location;
}

/**
 * A concept definition (@ConceptName followed by prose)
 */
export interface ConceptDefinition {
  type: 'ConceptDefinition';
  name: string;
  prose: ProseBlock[];
  location: Location;
}

/**
 * Root AST node representing a complete .nl document
 */
export interface NaturalDocument {
  type: 'NaturalDocument';
  concepts: ConceptDefinition[];
  location: Location;
}

/**
 * Diagnostic severity levels
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

/**
 * Diagnostic message (error/warning/info)
 */
export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  location: Location;
  code?: string;
}
