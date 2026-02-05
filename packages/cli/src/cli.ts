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
  bold: '\x1b[1m',
};

function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printDiagnostic(diagnostic: Diagnostic): void {
  const { severity, message, location } = diagnostic;
  const { line, column } = location.range.start;
  const prefix = `[${line}:${column}]`;

  switch (severity) {
    case 'error':
      console.log(colorize('red', `  ✗ ${prefix} ${message}`));
      break;
    case 'warning':
      console.log(colorize('yellow', `  ⚠ ${prefix} ${message}`));
      break;
    case 'info':
      console.log(colorize('blue', `  ℹ ${prefix} ${message}`));
      break;
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

  console.log('Next steps:');
  console.log(colorize('cyan', '  1. Edit example.nl to describe your application'));
  console.log(colorize('cyan', `  2. Run: ${colorize('bold', 'natural build example.nl')}`));
  console.log(colorize('cyan', '  3. cd output && npm install && npm run dev\n'));
}

function commandCheck(args: string[]): void {
  const filePath = args[0];

  if (!filePath) {
    console.error(colorize('red', 'Error: No file specified'));
    console.log('Usage: natural check <file>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `Error: File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(colorize('blue', `🔍 Checking ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const doc = parse(source);
    const diagnostics = analyze(doc);

    console.log(colorize('bold', `Found ${doc.concepts.length} concept(s):\n`));
    for (const concept of doc.concepts) {
      console.log(`  ${colorize('cyan', '@' + concept.name)}`);
    }
    console.log();

    if (diagnostics.length === 0) {
      console.log(colorize('green', '✓ No issues found\n'));
      process.exit(0);
    }

    // Separate by severity
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    const infos = diagnostics.filter(d => d.severity === 'info');

    if (errors.length > 0) {
      console.log(colorize('red', `Errors (${errors.length}):`));
      errors.forEach(printDiagnostic);
      console.log();
    }

    if (warnings.length > 0) {
      console.log(colorize('yellow', `Warnings (${warnings.length}):`));
      warnings.forEach(printDiagnostic);
      console.log();
    }

    if (infos.length > 0) {
      console.log(colorize('blue', `Info (${infos.length}):`));
      infos.forEach(printDiagnostic);
      console.log();
    }

    if (errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(colorize('red', `Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

function commandBuild(args: string[]): void {
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
    console.error(colorize('red', 'Error: No file specified'));
    console.log('Usage: natural build <file> [-o <output-dir>]');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedOutputDir = path.resolve(outputDir);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `Error: File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(colorize('blue', `🔨 Building ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const result = compile(source);

    // Check for errors
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    if (errors.length > 0) {
      console.log(colorize('red', 'Build failed with errors:\n'));
      errors.forEach(printDiagnostic);
      console.log();
      process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(resolvedOutputDir)) {
      fs.mkdirSync(resolvedOutputDir, { recursive: true });
    }

    // Write generated files
    let filesWritten = 0;
    for (const [filePath, content] of result.files) {
      const fullPath = path.join(resolvedOutputDir, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(colorize('green', `  ✓ ${filePath}`));
      filesWritten++;
    }

    console.log();

    // Print warnings/info
    const warnings = result.diagnostics.filter(d => d.severity === 'warning');
    const infos = result.diagnostics.filter(d => d.severity === 'info');

    if (warnings.length > 0) {
      console.log(colorize('yellow', 'Warnings:'));
      warnings.forEach(printDiagnostic);
      console.log();
    }

    if (infos.length > 0) {
      infos.forEach(printDiagnostic);
      console.log();
    }

    console.log(colorize('green', `✓ Build complete! Generated ${filesWritten} file(s)\n`));
    console.log('Next steps:');
    console.log(colorize('cyan', `  1. cd ${outputDir}`));
    console.log(colorize('cyan', '  2. npm install'));
    console.log(colorize('cyan', '  3. npm run dev\n'));

  } catch (error) {
    console.error(colorize('red', `Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

function commandExplain(args: string[]): void {
  const filePath = args[0];

  if (!filePath) {
    console.error(colorize('red', 'Error: No file specified'));
    console.log('Usage: natural explain <file>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(colorize('red', `Error: File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(colorize('blue', `📖 Explaining ${path.basename(filePath)}...\n`));

  try {
    const source = fs.readFileSync(resolvedPath, 'utf-8');
    const doc = parse(source);
    const definitions = getDefinitions(doc);
    const references = getReferences(doc);

    console.log(colorize('bold', '=== Document Structure ===\n'));

    console.log(colorize('cyan', `Concepts (${doc.concepts.length}):`));
    for (const concept of doc.concepts) {
      console.log(`\n  ${colorize('bold', '@' + concept.name)}`);
      console.log(`    Location: Line ${concept.location.range.start.line}`);
      console.log(`    Prose blocks: ${concept.prose.length}`);

      // Show first line of prose
      if (concept.prose.length > 0) {
        const firstLine = concept.prose[0].text.split('\n')[0];
        console.log(`    Description: ${firstLine.substring(0, 80)}${firstLine.length > 80 ? '...' : ''}`);
      }
    }

    console.log();

    // Show references
    if (references.size > 0) {
      console.log(colorize('cyan', `\nConcept References:`));
      for (const [conceptName, refs] of references) {
        if (refs.length > 0) {
          console.log(`\n  ${colorize('bold', '@' + conceptName)} is referenced ${refs.length} time(s):`);
          for (const ref of refs) {
            console.log(`    - Line ${ref.location.range.start.line}`);
          }
        }
      }
    }

    console.log();

    // Show what the compiler understands
    console.log(colorize('bold', '\n=== Compiler Understanding ===\n'));
    console.log(colorize('yellow', 'Note: This is template-based analysis using heuristics.'));
    console.log(colorize('yellow', 'Future versions will use LLM for deeper understanding.\n'));

    // Compile to see what it generates
    const result = compile(source);
    
    console.log(colorize('cyan', `Generated files (${result.files.size}):`));
    for (const [filePath, _] of result.files) {
      console.log(`  - ${filePath}`);
    }

    console.log();

  } catch (error) {
    console.error(colorize('red', `Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(colorize('bold', 'Natural Language CLI\n'));
  console.log('Usage: natural <command> [options]\n');
  console.log('Commands:');
  console.log(`  ${colorize('cyan', 'init [dir]')}          Create a new Natural project`);
  console.log(`  ${colorize('cyan', 'check <file>')}        Parse and validate a .nl file`);
  console.log(`  ${colorize('cyan', 'build <file>')}        Compile .nl to TypeScript`);
  console.log(`    ${colorize('yellow', '-o, --output <dir>')}  Output directory (default: output)`);
  console.log(`  ${colorize('cyan', 'explain <file>')}      Show what the compiler understands`);
  console.log(`  ${colorize('cyan', 'help')}                Show this help message\n`);
  console.log('Examples:');
  console.log(`  natural init my-project`);
  console.log(`  natural check app.nl`);
  console.log(`  natural build app.nl -o dist`);
  console.log(`  natural explain app.nl\n`);
}

// Main CLI entry point
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

switch (command) {
  case 'init':
    commandInit(args.slice(1));
    break;
  case 'check':
    commandCheck(args.slice(1));
    break;
  case 'build':
    commandBuild(args.slice(1));
    break;
  case 'explain':
    commandExplain(args.slice(1));
    break;
  default:
    console.error(colorize('red', `Unknown command: ${command}\n`));
    printHelp();
    process.exit(1);
}
