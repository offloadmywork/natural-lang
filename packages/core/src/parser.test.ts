import { describe, it, expect } from 'vitest';
import { parse } from './parser.js';

describe('Parser', () => {
  it('should parse a simple concept definition', () => {
    const source = `@Task
A task has a unique ID, title, and description.`;

    const doc = parse(source);

    expect(doc.type).toBe('NaturalDocument');
    expect(doc.concepts).toHaveLength(1);
    expect(doc.concepts[0].name).toBe('Task');
    expect(doc.concepts[0].prose).toHaveLength(1);
    expect(doc.concepts[0].prose[0].text).toBe('A task has a unique ID, title, and description.');
  });

  it('should parse multiple concept definitions', () => {
    const source = `@Task
A task has a unique ID.

@TaskList
A task list contains multiple tasks.`;

    const doc = parse(source);

    expect(doc.concepts).toHaveLength(2);
    expect(doc.concepts[0].name).toBe('Task');
    expect(doc.concepts[1].name).toBe('TaskList');
  });

  it('should parse multi-line prose', () => {
    const source = `@Task
Line one.
Line two.
Line three.`;

    const doc = parse(source);

    expect(doc.concepts[0].prose[0].text).toContain('Line one.');
    expect(doc.concepts[0].prose[0].text).toContain('Line two.');
    expect(doc.concepts[0].prose[0].text).toContain('Line three.');
  });

  it('should detect concept references in prose', () => {
    const source = `@TaskList
A list contains multiple @Task items.
Each @Task has an ID.`;

    const doc = parse(source);

    const prose = doc.concepts[0].prose[0];
    expect(prose.references).toHaveLength(2);
    expect(prose.references[0].name).toBe('Task');
    expect(prose.references[1].name).toBe('Task');
  });

  it('should handle empty concepts', () => {
    const source = `@EmptyConcept

@AnotherConcept
With some text.`;

    const doc = parse(source);

    expect(doc.concepts).toHaveLength(2);
    expect(doc.concepts[0].name).toBe('EmptyConcept');
    expect(doc.concepts[0].prose).toHaveLength(0);
    expect(doc.concepts[1].name).toBe('AnotherConcept');
    expect(doc.concepts[1].prose).toHaveLength(1);
  });

  it('should parse the todo-app example', () => {
    const source = `@Task
A task has a unique ID, title, description, and completion status.
The ID is auto-generated when a task is created.

@TaskList
A task list contains multiple @Task items.
Each @Task can be modified.

@CreateTask
Users can create a new @Task by providing a title.
The system generates a unique ID.`;

    const doc = parse(source);

    expect(doc.concepts).toHaveLength(3);
    expect(doc.concepts[0].name).toBe('Task');
    expect(doc.concepts[1].name).toBe('TaskList');
    expect(doc.concepts[2].name).toBe('CreateTask');

    // Check TaskList references Task
    const taskListProse = doc.concepts[1].prose[0];
    const taskRefs = taskListProse.references.filter(ref => ref.name === 'Task');
    expect(taskRefs.length).toBeGreaterThan(0);
  });

  it('should preserve source locations', () => {
    const source = `@Task
A task has an ID.`;

    const doc = parse(source);
    const concept = doc.concepts[0];

    expect(concept.location.range.start.line).toBe(1);
    expect(concept.location.range.start.column).toBe(1);
    expect(concept.location.range.start.offset).toBe(0);
  });
});
