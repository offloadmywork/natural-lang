# Natural Language Programming

Natural is a programming language where you write specifications in natural language, and an agentic compiler turns them into working software.

## 🎯 Core Value Proposition

Write what you want in plain English, and Natural's AI compiler generates production-ready TypeScript code.

## Project Structure

- **packages/core/** - Parser for .nl files (extracts concepts and structure)
- **packages/compiler/** - Agentic AI-powered code generator (.nl → TypeScript)
- **packages/cli/** - Command-line interface (`natural build`)
- **packages/lsp/** - Language Server Protocol implementation
- **packages/vscode/** - VSCode extension

## Features

### Editor Support (VSCode Extension)
- **Syntax highlighting** for @Concepts
- **Static analysis** - undefined references, duplicate definitions
- **LLM-powered analysis** - contradictions, ambiguities, suggestions (optional)
- **Hover info** - see concept definitions
- **Go to definition** - jump to concept definitions

### AI-Powered Compilation
- **Agentic compiler** - Uses LLM to understand your natural language specs and generate working code
- **Intelligent code generation** - Creates TypeScript interfaces, Zod schemas, Express APIs, and web UIs
- **Template fallback** - Works without AI (using heuristics) if no API key is provided
- **Multiple LLM providers** - Compatible with OpenAI, Claude, or any OpenAI-compatible API

## Quick Start

### 1. Installation

```bash
git clone https://github.com/offloadmywork/natural-lang.git
cd natural-lang
npm install
npm run build
```

### 2. Create Your First Natural Program

Create a file called `my-app.nl`:

```
@Task
A task has a unique ID, title, and completion status.
Users can create, update, and delete tasks.

@API
Expose a REST API:
GET /tasks — list all tasks
POST /tasks — create a task
DELETE /tasks/:id — delete a task

All endpoints return JSON.
```

### 3. Compile with AI (Recommended)

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-..."
# Or use Claude via OpenRouter:
export NATURAL_LLM_API_KEY="sk-..."
export NATURAL_LLM_BASE_URL="https://openrouter.ai/api/v1"
export NATURAL_LLM_MODEL="anthropic/claude-3.5-sonnet"
```

Then compile:

```bash
node packages/cli/dist/index.js build my-app.nl -o output
cd output
npm install
npm run dev
```

Your API is now running on http://localhost:3000! 🎉

### 4. Without AI (Template-Based Fallback)

If you don't set an API key, Natural falls back to template-based code generation:

```bash
node packages/cli/dist/index.js build my-app.nl -o output
```

This works but produces less sophisticated code. AI compilation is strongly recommended for production use.

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

## CLI Commands

```bash
# Initialize a new Natural project
natural init [directory]

# Check a .nl file for errors
natural check app.nl

# Compile a .nl file to TypeScript
natural build app.nl [-o output-dir]

# Explain what the compiler understands
natural explain app.nl
```

## Examples

Check out the `examples/` directory for complete sample programs:

- **`todo-app.nl`** - Full-featured task management API with CRUD operations
- **`blog-platform.nl`** - Multi-user blogging platform with posts, comments, tags, authentication
- **`url-shortener.nl`** - URL shortening service with analytics, QR codes, and custom aliases  
- **`ecommerce-catalog.nl`** - Product catalog with categories, variants, inventory, shopping cart

Each example demonstrates different Natural features and complexity levels.

## How It Works

1. **Parse**: The parser extracts @Concepts and their descriptions from your .nl file
2. **Analyze**: Static analysis checks for errors (undefined references, duplicates)
3. **Generate**: The AI compiler reads your specifications and generates:
   - TypeScript interfaces for your data models
   - Zod validation schemas
   - Express.js API routes with proper error handling
   - Storage layer (in-memory or database)
   - Web UI (if specified)
   - Complete project configuration (package.json, tsconfig.json, etc.)

## Editor Integration (VSCode)

Install the Natural VSCode extension for the best experience:

```bash
cd packages/vscode
npm run build
npm run package
# Install the generated .vsix file in VSCode
```

The extension provides:
- Syntax highlighting for @Concepts
- Real-time diagnostics
- Hover information
- Go-to-definition
- Optional AI-powered semantic analysis
