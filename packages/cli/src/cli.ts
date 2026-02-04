#!/usr/bin/env node
/**
 * Natural Language CLI
 */

import { Command } from 'commander';
import { createCompiler } from '@natural-lang/compiler';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const program = new Command();

program
  .name('natural')
  .description('Natural language programming toolchain')
  .version('0.1.0');

// Init command
program
  .command('init [dir]')
  .description('Create a new Natural project with example.nl')
  .action((dir = '.') => {
    const targetDir = path.resolve(dir);
    
    console.log(chalk.blue('🚀 Initializing Natural project...\n'));

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Create example.nl
    const exampleNl = path.join(targetDir, 'example.nl');
    const exampleContent = `@Task
A task has a unique ID, title, and completion status.
Tasks start as incomplete by default.

@TaskList
A task list displays all tasks.
Users can filter by completion status.

@CreateTask
Users can create a new task by providing a title.
The system generates a unique ID.

@CompleteTask
Users can mark a task as complete.

@WebInterface
Provide a simple web UI that displays the task list and allows users to:
- See all tasks
- Add a new task
- Mark tasks as complete
- Delete tasks
`;

    fs.writeFileSync(exampleNl, exampleContent, 'utf-8');

    console.log(chalk.green('✓'), 'Created example.nl');
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan('  1.'), 'Edit example.nl to describe your app');
    console.log(chalk.cyan('  2.'), `Run: ${chalk.bold('natural build example.nl')}`);
    console.log(chalk.cyan('  3.'), `cd output && npm install && npm run dev`);
    console.log();
  });

// Check command
program
  .command('check <file>')
  .description('Parse and validate a .nl file without compiling')
  .action((file) => {
    const filePath = path.resolve(file);
    
    console.log(chalk.blue('🔍 Checking'), chalk.bold(file), '\n');

    const compiler = createCompiler();
    const result = compiler.check(filePath);

    if (result.success) {
      console.log();
      console.log(chalk.green('✓ No errors found'));
    } else {
      console.log();
      console.log(chalk.red('✗ Errors:'));
      result.errors.forEach((err) => {
        console.log(chalk.red('  -'), err);
      });
      process.exit(1);
    }
  });

// Build command
program
  .command('build <file>')
  .description('Compile a .nl file to a TypeScript/React application')
  .option('-o, --output <dir>', 'Output directory', 'output')
  .option('-m, --model <model>', 'LLM model to use', 'anthropic/claude-sonnet-4-5')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    const outputDir = path.resolve(options.output);

    console.log(chalk.blue('🔨 Building'), chalk.bold(file));
    console.log(chalk.gray(`   Output: ${outputDir}`));
    console.log(chalk.gray(`   Model: ${options.model}`));
    console.log();

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(chalk.red('❌ Error:'), 'OPENROUTER_API_KEY environment variable not set');
      console.log();
      console.log('Get your API key from:', chalk.cyan('https://openrouter.ai/keys'));
      console.log('Then set it:', chalk.cyan('export OPENROUTER_API_KEY=sk-or-v1-...'));
      process.exit(1);
    }

    const compiler = createCompiler();
    const result = await compiler.compile(filePath, {
      outputDir,
      model: options.model,
      verbose: options.verbose,
    });

    if (!result.success) {
      console.log();
      console.log(chalk.red('❌ Build failed'));
      if (result.errors) {
        result.errors.forEach((err) => {
          console.log(chalk.red('  -'), err);
        });
      }
      process.exit(1);
    }

    console.log();
    console.log(chalk.green('✓ Build complete!'));
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan('  1.'), `cd ${options.output}`);
    console.log(chalk.cyan('  2.'), chalk.bold('npm install'));
    console.log(chalk.cyan('  3.'), chalk.bold('npm run dev'));
    console.log();
  });

program.parse();
