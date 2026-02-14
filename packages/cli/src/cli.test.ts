/**
 * CLI tests - verify natural commands work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper to create a unique temp directory for each test
function createTestDir(): string {
  const testDir = join(tmpdir(), `natural-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to run CLI command
function runCLI(args: string[], cwd?: string): { stdout: string; stderr: string; status: number } {
  // Use the compiled CLI from ../dist/cli.js
  const cliPath = join(__dirname, '../dist/cli.js');
  const result = spawnSync('node', [cliPath, ...args], {
    cwd: cwd || process.cwd(),
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' } // Disable colors for easier testing
  });
  
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status || 0
  };
}

describe('CLI - help', () => {
  it('should show help when no command is given', () => {
    const result = runCLI([]);
    
    expect(result.stdout).toContain('Natural Language CLI');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('init');
    expect(result.stdout).toContain('check');
    expect(result.stdout).toContain('build');
    expect(result.stdout).toContain('explain');
  });

  it('should show help with --help flag', () => {
    const result = runCLI(['--help']);
    
    expect(result.stdout).toContain('Natural Language CLI');
    expect(result.stdout).toContain('Commands:');
  });

  it('should show help with help command', () => {
    const result = runCLI(['help']);
    
    expect(result.stdout).toContain('Natural Language CLI');
    expect(result.stdout).toContain('Examples:');
  });
});

describe('CLI - check', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should successfully check a valid .nl file', () => {
    const nlFile = join(testDir, 'test.nl');
    writeFileSync(nlFile, `@Task
A task has a title and status.

@User
A user can create tasks.
`);

    const result = runCLI(['check', nlFile], testDir);
    
    expect(result.stdout).toContain('Checking test.nl');
    expect(result.stdout).toContain('Found 2 concepts');
    expect(result.stdout).toContain('@Task');
    expect(result.stdout).toContain('@User');
    expect(result.status).toBe(0);
  });

  it('should report errors for undefined concept references', () => {
    const nlFile = join(testDir, 'test.nl');
    writeFileSync(nlFile, `@Task
A task references an @UndefinedConcept.
`);

    const result = runCLI(['check', nlFile], testDir);
    
    expect(result.stdout).toContain('UndefinedConcept');
    // Analyzer should detect undefined reference
    expect(result.status).toBe(1);
  });

  it('should fail when file does not exist', () => {
    const result = runCLI(['check', 'nonexistent.nl'], testDir);
    
    expect(result.stderr).toContain('File not found');
    expect(result.status).toBe(1);
  });

  it('should fail when no file is specified', () => {
    const result = runCLI(['check'], testDir);
    
    expect(result.stderr).toContain('No file specified');
    expect(result.status).toBe(1);
  });

  it('should check examples/simple.nl successfully', () => {
    const examplePath = join(process.cwd(), '../../examples/simple.nl');
    const result = runCLI(['check', examplePath]);
    
    expect(result.stdout).toContain('Checking simple.nl');
    expect(result.stdout).toContain('@User');
    expect(result.stdout).toContain('@Task');
    expect(result.stdout).toContain('@Status');
    expect(result.stdout).toContain('@Admin');
  });
});

describe('CLI - build', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should build a simple .nl file', () => {
    const nlFile = join(testDir, 'app.nl');
    writeFileSync(nlFile, `@Task
A task has a title and description.

@TaskAPI
GET /tasks — list all tasks
POST /tasks — create a task
`);

    const outputDir = join(testDir, 'output');
    const result = runCLI(['build', nlFile, '-o', outputDir], testDir);
    
    expect(result.stdout).toContain('Building app.nl');
    expect(result.stdout).toContain('Build complete');
    expect(result.status).toBe(0);

    // Verify output files were created
    expect(existsSync(join(outputDir, 'src/types.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'src/schemas.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'src/routes.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'package.json'))).toBe(true);
  });

  it('should use default output directory when not specified', () => {
    const nlFile = join(testDir, 'app.nl');
    writeFileSync(nlFile, `@Simple
A simple concept.
`);

    const result = runCLI(['build', nlFile], testDir);
    
    expect(result.status).toBe(0);

    // Should create 'output' directory by default
    expect(existsSync(join(testDir, 'output'))).toBe(true);
  });

  it('should fail when file does not exist', () => {
    const result = runCLI(['build', 'nonexistent.nl'], testDir);
    
    expect(result.stderr).toContain('File not found');
    expect(result.status).toBe(1);
  });

  it('should fail when no file is specified', () => {
    const result = runCLI(['build'], testDir);
    
    expect(result.stderr).toContain('No file specified');
    expect(result.status).toBe(1);
  });

  it('should build examples/simple.nl successfully', () => {
    const examplePath = join(process.cwd(), '../../examples/simple.nl');
    const outputDir = join(testDir, 'build-output');
    
    const result = runCLI(['build', examplePath, '-o', outputDir], testDir);
    
    expect(result.stdout).toContain('Building simple.nl');
    expect(result.status).toBe(0);

    // Verify generated files have expected content
    const typesContent = readFileSync(join(outputDir, 'src/types.ts'), 'utf-8');
    expect(typesContent).toContain('interface User');
    expect(typesContent).toContain('interface Task');
    expect(typesContent).toContain('interface Status');
  });
});

describe('CLI - init', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should initialize a new project', () => {
    const projectDir = join(testDir, 'my-project');
    const result = runCLI(['init', projectDir], testDir);
    
    expect(result.stdout).toContain('Initializing Natural project');
    expect(result.stdout).toContain('Created natural.config.json');
    expect(result.stdout).toContain('Created example.nl');
    expect(result.status).toBe(0);

    // Verify files were created
    expect(existsSync(join(projectDir, 'natural.config.json'))).toBe(true);
    expect(existsSync(join(projectDir, 'example.nl'))).toBe(true);

    // Verify config is valid JSON
    const config = JSON.parse(readFileSync(join(projectDir, 'natural.config.json'), 'utf-8'));
    expect(config.version).toBe('0.1.0');
    expect(config.target).toBe('typescript');
  });

  it('should initialize in current directory when no path given', () => {
    const result = runCLI(['init'], testDir);
    
    expect(result.status).toBe(0);
    expect(existsSync(join(testDir, 'natural.config.json'))).toBe(true);
    expect(existsSync(join(testDir, 'example.nl'))).toBe(true);
  });
});

describe('CLI - explain', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should explain a .nl file', () => {
    const nlFile = join(testDir, 'test.nl');
    writeFileSync(nlFile, `@User
A user has a name.

@Task
A task belongs to a @User.
`);

    const result = runCLI(['explain', nlFile], testDir);
    
    expect(result.stdout).toContain('Explaining test.nl');
    expect(result.stdout).toContain('Document Structure');
    expect(result.stdout).toContain('@User');
    expect(result.stdout).toContain('@Task');
    expect(result.stdout).toContain('Concept References');
    expect(result.status).toBe(0);
  });

  it('should fail when file does not exist', () => {
    const result = runCLI(['explain', 'nonexistent.nl'], testDir);
    
    expect(result.stderr).toContain('File not found');
    expect(result.status).toBe(1);
  });
});

describe('CLI - unknown command', () => {
  it('should show error for unknown command', () => {
    const result = runCLI(['invalid-command']);
    
    expect(result.stderr).toContain('Unknown command');
    expect(result.status).toBe(1);
  });
});
