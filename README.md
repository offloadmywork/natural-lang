# Natural Language Programming

Natural is a programming language where you write specifications in natural language, and an agentic compiler turns them into working software.

## Project Structure

- **packages/core/** - Parser for .nl files (extracts concepts and structure)
- **packages/lsp/** - Language Server Protocol implementation
- **packages/vscode/** - VSCode extension

## Features

- **Syntax highlighting** for @Concepts
- **Static analysis** - undefined references, duplicate definitions
- **LLM-powered analysis** - contradictions, ambiguities, suggestions (optional, requires OPENROUTER_API_KEY)
- **Hover info** - see concept definitions
- **Go to definition** - jump to concept definitions

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode (for development)
npm run dev
```

## VSCode Extension

```bash
cd packages/vscode
npm run build
npm run package  # Creates .vsix file
```

Install the extension:
1. Open VSCode
2. Go to Extensions (Cmd+Shift+X)
3. Click "..." menu → "Install from VSIX..."
4. Select the generated .vsix file

## Example

Create a file `example.nl`:

```
@User is a person who uses the system.

@System provides functionality to @User.

The @System must respond within 200ms when @User makes a request.

@Admin is a @User with elevated privileges.
```

The LSP will:
- Highlight all @Concepts
- Show hover info when you hover over concepts
- Warn about undefined references
- Detect contradictions and ambiguities (with LLM enabled)
