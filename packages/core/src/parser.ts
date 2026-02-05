import { Lexer, Token, TokenType } from './lexer.js';
import {
  NaturalDocument,
  ConceptDefinition,
  ProseBlock,
  ConceptReference,
  Location,
  Position,
  Range,
} from './types.js';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private source: string;

  constructor(source: string) {
    this.source = source;
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private createLocation(start: Position, end: Position): Location {
    return {
      range: { start, end },
      source: this.source,
    };
  }

  private findConceptReferences(text: string, startPos: Position): ConceptReference[] {
    const references: ConceptReference[] = [];
    
    // Match @ConceptName patterns in text
    const regex = /@([A-Z][A-Za-z0-9_]*)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const conceptName = match[1];
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      // Calculate position (assuming single line for simplicity)
      const refStart: Position = {
        line: startPos.line,
        column: startPos.column + matchStart,
        offset: startPos.offset + matchStart,
      };

      const refEnd: Position = {
        line: startPos.line,
        column: startPos.column + matchEnd,
        offset: startPos.offset + matchEnd,
      };

      references.push({
        type: 'ConceptReference',
        name: conceptName,
        location: this.createLocation(refStart, refEnd),
      });
    }

    return references;
  }

  private parseProse(): ProseBlock[] {
    const proseBlocks: ProseBlock[] = [];
    let currentText = '';
    let proseStart: Position | null = null;
    let proseEnd: Position | null = null;

    // Collect all text and newlines until next concept or EOF
    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === TokenType.ConceptDefinition) {
        break;
      }

      if (token.type === TokenType.Text) {
        if (proseStart === null) {
          proseStart = token.start;
        }
        currentText += token.value;
        proseEnd = token.end;
        this.advance();
      } else if (token.type === TokenType.Newline) {
        if (proseStart === null) {
          proseStart = token.start;
        }
        currentText += '\n';
        proseEnd = token.end;
        this.advance();
      } else {
        this.advance();
      }
    }

    // Create prose block if we have content
    if (currentText.trim().length > 0 && proseStart && proseEnd) {
      const references = this.findConceptReferences(currentText, proseStart);
      proseBlocks.push({
        type: 'ProseBlock',
        text: currentText.trim(),
        references,
        location: this.createLocation(proseStart, proseEnd),
      });
    }

    return proseBlocks;
  }

  private parseConcept(): ConceptDefinition | null {
    const token = this.peek();

    if (token.type !== TokenType.ConceptDefinition) {
      return null;
    }

    const conceptToken = this.advance();
    const conceptName = conceptToken.value;
    const start = conceptToken.start;

    // Skip newline after concept definition
    if (this.peek().type === TokenType.Newline) {
      this.advance();
    }

    // Parse prose until next concept or EOF
    const prose = this.parseProse();

    const end = prose.length > 0 
      ? prose[prose.length - 1].location.range.end 
      : conceptToken.end;

    return {
      type: 'ConceptDefinition',
      name: conceptName,
      prose,
      location: this.createLocation(start, end),
    };
  }

  public parse(): NaturalDocument {
    const concepts: ConceptDefinition[] = [];
    const startPos: Position = { line: 1, column: 1, offset: 0 };

    while (!this.isAtEnd()) {
      // Skip leading newlines
      while (this.peek().type === TokenType.Newline) {
        this.advance();
      }

      if (this.isAtEnd()) {
        break;
      }

      const concept = this.parseConcept();
      if (concept) {
        concepts.push(concept);
      } else {
        // Skip unexpected tokens
        this.advance();
      }
    }

    const endPos = this.tokens[this.tokens.length - 1]?.end || startPos;

    return {
      type: 'NaturalDocument',
      concepts,
      location: this.createLocation(startPos, endPos),
    };
  }
}

/**
 * Parse Natural Language source code into an AST
 */
export function parse(source: string): NaturalDocument {
  const parser = new Parser(source);
  return parser.parse();
}
