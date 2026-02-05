# @natural-lang/core

Core parser and analysis engine for Natural programming language.

## Features

- **Lexer/Scanner**: Tokenizes .nl source files
- **Parser**: Builds AST from tokens
- **Analyzer**: Detects undefined references, unused concepts, and duplicate definitions
- **Zero dependencies**: Pure TypeScript implementation

## Installation

```bash
npm install @natural-lang/core
```

## Usage

```typescript
import { parse, analyze } from '@natural-lang/core';

const source = `
@Task
A task has a unique ID and title.

@TaskList  
Contains multiple @Task items.
`;

// Parse source into AST
const document = parse(source);

// Analyze for errors and warnings
const diagnostics = analyze(document);

diagnostics.forEach(d => {
  console.log(`${d.severity}: ${d.message} at line ${d.location.range.start.line}`);
});
```

## API

### `parse(source: string): NaturalDocument`

Parses Natural Language source code into an Abstract Syntax Tree (AST).

**Parameters:**
- `source` - The .nl source code to parse

**Returns:** A `NaturalDocument` containing all parsed concepts

### `analyze(document: NaturalDocument): Diagnostic[]`

Analyzes a parsed document and returns diagnostics (errors, warnings, info).

**Parameters:**
- `document` - The parsed Natural Language document

**Returns:** Array of diagnostics with the following checks:
- Undefined references (concepts referenced but not defined)
- Unused concepts (concepts defined but never referenced)
- Duplicate definitions (same concept defined multiple times)

### `getDefinitions(document: NaturalDocument): Map<string, ConceptDefinition>`

Returns all concept definitions in the document.

### `getReferences(document: NaturalDocument): Map<string, ConceptReference[]>`

Returns all concept references in the document.

## AST Types

- **`NaturalDocument`** - Root node containing all concepts
- **`ConceptDefinition`** - A @ConceptName with its prose body
- **`ProseBlock`** - Free-form text with embedded references
- **`ConceptReference`** - Reference to another concept (@ConceptName)
- **`Diagnostic`** - Error, warning, or info message

All AST nodes include source location information for editor integration.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run test:watch
```

## License

MIT
