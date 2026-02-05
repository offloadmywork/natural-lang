# LSP Server Test

## What was built

A complete Language Server Protocol implementation for `.nl` files at `packages/lsp/src/server.ts`.

## Features Implemented

✅ **Text Document Sync** - Full incremental sync with open/change/close handlers
✅ **Diagnostics** - Real-time validation showing errors/warnings for:
  - Duplicate concept definitions
  - Undefined concept references
  - Unused concepts

✅ **Go-to-Definition** - Click on `@ConceptName` to jump to its definition

✅ **Hover** - Hover over `@ConceptName` to see its full prose description

✅ **Document Symbols** - Outline view showing all `@ConceptName` definitions

✅ **Completion** - Type `@` to get autocomplete suggestions for all defined concepts

## Architecture

- Uses `@natural-lang/core` package (parse, analyze, getDefinitions, getReferences)
- Built with `vscode-languageserver` and `vscode-languageserver-textdocument`
- Properly converts 1-indexed core positions to 0-indexed LSP positions
- Document caching for performance
- Integrated with VSCode extension build pipeline

## Build & Deploy

```bash
cd /tmp/natural-lang
npm install
npm run build
```

The server is built to:
- `packages/lsp/dist/server.js` (for standalone use)
- `packages/vscode/dist/server.js` (bundled into extension)

## Status

✅ Compiles successfully
✅ Committed and pushed (commit 8e1079a)
✅ Issue #2 documented

Ready for testing in VSCode!
