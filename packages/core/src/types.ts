export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Concept {
  name: string;
  type: "definition" | "reference";
  position: Range;
}

export interface Section {
  text: string;
  range: Range;
  concepts: Concept[];
}

export interface AST {
  sections: Section[];
}

export interface Diagnostic {
  range: Range;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ParseResult {
  ast: AST;
  diagnostics: Diagnostic[];
}
