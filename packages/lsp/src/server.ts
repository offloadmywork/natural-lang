#!/usr/bin/env node

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  Definition,
  Location,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { parse } from "@natural-lang/core";
import { LLMAnalyzer } from "./llm";

// Create connection
const connection = createConnection(ProposedFeatures.all);

// Create text document manager
const documents = new TextDocuments(TextDocument);

// LLM analyzer
const llmAnalyzer = new LLMAnalyzer();

// Debounce timer for LLM analysis
const llmDebounceTimers = new Map<string, NodeJS.Timeout>();
const LLM_DEBOUNCE_MS = 500;

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      definitionProvider: true,
    },
  };

  return result;
});

connection.onInitialized(() => {
  connection.console.log("Natural Language Server initialized");
  if (llmAnalyzer.isEnabled()) {
    connection.console.log("LLM analysis enabled");
  } else {
    connection.console.log("LLM analysis disabled (no OPENROUTER_API_KEY)");
  }
});

// Validate document
async function validateDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const parseResult = parse(text);

  // Convert core diagnostics to LSP diagnostics
  const diagnostics: Diagnostic[] = parseResult.diagnostics.map((diag) => ({
    severity:
      diag.severity === "error"
        ? DiagnosticSeverity.Error
        : diag.severity === "warning"
        ? DiagnosticSeverity.Warning
        : DiagnosticSeverity.Information,
    range: {
      start: { line: diag.range.start.line, character: diag.range.start.character },
      end: { line: diag.range.end.line, character: diag.range.end.character },
    },
    message: diag.message,
    source: "natural-static",
  }));

  // Send static diagnostics immediately
  connection.sendDiagnostics({
    uri: textDocument.uri,
    diagnostics,
  });

  // Schedule LLM analysis (debounced)
  if (llmAnalyzer.isEnabled()) {
    const existingTimer = llmDebounceTimers.get(textDocument.uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      try {
        const llmResult = await llmAnalyzer.analyze(text);
        const llmDiagnostics: Diagnostic[] = llmResult.diagnostics.map((diag) => ({
          severity:
            diag.severity === "error"
              ? DiagnosticSeverity.Error
              : diag.severity === "warning"
              ? DiagnosticSeverity.Warning
              : DiagnosticSeverity.Information,
          range: {
            start: { line: Math.max(0, diag.line - 1), character: 0 },
            end: { line: Math.max(0, diag.line - 1), character: Number.MAX_VALUE },
          },
          message: diag.message,
          source: "natural-llm",
        }));

        // Combine static and LLM diagnostics
        connection.sendDiagnostics({
          uri: textDocument.uri,
          diagnostics: [...diagnostics, ...llmDiagnostics],
        });
      } catch (error) {
        connection.console.error(`LLM analysis error: ${error}`);
      }
    }, LLM_DEBOUNCE_MS);

    llmDebounceTimers.set(textDocument.uri, timer);
  }
}

// Document change handler
documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

documents.onDidOpen((event) => {
  validateDocument(event.document);
});

// Hover provider
connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  const parseResult = parse(text);
  const position = params.position;

  // Find concept at position
  for (const section of parseResult.ast.sections) {
    for (const concept of section.concepts) {
      const range = concept.position;
      if (
        position.line >= range.start.line &&
        position.line <= range.end.line &&
        position.character >= range.start.character &&
        position.character <= range.end.character
      ) {
        // Found the concept - show its definition
        if (concept.type === "definition") {
          return {
            contents: {
              kind: "markdown",
              value: `**@${concept.name}** (definition)\n\n${section.text}`,
            },
          };
        } else {
          // Find the definition
          for (const defSection of parseResult.ast.sections) {
            const definition = defSection.concepts.find(
              (c) => c.name === concept.name && c.type === "definition"
            );
            if (definition) {
              return {
                contents: {
                  kind: "markdown",
                  value: `**@${concept.name}** (reference)\n\n${defSection.text}`,
                },
              };
            }
          }
          return {
            contents: {
              kind: "markdown",
              value: `**@${concept.name}** (undefined reference)`,
            },
          };
        }
      }
    }
  }

  return null;
});

// Go to definition provider
connection.onDefinition((params): Definition | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  const parseResult = parse(text);
  const position = params.position;

  // Find concept at position
  for (const section of parseResult.ast.sections) {
    for (const concept of section.concepts) {
      const range = concept.position;
      if (
        position.line >= range.start.line &&
        position.line <= range.end.line &&
        position.character >= range.start.character &&
        position.character <= range.end.character
      ) {
        // Find the definition
        for (const defSection of parseResult.ast.sections) {
          const definition = defSection.concepts.find(
            (c) => c.name === concept.name && c.type === "definition"
          );
          if (definition) {
            return Location.create(document.uri, {
              start: {
                line: definition.position.start.line,
                character: definition.position.start.character,
              },
              end: {
                line: definition.position.end.line,
                character: definition.position.end.character,
              },
            });
          }
        }
      }
    }
  }

  return null;
});

// Listen on the connection
documents.listen(connection);
connection.listen();
