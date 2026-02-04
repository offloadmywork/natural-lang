import { AST, Concept, Diagnostic, ParseResult, Position, Range, Section } from "./types.js";

export class Parser {
  private text: string;
  private lines: string[];

  constructor(text: string) {
    this.text = text;
    this.lines = text.split("\n");
  }

  parse(): ParseResult {
    const ast = this.buildAST();
    const diagnostics = this.generateDiagnostics(ast);
    return { ast, diagnostics };
  }

  private buildAST(): AST {
    const sections: Section[] = [];
    let currentSection: string[] = [];
    let sectionStartLine = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Empty line indicates section boundary
      if (line.trim() === "") {
        if (currentSection.length > 0) {
          sections.push(this.createSection(currentSection, sectionStartLine));
          currentSection = [];
        }
        sectionStartLine = i + 1;
      } else {
        currentSection.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection.length > 0) {
      sections.push(this.createSection(currentSection, sectionStartLine));
    }

    return { sections };
  }

  private createSection(lines: string[], startLine: number): Section {
    const text = lines.join("\n");
    const endLine = startLine + lines.length - 1;
    const endChar = lines[lines.length - 1].length;

    const range: Range = {
      start: { line: startLine, character: 0 },
      end: { line: endLine, character: endChar },
    };

    const concepts = this.extractConcepts(text, startLine);

    return { text, range, concepts };
  }

  private extractConcepts(text: string, startLine: number): Concept[] {
    const concepts: Concept[] = [];
    
    // Match @ConceptName pattern
    // Concept names must start with uppercase letter and can contain alphanumeric + underscores
    const conceptRegex = /@([A-Z][a-zA-Z0-9_]*)/g;
    
    let match;
    while ((match = conceptRegex.exec(text)) !== null) {
      const conceptName = match[1];
      const matchIndex = match.index;
      
      // Calculate line and character position
      const textBeforeMatch = text.substring(0, matchIndex);
      const linesBeforeMatch = textBeforeMatch.split("\n");
      const lineOffset = linesBeforeMatch.length - 1;
      const line = startLine + lineOffset;
      const character = linesBeforeMatch[linesBeforeMatch.length - 1].length;
      
      // Determine if this is a definition or reference
      // Definition: @ConceptName appears at start of line or after whitespace/punctuation
      const textBefore = text.substring(Math.max(0, matchIndex - 20), matchIndex);
      const isDefinition = this.isLikelyDefinition(textBefore, text.substring(matchIndex));
      
      const range: Range = {
        start: { line, character },
        end: { line, character: character + conceptName.length + 1 }, // +1 for @
      };
      
      concepts.push({
        name: conceptName,
        type: isDefinition ? "definition" : "reference",
        position: range,
      });
    }
    
    return concepts;
  }

  private isLikelyDefinition(textBefore: string, textAt: string): boolean {
    // Heuristic: if @Concept is at the beginning of a section or after "is", "are", "means", etc.
    // it's likely a definition
    const definitionKeywords = /\b(is|are|means|defines?|represents?|refers? to)\s*$/i;
    
    // Check if at start of section (only whitespace before)
    if (textBefore.trim() === "" || textBefore.match(/^\s*$/)) {
      return true;
    }
    
    // Check for definition keywords
    if (definitionKeywords.test(textBefore)) {
      return true;
    }
    
    return false;
  }

  private generateDiagnostics(ast: AST): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const definitions = new Map<string, Range>();
    const references = new Map<string, Range[]>();

    // Collect all definitions and references
    for (const section of ast.sections) {
      // Check for empty sections
      if (section.text.trim() === "") {
        diagnostics.push({
          range: section.range,
          message: "Empty section",
          severity: "info",
        });
      }

      for (const concept of section.concepts) {
        if (concept.type === "definition") {
          if (definitions.has(concept.name)) {
            // Duplicate definition
            diagnostics.push({
              range: concept.position,
              message: `Duplicate definition of concept '${concept.name}'`,
              severity: "warning",
            });
          } else {
            definitions.set(concept.name, concept.position);
          }
        } else {
          // Collect references
          if (!references.has(concept.name)) {
            references.set(concept.name, []);
          }
          references.get(concept.name)!.push(concept.position);
        }
      }
    }

    // Check for undefined references
    for (const [conceptName, ranges] of references.entries()) {
      if (!definitions.has(conceptName)) {
        for (const range of ranges) {
          diagnostics.push({
            range,
            message: `Undefined concept reference '${conceptName}'`,
            severity: "error",
          });
        }
      }
    }

    return diagnostics;
  }
}

export function parse(text: string): ParseResult {
  const parser = new Parser(text);
  return parser.parse();
}
