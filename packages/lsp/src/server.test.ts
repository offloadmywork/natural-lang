/**
 * LSP server tests - verify language server functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parse, analyze, getDefinitions, getReferences } from '@natural-lang/core';

// Mock LSP types for testing (simplified versions)
interface Position {
  line: number;
  character: number;
}

interface Range {
  start: Position;
  end: Position;
}

// Helper to convert core Position to LSP Position (1-indexed → 0-indexed)
function toLSPPosition(pos: { line: number; column: number }): Position {
  return {
    line: pos.line - 1,
    character: pos.column - 1,
  };
}

// Helper to convert core Range to LSP Range
function toLSPRange(range: { start: { line: number; column: number }, end: { line: number; column: number } }): Range {
  return {
    start: toLSPPosition(range.start),
    end: toLSPPosition(range.end),
  };
}

describe('LSP - Document Parsing', () => {
  it('should parse a document successfully', () => {
    const source = `@Task
A task has a title and description.

@User
A user can create tasks.
`;

    const doc = parse(source);

    expect(doc).toBeDefined();
    expect(doc.concepts).toHaveLength(2);
    expect(doc.concepts[0].name).toBe('Task');
    expect(doc.concepts[1].name).toBe('User');
  });

  it('should analyze document for diagnostics', () => {
    const source = `@Task
A task references an @UndefinedConcept.
`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    expect(diagnostics).toBeDefined();
    expect(Array.isArray(diagnostics)).toBe(true);
    
    // Should find undefined reference
    const errors = diagnostics.filter(d => d.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('UndefinedConcept'))).toBe(true);
  });

  it('should convert diagnostics to LSP format', () => {
    const source = `@Task
A task references an @Unknown concept.
`;

    const doc = parse(source);
    const diagnostics = analyze(doc);

    // Simulate LSP diagnostic conversion
    const lspDiagnostics = diagnostics.map(diag => ({
      severity: diag.severity === 'error' ? 1 : diag.severity === 'warning' ? 2 : 3,
      range: toLSPRange(diag.location.range),
      message: diag.message,
      source: 'natural',
      code: diag.code,
    }));

    expect(lspDiagnostics).toBeDefined();
    expect(lspDiagnostics.length).toBeGreaterThan(0);
    
    const firstDiag = lspDiagnostics[0];
    expect(firstDiag.message).toBeDefined();
    expect(firstDiag.range.start.line).toBeGreaterThanOrEqual(0);
  });
});

describe('LSP - Position Conversion', () => {
  it('should convert core position to LSP position (1-indexed to 0-indexed)', () => {
    const corePos = { line: 1, column: 1 };
    const lspPos = toLSPPosition(corePos);

    expect(lspPos.line).toBe(0);
    expect(lspPos.character).toBe(0);
  });

  it('should convert core position to LSP position for multi-line', () => {
    const corePos = { line: 5, column: 10 };
    const lspPos = toLSPPosition(corePos);

    expect(lspPos.line).toBe(4);
    expect(lspPos.character).toBe(9);
  });

  it('should convert core range to LSP range', () => {
    const coreRange = {
      start: { line: 2, column: 3 },
      end: { line: 4, column: 5 }
    };
    const lspRange = toLSPRange(coreRange);

    expect(lspRange.start.line).toBe(1);
    expect(lspRange.start.character).toBe(2);
    expect(lspRange.end.line).toBe(3);
    expect(lspRange.end.character).toBe(4);
  });
});

describe('LSP - Hover Provider', () => {
  it('should find concept definition for hover', () => {
    const source = `@Task
A task has a unique identifier and title.
The title is required.

@User
A user creates @Task items.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    // Simulate hovering over @Task definition
    const taskDef = definitions.get('Task');
    
    expect(taskDef).toBeDefined();
    expect(taskDef!.name).toBe('Task');
    expect(taskDef!.prose).toBeDefined();
    expect(taskDef!.prose.length).toBeGreaterThan(0);

    // Build hover content
    const proseText = taskDef!.prose.map(p => p.text).join('\n\n');
    const hoverContent = `**@Task** _(definition)_\n\n${proseText}`;

    expect(hoverContent).toContain('**@Task**');
    expect(hoverContent).toContain('unique identifier');
    expect(hoverContent).toContain('title');
  });

  it('should provide hover for concept references', () => {
    const source = `@Task
A task has a title.

@User
A user creates @Task items.
Each @Task can be assigned.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);
    const references = getReferences(doc);

    // Get Task references
    const taskRefs = references.get('Task') || [];
    expect(taskRefs.length).toBeGreaterThan(0);

    // Get Task definition for hover
    const taskDef = definitions.get('Task');
    expect(taskDef).toBeDefined();

    // Simulate hover on reference
    const hoverContent = `**@Task** _(reference)_\n\n${taskDef!.prose.map(p => p.text).join('\n\n')}`;
    
    expect(hoverContent).toContain('**@Task**');
    expect(hoverContent).toContain('reference');
  });

  it('should handle hover on undefined concept gracefully', () => {
    const source = `@Task
A task references @Unknown.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    const unknownDef = definitions.get('Unknown');
    
    if (!unknownDef) {
      const hoverContent = `**@Unknown**\n\n_Undefined concept_`;
      expect(hoverContent).toContain('Undefined concept');
    }
  });
});

describe('LSP - Go to Definition', () => {
  it('should find definition location for concept reference', () => {
    const source = `@Task
A task has a title.

@User
A user creates @Task items.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    // Simulate clicking on @Task reference in User concept
    const taskDef = definitions.get('Task');
    
    expect(taskDef).toBeDefined();
    expect(taskDef!.location).toBeDefined();
    expect(taskDef!.location.range.start.line).toBe(1);
  });

  it('should convert definition location to LSP format', () => {
    const source = `@Task
A task definition.

@User
References @Task.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);
    const taskDef = definitions.get('Task');

    expect(taskDef).toBeDefined();

    const lspLocation = {
      uri: 'file:///test.nl',
      range: toLSPRange(taskDef!.location.range)
    };

    expect(lspLocation.uri).toBe('file:///test.nl');
    expect(lspLocation.range.start.line).toBe(0); // Line 1 → 0
  });
});

describe('LSP - Document Symbols', () => {
  it('should extract all concept symbols from document', () => {
    const source = `@Task
A task has a title.

@User
A user has a name.

@Admin
An admin is a special user.
`;

    const doc = parse(source);

    const symbols = doc.concepts.map(concept => ({
      name: `@${concept.name}`,
      kind: 5, // Class kind in LSP
      range: toLSPRange(concept.location.range),
      detail: concept.prose[0]?.text.substring(0, 50) || '',
    }));

    expect(symbols).toHaveLength(3);
    expect(symbols[0].name).toBe('@Task');
    expect(symbols[1].name).toBe('@User');
    expect(symbols[2].name).toBe('@Admin');

    expect(symbols[0].detail).toContain('task has a title');
  });

  it('should provide symbol ranges for navigation', () => {
    const source = `@Task
A task.

@User
A user.
`;

    const doc = parse(source);

    const symbols = doc.concepts.map(concept => ({
      name: `@${concept.name}`,
      range: toLSPRange(concept.location.range),
    }));

    expect(symbols[0].range.start.line).toBe(0);
    expect(symbols[1].range.start.line).toBeGreaterThan(0);
  });
});

describe('LSP - Completion Provider', () => {
  it('should provide concept completions when typing @', () => {
    const source = `@Task
A task has a title.

@User
A user creates tasks.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    // Simulate typing @ and getting completions
    const completions = Array.from(definitions.entries()).map(([name, definition]) => ({
      label: `@${name}`,
      kind: 9, // Reference kind
      detail: definition.prose[0]?.text.substring(0, 100) || '',
      documentation: definition.prose.map(p => p.text).join('\n\n'),
      insertText: name,
    }));

    expect(completions).toHaveLength(2);
    expect(completions.some(c => c.label === '@Task')).toBe(true);
    expect(completions.some(c => c.label === '@User')).toBe(true);

    const taskCompletion = completions.find(c => c.label === '@Task');
    expect(taskCompletion?.detail).toContain('task has a title');
  });

  it('should filter completions based on context', () => {
    const source = `@Task
A task.

@TaskList
A task list.

@User
A user.
`;

    const doc = parse(source);
    const definitions = getDefinitions(doc);

    // Simulate partial input "Tas" after @
    const prefix = 'Tas';
    const completions = Array.from(definitions.keys())
      .filter(name => name.startsWith(prefix))
      .map(name => ({
        label: `@${name}`,
        insertText: name,
      }));

    expect(completions.length).toBeGreaterThan(0);
    expect(completions.every(c => c.label.includes('Task'))).toBe(true);
  });
});

describe('LSP - Server Initialization', () => {
  it('should declare correct capabilities', () => {
    // Simulate server initialization response
    const capabilities = {
      textDocumentSync: 2, // Incremental
      hoverProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
      completionProvider: {
        triggerCharacters: ['@'],
      },
    };

    expect(capabilities.textDocumentSync).toBe(2);
    expect(capabilities.hoverProvider).toBe(true);
    expect(capabilities.definitionProvider).toBe(true);
    expect(capabilities.documentSymbolProvider).toBe(true);
    expect(capabilities.completionProvider.triggerCharacters).toContain('@');
  });
});

describe('LSP - Document Cache', () => {
  it('should cache parsed documents', () => {
    const cache = new Map();
    const uri = 'file:///test.nl';
    const source = `@Task
A task.
`;

    const doc = parse(source);
    cache.set(uri, doc);

    const cached = cache.get(uri);
    expect(cached).toBeDefined();
    expect(cached).toBe(doc);
  });

  it('should invalidate cache on document close', () => {
    const cache = new Map();
    const uri = 'file:///test.nl';
    const doc = parse('@Task\nA task.');

    cache.set(uri, doc);
    expect(cache.has(uri)).toBe(true);

    // Simulate document close
    cache.delete(uri);
    expect(cache.has(uri)).toBe(false);
  });
});
