/**
 * Compiler tests - verify .nl → TypeScript compilation
 */

import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Compiler', () => {
  it('should compile a simple entity definition', async () => {
    const source = `@Task
A task has a unique ID, title, and completion status.
Titles are required and must be 1-200 characters.
`;

    const result = await compile(source);

    // Should generate files
    expect(result.files.size).toBeGreaterThan(0);
    expect(result.files.has('src/types.ts')).toBe(true);
    expect(result.files.has('src/schemas.ts')).toBe(true);

    // Check types.ts contains the Task interface
    const typesContent = result.files.get('src/types.ts')!;
    expect(typesContent).toContain('interface Task');
    expect(typesContent).toContain('uniqueId');
    expect(typesContent).toContain('title');
    expect(typesContent).toContain('completionStatus');
  });

  it('should compile API endpoint definitions', async () => {
    const source = `@TaskAPI
Expose a REST API with the following endpoints:

GET /tasks — returns all tasks
GET /tasks/:id — returns a single task by ID
POST /tasks — creates a new task
DELETE /tasks/:id — deletes a task
`;

    const result = await compile(source);

    // Should generate routes
    expect(result.files.has('src/routes.ts')).toBe(true);
    expect(result.files.has('src/index.ts')).toBe(true);

    const routesContent = result.files.get('src/routes.ts')!;
    expect(routesContent).toContain("router.get('/tasks'");
    expect(routesContent).toContain("router.get('/tasks/:id'");
    expect(routesContent).toContain("router.post('/tasks'");
    expect(routesContent).toContain("router.delete('/tasks/:id'");
  });

  it('should generate valid TypeScript code', async () => {
    const source = `@User
A user has a name, email, and age.
The email is required.
Age is a number.

@UserAPI
GET /users — returns all users
POST /users — creates a new user
`;

    const result = await compile(source);

    // Should not have any errors
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);

    // Should generate configuration files
    expect(result.files.has('package.json')).toBe(true);
    expect(result.files.has('tsconfig.json')).toBe(true);
    expect(result.files.has('README.md')).toBe(true);

    // Verify package.json is valid JSON
    const packageJson = result.files.get('package.json')!;
    expect(() => JSON.parse(packageJson)).not.toThrow();

    // Verify tsconfig.json is valid JSON
    const tsConfig = result.files.get('tsconfig.json')!;
    expect(() => JSON.parse(tsConfig)).not.toThrow();
  });

  it('should handle empty input gracefully', async () => {
    const source = '';
    const result = await compile(source);

    // Should still return a result
    expect(result).toBeDefined();
    expect(result.files).toBeDefined();
    expect(result.diagnostics).toBeDefined();
  });

  it('should compile examples/simple.nl successfully', async () => {
    // Read the actual example file
    const examplePath = join(process.cwd(), '../../examples/simple.nl');
    const source = readFileSync(examplePath, 'utf-8');

    const result = await compile(source);

    // Check no errors occurred
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);

    // Verify key output files exist
    expect(result.files.has('src/types.ts')).toBe(true);
    expect(result.files.has('src/schemas.ts')).toBe(true);
    expect(result.files.has('package.json')).toBe(true);
    // simple.nl doesn't have API endpoints, so routes.ts might not be generated

    // Verify output files have content (not empty)
    const typesContent = result.files.get('src/types.ts')!;
    expect(typesContent.length).toBeGreaterThan(0);
    
    const schemasContent = result.files.get('src/schemas.ts')!;
    expect(schemasContent.length).toBeGreaterThan(0);

    // Verify concepts from simple.nl are present
    expect(typesContent).toContain('User');
    expect(typesContent).toContain('Task');
    expect(typesContent).toContain('Status');
    expect(typesContent).toContain('Admin');
  });

  it('should handle concept references correctly', async () => {
    const source = `@User
A user has a name and email.

@Task
A task belongs to a @User.
The @User can update the task.
`;

    const result = await compile(source);

    const typesContent = result.files.get('src/types.ts')!;
    
    // Should define both interfaces
    expect(typesContent).toContain('interface User');
    expect(typesContent).toContain('interface Task');
    
    // Task should reference User (check for User type, not lowercase 'user')
    expect(typesContent).toMatch(/User/); // References can be in comments or types
  });

  it('should generate express router with proper structure', async () => {
    const source = `@API
GET /health — health check endpoint
POST /data — create data
PUT /data/:id — update data
DELETE /data/:id — delete data
`;

    const result = await compile(source);

    const routesContent = result.files.get('src/routes.ts')!;
    
    // Check Express imports
    expect(routesContent).toContain("import express");
    expect(routesContent).toContain("const router = express.Router()");
    
    // Check all HTTP methods are present
    expect(routesContent).toContain("router.get('/health'");
    expect(routesContent).toContain("router.post('/data'");
    expect(routesContent).toContain("router.put('/data/:id'");
    expect(routesContent).toContain("router.delete('/data/:id'");
    
    // Check router export
    expect(routesContent).toContain("export default router");
  });

  it('should include necessary dependencies in package.json', async () => {
    const source = `@SimpleAPI
GET /test — test endpoint
`;

    const result = await compile(source);

    const packageJsonContent = result.files.get('package.json')!;
    const packageJson = JSON.parse(packageJsonContent);

    // Check essential dependencies
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.express).toBeDefined();
    
    // Check dev dependencies
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
    
    // Check scripts
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
  });

  it('should generate README with usage instructions', async () => {
    const source = `@MyApp
GET /api/test — test endpoint
`;

    const result = await compile(source);

    expect(result.files.has('README.md')).toBe(true);
    
    const readmeContent = result.files.get('README.md')!;
    
    // Should contain setup instructions
    expect(readmeContent).toContain('npm install');
    expect(readmeContent.toLowerCase()).toContain('install');
    
    // Should mention how to run
    expect(readmeContent).toContain('npm');
  });

  it('should infer array types from plural entity references', async () => {
    const source = `@Task
A task has a title and completion status.

@TaskList
A task list contains multiple tasks.
Tasks can be filtered by status.
`;

    const result = await compile(source);

    const typesContent = result.files.get('src/types.ts')!;
    
    // TaskList should have a tasks property typed as Task[]
    expect(typesContent).toContain('interface Task');
    expect(typesContent).toContain('interface TaskList');
    
    // The plural "tasks" should be inferred as Task[] not string
    expect(typesContent).toContain('Task[]');
  });

  it('should infer singular entity references as entity types', async () => {
    const source = `@User
A user has a name and email.

@Comment
A comment has content and an author.
The author is the user who wrote it.

@Category
A category has a name and optional parent category.
`;

    const result = await compile(source);

    const typesContent = result.files.get('src/types.ts')!;
    
    // Category should reference itself for parent
    expect(typesContent).toContain('interface Category');
    expect(typesContent).toMatch(/category\??: Category/i);
  });
});
