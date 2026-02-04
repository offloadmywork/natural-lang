# Natural

> **Write software in plain English. Let the compiler handle the rest.**

Natural is a programming language where you write free-form natural language text, and an agentic compiler turns it into working software. Get full IDE support — squiggly lines, go-to-definition, suggestions — but on prose, not code.

```natural
@UserProfile
A user has a name, email, and optional avatar URL.
Email must be unique across all users.
Names are 2-100 characters.

@Authentication
Users can register with email and password.
Passwords must be at least 8 characters with one number.
After registration, send a verification email.
Users can login with email and password.
Failed login attempts are limited to 5 per hour per email.
```

↓ compiles to ↓

```typescript
interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

class AuthService {
  async register(email: string, password: string): Promise<UserProfile> {
    // ... generated implementation with validation, rate limiting, etc.
  }
  // ... more generated code
}
```

## Why Natural?

**Programming languages have spent decades moving toward human readability. Natural completes that journey.**

Instead of translating your ideas into a programming language's syntax, you write your ideas directly. The compiler is smart enough to understand what you mean and generate the code.

### The Core Insight

Software specifications are already code — we just haven't had a compiler smart enough to execute them directly.

With Natural:
- ✅ Your `.nl` files are the source of truth, versioned in git
- ✅ Changes to requirements = changes to .nl files (no stale docs)
- ✅ Full IDE support with type checking, diagnostics, refactoring
- ✅ Generated code is transparent and inspectable
- ✅ Engineering-grade, not a toy

## What Makes Natural Different?

| Natural | Others |
|---------|--------|
| **Spec-is-code** — .nl files ARE your source | OpenSpec: spec-then-code workflow tool |
| **Source-controlled** — version, review, deploy | Prompt-to-code: ephemeral, not versioned |
| **General-purpose** — build anything | Inform 7: limited to interactive fiction |
| **IDE integration** — the moat that turns vibe coding into engineering | Most tools: no editor support |

## Features

### 🎯 Natural Language Syntax
Write in plain English (or your preferred language). Minimal syntax — just `@ConceptName` to define things.

### 🔍 Real-Time Diagnostics
- 🔴 **Errors:** Contradictions, undefined references, impossible requirements
- 🟡 **Warnings:** Ambiguity, vague specs, missing edge cases  
- 💡 **Info:** Suggestions for clarity, better definitions

### 🧠 Agentic Compiler
Multi-step compilation pipeline:
1. **Parse** — extract concepts and relationships
2. **Analyze** — build semantic model
3. **Plan** — design architecture
4. **Generate** — produce code
5. **Validate** — ensure correctness

### 🛠️ Full IDE Support
- Syntax highlighting for `.nl` files
- Squiggly lines for issues
- Go-to-definition on concepts
- Hover tooltips
- Code actions & quick fixes
- Inline suggestions

### 📦 Modern Tooling
```bash
natural init          # Start a new project
natural check         # Analyze for issues
natural build         # Compile to TypeScript
natural watch         # Development mode
natural explain       # See what the compiler understands
```

## Example: Todo App

See [`examples/todo-app.nl`](examples/todo-app.nl) for a complete example showing:
- User authentication
- CRUD operations
- Data validation
- Business logic
- API endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      .nl Source Files                        │
│                  (Natural Language Text)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LSP Server (Real-Time)                    │
│  • Analyzes for ambiguity, contradictions, undefined refs   │
│  • Provides diagnostics to VSCode                           │
│  • LLM-powered semantic analysis                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Agentic Compiler                          │
│  Parse → Analyze → Plan → Generate → Validate              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Generated TypeScript                       │
│            (inspectable, debuggable, deployable)            │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
natural-lang/
├── packages/
│   ├── core/          # Parser + analysis engine
│   ├── lsp/           # Language Server Protocol implementation
│   ├── compiler/      # Agentic compiler (.nl → code)
│   ├── cli/           # Command-line interface
│   └── vscode/        # VSCode extension
├── examples/          # Example .nl programs
└── docs/             # Documentation
```

## Quick Start

```bash
# Install (coming soon)
npm install -g natural-lang

# Create a new project
natural init my-app
cd my-app

# Write your app in app.nl
cat > app.nl << 'EOF'
@Task
A task has a title, description, and completion status.
Tasks can be created, marked as complete, and deleted.

@TaskList
Show all tasks with incomplete tasks first.
Users can filter by completion status.
EOF

# Compile and run
natural build
npm start
```

## Current Status

🚧 **Early Development** — We're building the foundation.

**Current phase:** Setting up the architecture and core components.

See [Issues](https://github.com/offloadmywork/natural-lang/issues) for the roadmap.

## Roadmap

### Phase 1: Foundation (MVP)
- [ ] Core parser and AST
- [ ] LSP server with basic diagnostics
- [ ] VSCode extension with syntax highlighting
- [ ] Simple compiler (TypeScript output)
- [ ] CLI basics

### Phase 2: Intelligence
- [ ] Advanced LLM analysis
- [ ] Smart diagnostics (ambiguity, contradiction detection)
- [ ] Go-to-definition and hover tooltips
- [ ] Code actions and quick fixes

### Phase 3: Production-Ready
- [ ] Incremental compilation
- [ ] Multi-file projects
- [ ] Import/export between .nl files
- [ ] Testing framework integration

### Phase 4: Ecosystem
- [ ] Additional language targets (Python, Go)
- [ ] Plugin system
- [ ] Standard library
- [ ] Community templates

## Design Principles

1. **Readability First** — If humans can't read it easily, it's not Natural
2. **Progressive Enhancement** — Start simple, add structure as needed
3. **Fail Gracefully** — Ambiguity isn't fatal, it's a conversation
4. **Trust but Verify** — Generate code, let developers inspect
5. **Version Control Native** — .nl files are first-class source code

## Contributing

We're in early stages, but contributions are welcome! Check out the [Issues](https://github.com/offloadmywork/natural-lang/issues) to see what needs work.

## Philosophy

> "The best programming language is the one you already know: human language."

We believe software development should be about expressing ideas clearly, not memorizing syntax. Natural brings the flexibility of natural language together with the rigor of type systems and static analysis.

The goal isn't to replace traditional programming — it's to make it accessible to more people and faster for everyone.

## License

MIT

## Links

- **Wiki/Spec:** [offloadmywork/wiki](https://github.com/offloadmywork/wiki/blob/main/projects/natural-lang.md)
- **Issues:** [GitHub Issues](https://github.com/offloadmywork/natural-lang/issues)
- **Discussions:** [GitHub Discussions](https://github.com/offloadmywork/natural-lang/discussions)

---

**Status:** Early Development  
**Target:** TypeScript (initially)  
**Started:** February 2026
