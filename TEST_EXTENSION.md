# Testing the VSCode Extension

## Installation
```bash
cd packages/vscode
code --install-extension natural-lang-0.1.0.vsix
```

## Test Cases

1. **Syntax Highlighting**
   - Open `examples/todo-app.nl`
   - Verify `@TaskAPI`, `@CreateTask`, etc. are highlighted
   - Verify HTTP methods (GET, POST, etc.) are highlighted
   - Verify concept references in prose are highlighted

2. **Snippets**
   - Create a new .nl file
   - Type `@` and press Tab → should create concept template
   - Type `api` and press Tab → should create API endpoint template
   - Type `validate` and press Tab → should create validation rule
   - Type `error` and press Tab → should create error handling

3. **Code Folding**
   - Open `examples/todo-app.nl`
   - Click the fold icon next to any @Concept line
   - Verify the concept block collapses

4. **Outline View**
   - Open `examples/todo-app.nl`
   - Open the Outline panel (View → Open View → Outline)
   - Verify all @Concept definitions appear in the outline

5. **LSP Features** (if LSP server is running)
   - Hover over @Concept names for tooltips
   - Use Cmd+Click (or Ctrl+Click) to go to definition
   - Check for diagnostics in the Problems panel

## Expected Results

All features should work seamlessly. The extension provides a smooth,
IDE-like experience for editing Natural language (.nl) files.
