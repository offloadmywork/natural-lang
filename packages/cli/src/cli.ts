#!/usr/bin/env node
/**
 * Natural Language CLI
 * Commands: init, check, build, explain
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, analyze, getDefinitions, getReferences } from '@natural-lang/core';
import { compile } from '@natural-lang/compiler';
import type { Diagnostic } from '@natural-lang/core';

// ANSI color codes (simple, no dependencies)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printDiagnostic(diagnostic: Diagnostic, filePath?: string): void {
  const { severity, message, location } = diagnostic;
  const { line, column } = location.range.start;
  
  // Format location
  const fileInfo = filePath ? `${path.basename(filePath)}:` : '';
  const locationStr = colorize('gray', `${fileInfo}${line}:${column}`);
  
  // Print each line of the message with proper indentation
  const messageLines = message.split('\n');
  const firstLine = messageLines[0];
  const restLines = messageLines.slice(1);

  switch (severity) {
    case 'error':
      console.log(`\n  ${locationStr}`);
      console.log(colorize('red', `  ${firstLine}`));
      break;
    case 'warning':
      console.log(`\n  ${locationStr}`);
      console.log(colorize('yellow', `  ${firstLine}`));
      break;
    case 'info':
      console.log(`\n  ${locationStr}`);
      console.log(colorize('blue', `  ${firstLine}`));
      break;
  }
  
  // Print rest of message (fix guidance, suggestions, etc.)
  for (const line of restLines) {
    if (line.includes('💡')) {
      console.log(colorize('green', `  ${line}`));
    } else if (line.includes('🤔')) {
      console.log(colorize('cyan', `  ${line}`));
    } else {
      console.log(colorize('gray', `  ${line}`));
    }
  }
}

function printSummary(errors: number, warnings: number, infos: number): void {
  console.log(colorize('dim', '─'.repeat(50)));
  
  const parts: string[] = [];
  
  if (errors > 0) {
    parts.push(colorize('red', `${errors} error${errors === 1 ? '' : 's'}`));
  }
  if (warnings > 0) {
    parts.push(colorize('yellow', `${warnings} warning${warnings === 1 ? '' : 's'}`));
  }
  if (infos > 0) {
    parts.push(colorize('blue', `${infos} info`));
  }
  
  if (parts.length === 0) {
    console.log(colorize('green', '✨ No issues found!\n'));
  } else {
    const summary = parts.join(colorize('gray', ' · '));
    console.log(`\n📊 Summary: ${summary}\n`);
    
    if (errors > 0) {
      console.log(colorize('red', `❌ Check failed with ${errors} error${errors === 1 ? '' : 's'}\n`));
    } else if (warnings > 0) {
      console.log(colorize('yellow', `⚠️  Check passed with warnings\n`));
    }
  }
}

function commandInit(args: string[]): void {
  const dir = args[0] || '.';
  const targetDir = path.resolve(dir);

  console.log(colorize('blue', '🚀 Initializing Natural project...\n'));

  // Create directory if needed
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create natural.config.json
  const config = {
    version: '0.1.0',
    target: 'typescript',
    outDir: 'dist',
  };

  const configPath = path.join(targetDir, 'natural.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(colorize('green', '  ✓ Created natural.config.json'));

  // Create example.nl
  const exampleNl = path.join(targetDir, 'example.nl');
  const exampleContent = `@Task
A task has a unique ID, title, and completion status.
The ID is auto-generated when a task is created.
Titles are required and must be 1-200 characters.
Tasks start as incomplete by default.

@TaskList
A task list contains multiple tasks.
Tasks can be filtered by completion status.

@CreateTask
Users can create a new task by providing a title.
The system generates a unique ID and sets the status to incomplete.
Returns the newly created task.

@TaskAPI
Expose a REST API with the following endpoints:

GET /tasks — returns all tasks
GET /tasks/:id — returns a single task by ID, or 404 if not found
POST /tasks — creates a new task with title in the body
DELETE /tasks/:id — deletes a task

All endpoints return JSON.
Use appropriate HTTP status codes (200, 201, 404, 400, 500).
`;

  fs.writeFileSync(exampleNl, exampleContent, 'utf-8');
  console.log(colorize('green', '  ✓ Created example.nl\n'));

  console.log(colorize('dim', '─'.repeat(50)));
  console.log(colorize('green', '\n✨ Project initialized successfully!\n'));
  console.log('Next steps:');
  console.log(colorize('cyan', '  1. Edit example.nl to describe your application'));
  console.log(colorize('cyan', `  2. Run: ${colorize('bold', 'natural check example.nl')} to validate`));
  console.log(colorize('cyan', `  3. Run: ${colorize('bold', 'natural build example.nl')} to generate code`));
  console.log(colorize('cyan', '  4. cd output && npm install && npm run dev\n'));
}

function commandCheck(args: string[]): void {
  const filePath = args[0];

  if (!filePath) {
    console.error(colorize('red', '\n❌ Error: No file specified\n'));
    console.log('Usage: ' + colorize('cyan', 'natural check <file>'));
    console.log('\nExamples:');
    console.log(colorize('gray', '  natural check app.nl'));
    console.log(colorize('gray', '  natural check src/main.nl\n'));
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `\n❌ Error: File not found: ${filePath}`));
    console.log(colorize('gray', `\n   Looked for: ${resolvedPath}`));
    
    // Try to find similar files
    const dir = path.dirname(resolvedPath);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.nl'));
      if (files.length > 0) {
        console.log(colorize('cyan', `\n   💡 Did you mean one of these?`));
        files.slice(0, 5).forEach(f => {
          console.log(colorize('gray', `      ${path.join(path.dirname(filePath), f)}`));
        });
      }
    }
    console.log();
    process.exit(1);
  }

  console.log(colorize('blue', `\n🔍 Checking ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const doc = parse(source);
    const diagnostics = analyze(doc);

    // Show concepts found
    console.log(colorize('bold', `📦 Found ${doc.concepts.length} concept${doc.concepts.length === 1 ? '' : 's'}:`));
    for (const concept of doc.concepts) {
      console.log(`   ${colorize('cyan', '@' + concept.name)} ${colorize('gray', `(line ${concept.location.range.start.line})`)}`);
    }

    // Separate by severity
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    const infos = diagnostics.filter(d => d.severity === 'info');

    if (diagnostics.length > 0) {
      console.log();
      
      if (errors.length > 0) {
        console.log(colorize('red', colorize('bold', `\n🚫 Errors (${errors.length}):`)));
        errors.forEach(d => printDiagnostic(d, filePath));
      }

      if (warnings.length > 0) {
        console.log(colorize('yellow', colorize('bold', `\n⚠️  Warnings (${warnings.length}):`)));
        warnings.forEach(d => printDiagnostic(d, filePath));
      }

      if (infos.length > 0) {
        console.log(colorize('blue', colorize('bold', `\nℹ️  Info (${infos.length}):`)));
        infos.forEach(d => printDiagnostic(d, filePath));
      }
      
      console.log();
    }

    // Print summary
    printSummary(errors.length, warnings.length, infos.length);

    if (errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(colorize('red', `\n❌ Parse error: ${error instanceof Error ? error.message : String(error)}`));
    console.log(colorize('gray', '\n   💡 Tip: Check that your .nl file has valid syntax'));
    console.log(colorize('gray', '      Concepts should start with @ followed by a PascalCase name\n'));
    process.exit(1);
  }
}

async function commandBuild(args: string[]): Promise<void> {
  const filePath = args[0];
  let outputDir = 'output';

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '-o' || args[i] === '--output') {
      outputDir = args[i + 1];
      i++;
    }
  }

  if (!filePath) {
    console.error(colorize('red', '\n❌ Error: No file specified\n'));
    console.log('Usage: ' + colorize('cyan', 'natural build <file> [-o <output-dir>]'));
    console.log('\nExamples:');
    console.log(colorize('gray', '  natural build app.nl'));
    console.log(colorize('gray', '  natural build app.nl -o dist\n'));
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedOutputDir = path.resolve(outputDir);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `\n❌ Error: File not found: ${filePath}`));
    console.log(colorize('gray', `\n   Looked for: ${resolvedPath}\n`));
    process.exit(1);
  }

  console.log(colorize('blue', `\n🔨 Building ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const result = await compile(source);

    // Check for errors
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    const warnings = result.diagnostics.filter(d => d.severity === 'warning');
    const infos = result.diagnostics.filter(d => d.severity === 'info');
    
    if (errors.length > 0) {
      console.log(colorize('red', colorize('bold', '🚫 Build failed with errors:\n')));
      errors.forEach(d => printDiagnostic(d, filePath));
      console.log();
      printSummary(errors.length, warnings.length, infos.length);
      process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(resolvedOutputDir)) {
      fs.mkdirSync(resolvedOutputDir, { recursive: true });
    }

    // Write generated files
    let filesWritten = 0;
    console.log(colorize('bold', '📁 Generated files:'));
    for (const [filePath, content] of result.files) {
      const fullPath = path.join(resolvedOutputDir, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(colorize('green', `   ✓ ${filePath}`));
      filesWritten++;
    }

    console.log();

    // Print warnings/info
    if (warnings.length > 0) {
      console.log(colorize('yellow', colorize('bold', '⚠️  Warnings:')));
      warnings.forEach(d => printDiagnostic(d, filePath));
      console.log();
    }

    if (infos.length > 0) {
      infos.forEach(d => printDiagnostic(d, filePath));
      console.log();
    }

    // Success summary
    console.log(colorize('dim', '─'.repeat(50)));
    console.log(colorize('green', `\n✨ Build complete! Generated ${filesWritten} file${filesWritten === 1 ? '' : 's'}`));
    
    if (warnings.length > 0) {
      console.log(colorize('yellow', `   (with ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`));
    }
    
    console.log('\n📋 Next steps:');
    console.log(colorize('cyan', `   1. cd ${outputDir}`));
    console.log(colorize('cyan', '   2. npm install'));
    console.log(colorize('cyan', '   3. npm run dev\n'));

  } catch (error) {
    console.error(colorize('red', `\n❌ Build error: ${error instanceof Error ? error.message : String(error)}`));
    console.log(colorize('gray', '\n   💡 Tip: Run "natural check <file>" first to validate your .nl file\n'));
    process.exit(1);
  }
}

async function commandExplain(args: string[]): Promise<void> {
  const filePath = args[0];

  if (!filePath) {
    console.error(colorize('red', '\n❌ Error: No file specified\n'));
    console.log('Usage: ' + colorize('cyan', 'natural explain <file>\n'));
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `\n❌ Error: File not found: ${filePath}\n`));
    process.exit(1);
  }

  console.log(colorize('blue', `\n📖 Explaining ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const doc = parse(source);
    const definitions = getDefinitions(doc);
    const references = getReferences(doc);

    console.log(colorize('bold', '═══════════════════════════════════════════════'));
    console.log(colorize('bold', ' Document Structure'));
    console.log(colorize('bold', '═══════════════════════════════════════════════\n'));

    console.log(colorize('cyan', `📦 Concepts (${doc.concepts.length}):`));
    for (const concept of doc.concepts) {
      console.log(`\n   ${colorize('bold', '@' + concept.name)}`);
      console.log(colorize('gray', `   └─ Line ${concept.location.range.start.line} · ${concept.prose.length} prose block${concept.prose.length === 1 ? '' : 's'}`));

      // Show first line of prose
      if (concept.prose.length > 0) {
        const firstLine = concept.prose[0].text.split('\n')[0];
        const truncated = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
        console.log(colorize('gray', `      "${truncated}"`));
      }
    }

    // Show references
    if (references.size > 0) {
      console.log(colorize('cyan', `\n\n🔗 Concept References:`));
      for (const [conceptName, refs] of references) {
        if (refs.length > 0) {
          const lines = refs.map(r => r.location.range.start.line).join(', ');
          console.log(`   ${colorize('bold', '@' + conceptName)} → referenced ${refs.length}x ${colorize('gray', `(lines: ${lines})`)}`);
        }
      }
    }

    // Show what the compiler understands
    console.log(colorize('bold', '\n\n═══════════════════════════════════════════════'));
    console.log(colorize('bold', ' Compiler Understanding'));
    console.log(colorize('bold', '═══════════════════════════════════════════════\n'));
    
    console.log(colorize('yellow', '⚡ Note: Analysis uses heuristics. Set OPENAI_API_KEY'));
    console.log(colorize('yellow', '   for AI-powered semantic understanding.\n'));

    // Compile to see what it generates
    const result = await compile(source);
    
    console.log(colorize('cyan', `📁 Would generate ${result.files.size} file${result.files.size === 1 ? '' : 's'}:`));
    for (const [filePath, _] of result.files) {
      console.log(colorize('gray', `   - ${filePath}`));
    }

    console.log();

  } catch (error) {
    console.error(colorize('red', `\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(colorize('bold', '\n🌿 Natural Language CLI\n'));
  console.log('Compile natural language descriptions into working code.\n');
  console.log(colorize('bold', 'Usage:') + ' natural <command> [options]\n');
  console.log(colorize('bold', 'Commands:'));
  console.log(`  ${colorize('cyan', 'init [dir]')}            Create a new Natural project`);
  console.log(`  ${colorize('cyan', 'check <file>')}          Parse and validate a .nl file`);
  console.log(`  ${colorize('cyan', 'build <file>')}          Compile .nl to TypeScript`);
  console.log(`    ${colorize('gray', '-o, --output <dir>')}   Output directory (default: output)`);
  console.log(`  ${colorize('cyan', 'explain <file>')}        Show what the compiler understands`);
  console.log(`  ${colorize('cyan', 'help')}                  Show this help message\n`);
  console.log(colorize('bold', 'Examples:'));
  console.log(colorize('gray', '  $ natural init my-project'));
  console.log(colorize('gray', '  $ natural check app.nl'));
  console.log(colorize('gray', '  $ natural build app.nl -o dist'));
  console.log(colorize('gray', '  $ natural explain app.nl\n'));
  console.log(colorize('bold', 'Learn more:'));
  console.log(colorize('gray', '  https://github.com/offloadmywork/natural-lang\n'));
}

// Main CLI entry point
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

(async () => {
  switch (command) {
    case 'init':
      commandInit(args.slice(1));
      break;
    case 'check':
      commandCheck(args.slice(1));
      break;
    case 'build':
      await commandBuild(args.slice(1));
      break;
    case 'explain':
      await commandExplain(args.slice(1));
      break;
    default:
      console.error(colorize('red', `\n❌ Unknown command: ${command}`));
      
      // Suggest similar commands
      const validCommands = ['init', 'check', 'build', 'explain', 'help'];
      const suggestions = validCommands.filter(cmd => {
        // Simple similarity check
        return cmd.startsWith(command[0]) || command.includes(cmd.substring(0, 3));
      });
      
      if (suggestions.length > 0) {
        console.log(colorize('cyan', `\n   🤔 Did you mean: ${suggestions.join(', ')}?`));
      }
      
      console.log(colorize('gray', '\n   Run "natural help" for a list of commands\n'));
      process.exit(1);
  }
})();
