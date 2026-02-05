#!/usr/bin/env node

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Diagnostic as LSPDiagnostic,
  DiagnosticSeverity as LSPDiagnosticSeverity,
  Hover,
  Definition,
  Location as LSPLocation,
  CompletionItem,
  CompletionItemKind,
  DocumentSymbol,
  SymbolKind,
  Range as LSPRange,
  Position as LSPPosition,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  parse,
  analyze,
  getDefinitions,
  getReferences,
  NaturalDocument,
  ConceptDefinition,
  ConceptReference,
  Position,
  Range,
} from "@natural-lang/core";

// Create connection
const connection = createConnection(ProposedFeatures.all);

// Create text document manager
const documents = new TextDocuments(TextDocument);

// Cache for parsed documents
const documentCache = new Map<string, NaturalDocument>();

/**
 * Convert core Position to LSP Position (1-indexed → 0-indexed)
 */
function toLSPPosition(pos: Position): LSPPosition {
  return {
    line: pos.line - 1,
    character: pos.column - 1,
  };
}

/**
 * Convert core Range to LSP Range
 */
function toLSPRange(range: Range): LSPRange {
  return {
    start: toLSPPosition(range.start),
    end: toLSPPosition(range.end),
  };
}

/**
 * Parse and cache document
 */
function parseDocument(textDocument: TextDocument): NaturalDocument {
  const text = textDocument.getText();
  const doc = parse(text);
  documentCache.set(textDocument.uri, doc);
  return doc;
}

/**
 * Get cached document or parse
 */
function getCachedDocument(uri: string): NaturalDocument | undefined {
  return documentCache.get(uri);
}

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
      completionProvider: {
        triggerCharacters: ["@"],
      },
    },
  };

  return result;
});

connection.onInitialized(() => {
  connection.console.log("Natural Language Server initialized");
});

/**
 * Validate document and send diagnostics
 */
async function validateDocument(textDocument: TextDocument): Promise<void> {
  const doc = parseDocument(textDocument);
  const diagnostics = analyze(doc);

  // Convert core diagnostics to LSP diagnostics
  const lspDiagnostics: LSPDiagnostic[] = diagnostics.map((diag) => ({
    severity:
      diag.severity === "error"
        ? LSPDiagnosticSeverity.Error
        : diag.severity === "warning"
        ? LSPDiagnosticSeverity.Warning
        : LSPDiagnosticSeverity.Information,
    range: toLSPRange(diag.location.range),
    message: diag.message,
    source: "natural",
    code: diag.code,
  }));

  connection.sendDiagnostics({
    uri: textDocument.uri,
    diagnostics: lspDiagnostics,
  });
}

// Document change handlers
documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

documents.onDidOpen((event) => {
  validateDocument(event.document);
});

documents.onDidClose((event) => {
  documentCache.delete(event.document.uri);
});

/**
 * Find concept at LSP position
 */
function findConceptAtPosition(
  doc: NaturalDocument,
  position: LSPPosition
): { type: "definition" | "reference"; name: string; location: Range } | null {
  const line = position.line + 1; // Convert to 1-indexed
  const column = position.character + 1;

  // Check definitions
  for (const concept of doc.concepts) {
    const range = concept.location.range;
    if (
      line >= range.start.line &&
      line <= range.end.line &&
      column >= range.start.column &&
      column <= range.end.column
    ) {
      // Check if cursor is on the @ConceptName itself (first line of definition)
      if (line === range.start.line) {
        return {
          type: "definition",
          name: concept.name,
          location: range,
        };
      }
    }

    // Check references within prose
    for (const prose of concept.prose) {
      for (const ref of prose.references) {
        const refRange = ref.location.range;
        if (
          line >= refRange.start.line &&
          line <= refRange.end.line &&
          column >= refRange.start.column &&
          column <= refRange.end.column
        ) {
          return {
            type: "reference",
            name: ref.name,
            location: refRange,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Hover provider - show concept definition on hover
 */
connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const doc = getCachedDocument(params.textDocument.uri);
  if (!doc) return null;

  const concept = findConceptAtPosition(doc, params.position);
  if (!concept) return null;

  const definitions = getDefinitions(doc);
  const definition = definitions.get(concept.name);

  if (!definition) {
    return {
      contents: {
        kind: "markdown",
        value: `**@${concept.name}**\n\n_Undefined concept_`,
      },
    };
  }

  // Build hover content from prose
  const proseText = definition.prose.map((p) => p.text).join("\n\n");
  const header =
    concept.type === "definition"
      ? `**@${concept.name}** _(definition)_`
      : `**@${concept.name}** _(reference)_`;

  return {
    contents: {
      kind: "markdown",
      value: `${header}\n\n${proseText}`,
    },
  };
});

/**
 * Go-to-definition provider
 */
connection.onDefinition((params): Definition | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const doc = getCachedDocument(params.textDocument.uri);
  if (!doc) return null;

  const concept = findConceptAtPosition(doc, params.position);
  if (!concept) return null;

  const definitions = getDefinitions(doc);
  const definition = definitions.get(concept.name);

  if (!definition) return null;

  return LSPLocation.create(
    document.uri,
    toLSPRange(definition.location.range)
  );
});

/**
 * Document symbols provider - show outline
 */
connection.onDocumentSymbol((params): DocumentSymbol[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const doc = getCachedDocument(params.textDocument.uri);
  if (!doc) return [];

  const symbols: DocumentSymbol[] = [];

  for (const concept of doc.concepts) {
    const range = toLSPRange(concept.location.range);
    const selectionRange = {
      start: range.start,
      end: {
        line: range.start.line,
        character: range.start.character + concept.name.length + 1, // +1 for @
      },
    };

    symbols.push({
      name: `@${concept.name}`,
      kind: SymbolKind.Class,
      range,
      selectionRange,
      detail: concept.prose[0]?.text.substring(0, 50) || "",
    });
  }

  return symbols;
});

/**
 * Completion provider - suggest concept names when typing @
 */
connection.onCompletion((params): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const doc = getCachedDocument(params.textDocument.uri);
  if (!doc) return [];

  const definitions = getDefinitions(doc);
  const completions: CompletionItem[] = [];

  // Get text before cursor to check if we're after @
  const offset = document.offsetAt(params.position);
  const text = document.getText();
  const beforeCursor = text.substring(Math.max(0, offset - 10), offset);

  // Only provide completions if @ was just typed or we're in a word starting with @
  if (beforeCursor.endsWith("@") || /@\w*$/.test(beforeCursor)) {
    for (const [name, definition] of definitions.entries()) {
      const detail = definition.prose[0]?.text.substring(0, 100) || "";

      completions.push({
        label: `@${name}`,
        kind: CompletionItemKind.Reference,
        detail,
        documentation: definition.prose.map((p) => p.text).join("\n\n"),
        insertText: name, // Don't insert @ if it's already there
      });
    }
  }

  return completions;
});

// Listen on the connection
documents.listen(connection);
connection.listen();
