# Natural Language VSCode Extension

**Write software in plain English. Get full IDE support.**

This extension provides first-class support for `.nl` (Natural Language) files, the source code format for the [Natural programming language](https://github.com/offloadmywork/natural-lang).

## Features

### 🎨 Syntax Highlighting
- **`@ConceptName`** definitions highlighted as keywords (bold, distinct color)
- Prose text rendered clearly and readably
- `@References` to concepts within prose highlighted distinctly
- Support for strings, numbers, URLs, HTTP methods

### 🧠 Language Server Integration
- **Real-time diagnostics**: Errors, warnings, and suggestions as you type
- **Go-to-definition**: Jump to concept definitions
- **Hover tooltips**: See concept details on hover
- **Code completion**: Smart suggestions based on context

### 📝 Smart Editing
- **Auto-completion**: Type `@` to create a new concept block
- **Snippets**: Quickly insert common patterns (API endpoints, validation rules, error handling)
- **Comment toggling**: Use `//` or `#` for line comments
- **Auto-closing**: Brackets, quotes, and parentheses close automatically
- **Code folding**: Collapse/expand concept blocks

### 🗂️ Code Navigation
- **Outline view**: See all `@Concept` definitions at a glance
- **Symbol search**: Find concepts across files
- **Word-aware selection**: Smart selection of concept names

### 📦 File Association
- `.nl` files get a distinctive icon
- Automatic language detection

## Quick Start

1. Install the extension
2. Open or create a `.nl` file
3. Start writing:

```natural
@UserProfile
A user has a name, email, and optional avatar URL.
Email must be unique across all users.
Names are 2-100 characters.

@Authentication
Users can register with email and password.
Passwords must be at least 8 characters with one number.
After registration, send a verification email.
```

## Snippets

Type these prefixes and press `Tab`:

- `@` → New concept definition
- `api` → API endpoint template
- `validate` → Validation rule
- `error` → Error handling

## About Natural

Natural is a programming language where you write specifications in plain English, and an agentic compiler turns them into working software.

**Key ideas:**
- `.nl` files are your source code, versioned in git
- Full IDE support with diagnostics, go-to-definition, refactoring
- Compiler generates transparent, inspectable TypeScript
- Engineering-grade, not a toy

Learn more:
- [GitHub Repository](https://github.com/offloadmywork/natural-lang)
- [Documentation](https://github.com/offloadmywork/wiki/blob/main/projects/natural-lang.md)
- [Examples](https://github.com/offloadmywork/natural-lang/tree/main/examples)

## Requirements

- VSCode 1.85.0 or higher
- Node.js 18+ (for the language server)

## Extension Settings

This extension contributes the following settings:

* No custom settings yet (coming soon)

## Development

To work on this extension:

```bash
# Install dependencies
npm install

# Build the extension and LSP server
npm run build

# Package the extension
npm run package

# Install locally
code --install-extension natural-lang-0.1.0.vsix
```

## Architecture

This extension consists of two main components:

1. **VSCode Extension** (`src/extension.ts`): Manages the VSCode integration and starts the language server
2. **Language Server** (`../lsp`): Provides real-time analysis, diagnostics, and code intelligence

The language server analyzes `.nl` files and provides:
- Syntax validation
- Semantic analysis (ambiguity detection, undefined references)
- Code completion
- Hover information
- Go-to-definition

## Roadmap

- [x] Syntax highlighting
- [x] Language server integration
- [x] Basic diagnostics
- [x] Snippets and code folding
- [ ] Advanced diagnostics (ambiguity, contradiction detection)
- [ ] Quick fixes and code actions
- [ ] Refactoring support
- [ ] Multi-file project support
- [ ] Import/export between concepts

## Contributing

Found a bug? Have a feature request? [Open an issue](https://github.com/offloadmywork/natural-lang/issues) on GitHub.

## License

MIT

---

**Made with ❤️ by the Natural team**
