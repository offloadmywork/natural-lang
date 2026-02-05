import { describe, it, expect } from 'vitest';
import { parse } from './parser.js';
import { analyze, getDefinitions, getReferences } from './analyzer.js';

describe('Analyzer', () => {
  it('should find all concept definitions', () => {
    const source = `@Task
A task.

@TaskList
A list.

@CreateTask
Create a task.`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    expect(definitions.size).toBe(3);
    expect(definitions.has('Task')).toBe(true);
    expect(definitions.has('TaskList')).toBe(true);
    expect(definitions.has('CreateTask')).toBe(true);
  });

  it('should find all concept references', () => {
    const source = `@TaskList
A list contains @Task items.
Each @Task has properties.

@CreateTask
Creates a new @Task.`;

    const doc = parse(source);
    const references = getReferences(doc);

    expect(references.has('Task')).toBe(true);
    expect(references.get('Task')!.length).toBe(3);
  });

  it('should detect undefined references', () => {
    const source = `@TaskList
A list contains @Task items.
Uses @User for ownership.`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    const undefinedErrors = diagnostics.filter(d => d.code === 'undefined-reference');
    expect(undefinedErrors.length).toBe(2); // @Task and @User

    const taskError = undefinedErrors.find(d => d.message.includes('@Task'));
    expect(taskError).toBeDefined();
    expect(taskError!.severity).toBe('error');

    const userError = undefinedErrors.find(d => d.message.includes('@User'));
    expect(userError).toBeDefined();
    expect(userError!.severity).toBe('error');
  });

  it('should detect unused concepts', () => {
    const source = `@Task
A task.

@UnusedConcept
Never referenced.

@TaskList
Contains @Task items.`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    const unusedWarnings = diagnostics.filter(d => d.code === 'unused-concept');
    expect(unusedWarnings.length).toBe(2); // UnusedConcept and TaskList

    const unusedWarning = unusedWarnings.find(d => d.message.includes('@UnusedConcept'));
    expect(unusedWarning).toBeDefined();
    expect(unusedWarning!.severity).toBe('warning');
  });

  it('should detect duplicate definitions', () => {
    const source = `@Task
First definition.

@Task
Duplicate definition.`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    const duplicateErrors = diagnostics.filter(d => d.code === 'duplicate-definition');
    expect(duplicateErrors.length).toBe(1);
    expect(duplicateErrors[0].severity).toBe('error');
    expect(duplicateErrors[0].message).toContain('@Task');
  });

  it('should produce no diagnostics for valid document', () => {
    const source = `@Task
A task has an ID.

@TaskList
Contains @Task items.
Uses @CreateTask to add items.

@CreateTask
Creates a @Task in a @TaskList.`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    // All concepts are referenced, no undefined refs, no duplicates
    expect(diagnostics.length).toBe(0);
  });

  it('should analyze the todo-app example correctly', () => {
    const source = `@Task
A task has a unique ID, title, description, and completion status.

@TaskList
A task list contains multiple @Task items.

@CreateTask
Users can create a new @Task.`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    // Should have warnings for TaskList and CreateTask being unused
    // (they're not referenced by other concepts)
    const unusedWarnings = diagnostics.filter(d => d.code === 'unused-concept');
    expect(unusedWarnings.length).toBe(2);

    // No undefined references
    const undefinedErrors = diagnostics.filter(d => d.code === 'undefined-reference');
    expect(undefinedErrors.length).toBe(0);
  });
});
