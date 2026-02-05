/**
 * Compiler tests
 */

import { compile } from './compiler.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Compiler', () => {
  it('should compile a simple entity definition', () => {
    const source = `@Task
A task has a unique ID, title, and completion status.
Titles are required and must be 1-200 characters.
`;

    const result = compile(source);

    // Should generate files
    assert.ok(result.files.size > 0, 'Should generate files');
    assert.ok(result.files.has('src/types.ts'), 'Should generate types.ts');
    assert.ok(result.files.has('src/schemas.ts'), 'Should generate schemas.ts');

    // Check types.ts contains the Task interface
    const typesContent = result.files.get('src/types.ts')!;
    assert.ok(typesContent.includes('interface Task'), 'Should define Task interface');
    assert.ok(typesContent.includes('uniqueId'), 'Should have uniqueId property');
    assert.ok(typesContent.includes('title'), 'Should have title property');
    assert.ok(typesContent.includes('completionStatus'), 'Should have completionStatus property');
  });

  it('should compile API endpoint definitions', () => {
    const source = `@TaskAPI
Expose a REST API with the following endpoints:

GET /tasks — returns all tasks
GET /tasks/:id — returns a single task by ID
POST /tasks — creates a new task
DELETE /tasks/:id — deletes a task
`;

    const result = compile(source);

    // Should generate routes
    assert.ok(result.files.has('src/routes.ts'), 'Should generate routes.ts');
    assert.ok(result.files.has('src/index.ts'), 'Should generate index.ts');

    const routesContent = result.files.get('src/routes.ts')!;
    assert.ok(routesContent.includes('router.get(\'/tasks\''), 'Should have GET /tasks route');
    assert.ok(routesContent.includes('router.get(\'/tasks/:id\''), 'Should have GET /tasks/:id route');
    assert.ok(routesContent.includes('router.post(\'/tasks\''), 'Should have POST /tasks route');
    assert.ok(routesContent.includes('router.delete(\'/tasks/:id\''), 'Should have DELETE /tasks/:id route');
  });

  it('should generate valid TypeScript code', () => {
    const source = `@User
A user has a name, email, and age.
The email is required.
Age is a number.

@UserAPI
GET /users — returns all users
POST /users — creates a new user
`;

    const result = compile(source);

    // Should not have any errors
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    assert.strictEqual(errors.length, 0, 'Should not have any errors');

    // Should generate configuration files
    assert.ok(result.files.has('package.json'), 'Should generate package.json');
    assert.ok(result.files.has('tsconfig.json'), 'Should generate tsconfig.json');
    assert.ok(result.files.has('README.md'), 'Should generate README.md');

    // Verify package.json is valid JSON
    const packageJson = result.files.get('package.json')!;
    assert.doesNotThrow(() => JSON.parse(packageJson), 'package.json should be valid JSON');

    // Verify tsconfig.json is valid JSON
    const tsConfig = result.files.get('tsconfig.json')!;
    assert.doesNotThrow(() => JSON.parse(tsConfig), 'tsconfig.json should be valid JSON');
  });

  it('should handle empty input gracefully', () => {
    const source = '';
    const result = compile(source);

    // Should still return a result
    assert.ok(result, 'Should return a result');
    assert.ok(result.files, 'Should have files map');
    assert.ok(result.diagnostics, 'Should have diagnostics array');
  });
});
