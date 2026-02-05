import { Position } from './types.js';

export enum TokenType {
  ConceptDefinition = 'ConceptDefinition',
  Text = 'Text',
  Newline = 'Newline',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  start: Position;
  end: Position;
}

export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  private createPosition(): Position {
    return {
      line: this.line,
      column: this.column,
      offset: this.position,
    };
  }

  private peek(offset: number = 0): string {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : '';
  }

  private advance(): string {
    if (this.position >= this.source.length) {
      return '';
    }

    const char = this.source[this.position];
    this.position++;

    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  private isAtConceptStart(): boolean {
    // Check if we're at the start of a line and see @ followed by an uppercase letter
    return this.column === 1 && this.peek() === '@' && /[A-Z]/.test(this.peek(1));
  }

  private scanConceptDefinition(): Token {
    const start = this.createPosition();
    this.advance(); // consume '@'

    let name = '';
    while (this.position < this.source.length) {
      const char = this.peek();
      if (/[A-Za-z0-9_]/.test(char)) {
        name += this.advance();
      } else {
        break;
      }
    }

    const end = this.createPosition();
    return {
      type: TokenType.ConceptDefinition,
      value: name,
      start,
      end,
    };
  }

  private scanText(): Token {
    const start = this.createPosition();
    let text = '';

    while (this.position < this.source.length) {
      if (this.peek() === '\n') {
        break;
      }
      if (this.isAtConceptStart()) {
        break;
      }
      text += this.advance();
    }

    const end = this.createPosition();
    return {
      type: TokenType.Text,
      value: text,
      start,
      end,
    };
  }

  private scanNewline(): Token {
    const start = this.createPosition();
    this.advance(); // consume '\n'
    const end = this.createPosition();
    return {
      type: TokenType.Newline,
      value: '\n',
      start,
      end,
    };
  }

  public nextToken(): Token {
    // Skip leading whitespace at start of line (except newlines)
    if (this.column === 1) {
      while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\r') {
        this.advance();
      }
    }

    // EOF
    if (this.position >= this.source.length) {
      const pos = this.createPosition();
      return {
        type: TokenType.EOF,
        value: '',
        start: pos,
        end: pos,
      };
    }

    // Concept definition (@ConceptName)
    if (this.isAtConceptStart()) {
      return this.scanConceptDefinition();
    }

    // Newline
    if (this.peek() === '\n') {
      return this.scanNewline();
    }

    // Text
    return this.scanText();
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token: Token;

    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== TokenType.EOF);

    return tokens;
  }
}
