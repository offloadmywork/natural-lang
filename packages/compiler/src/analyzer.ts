/**
 * Analyzer - Extract structured information from parsed .nl document
 * Uses heuristics to identify entities, properties, methods, routes, and validations
 * 
 * TODO: Replace heuristics with LLM-powered semantic understanding in v0.2
 */

import type { NaturalDocument, ConceptDefinition, ProseBlock } from '@natural-lang/core';
import type { EntityInfo, PropertyInfo, MethodInfo, ValidationInfo, RouteInfo, AnalysisResult } from './types.js';

export function analyze(doc: NaturalDocument): AnalysisResult {
  const entities = new Map<string, EntityInfo>();
  const routes: RouteInfo[] = [];
  const validations = new Map<string, ValidationInfo[]>();

  for (const concept of doc.concepts) {
    // Check if this is an API definition
    if (isAPIDefinition(concept.name)) {
      const extractedRoutes = extractRoutes(concept);
      routes.push(...extractedRoutes);
      continue;
    }

    // Otherwise, treat as entity definition
    const entity = extractEntity(concept);
    entities.set(entity.name, entity);
    
    if (entity.validations.length > 0) {
      validations.set(entity.name, entity.validations);
    }
  }

  return { entities, routes, validations };
}

function isAPIDefinition(name: string): boolean {
  return /API|Endpoint|Route/i.test(name);
}

function extractEntity(concept: ConceptDefinition): EntityInfo {
  const properties: PropertyInfo[] = [];
  const methods: MethodInfo[] = [];
  const validationRules: ValidationInfo[] = [];

  for (const prose of concept.prose) {
    const text = prose.text.trim();
    
    // Extract properties: "has a/an X", "contains Y", "includes Z"
    const propMatches = extractProperties(text);
    properties.push(...propMatches);

    // Extract validations: "must be", "required", "cannot be", etc.
    const validations = extractValidations(text, concept.name);
    validationRules.push(...validations);

    // Extract methods: "can X", "allows Y", "supports Z"
    const methodMatches = extractMethods(text);
    methods.push(...methodMatches);
  }

  return {
    name: concept.name,
    properties: deduplicateProperties(properties),
    methods,
    validations: validationRules,
  };
}

function extractProperties(text: string): PropertyInfo[] {
  const properties: PropertyInfo[] = [];
  
  // Pattern: "has a/an X, Y, and Z"
  // Example: "has a unique ID, title, description, and completion status"
  const hasPattern = /(?:has?|contains?|includes?)\s+(?:a|an|the)?\s*([^.]+)/gi;
  const matches = text.matchAll(hasPattern);
  
  for (const match of matches) {
    const propertyList = match[1];
    // Split by commas and "and"
    const parts = propertyList.split(/,|\s+and\s+/).map(s => s.trim());
    
    for (const part of parts) {
      if (!part || part.length < 2) continue;
      
      const prop = parseProperty(part, text);
      if (prop) {
        properties.push(prop);
      }
    }
  }

  return properties;
}

function parseProperty(propText: string, context: string): PropertyInfo | null {
  // Remove leading articles
  let name = propText.replace(/^(?:a|an|the)\s+/i, '').trim();
  
  // Skip if it's not a valid property name
  if (name.length === 0 || name.length > 100) return null;

  // Convert to camelCase
  name = toCamelCase(name);

  // Infer type from keywords
  // TODO: Use LLM for accurate type inference
  let type = 'string';
  const lower = propText.toLowerCase();
  
  if (/\b(?:id|identifier)\b/i.test(propText)) {
    type = 'string';
  } else if (/\b(?:status|state)\b/i.test(propText)) {
    type = 'boolean';
  } else if (/\b(?:count|number|quantity|amount)\b/i.test(propText)) {
    type = 'number';
  } else if (/\b(?:date|time|timestamp)\b/i.test(propText)) {
    type = 'Date';
  } else if (/\b(?:list|array|collection)\b/i.test(propText)) {
    type = 'string[]';
  }

  // Check if required
  const required = /\brequired\b/i.test(context) || /\bunique\b/i.test(propText);

  return {
    name,
    type,
    required,
    description: propText,
  };
}

function extractValidations(text: string, entityName: string): ValidationInfo[] {
  const validations: ValidationInfo[] = [];
  
  // "must be X" pattern
  const mustBePattern = /([a-z]+)\s+must\s+be\s+([^.]+)/gi;
  for (const match of text.matchAll(mustBePattern)) {
    validations.push({
      field: toCamelCase(match[1]),
      rule: 'must_be',
      constraint: match[2].trim(),
    });
  }

  // "required" pattern
  const requiredPattern = /([a-z]+)\s+(?:is|are)\s+required/gi;
  for (const match of text.matchAll(requiredPattern)) {
    validations.push({
      field: toCamelCase(match[1]),
      rule: 'required',
    });
  }

  // Character length constraints
  const lengthPattern = /(\d+)-(\d+)\s+characters/i;
  const lengthMatch = text.match(lengthPattern);
  if (lengthMatch) {
    validations.push({
      field: 'unknown', // TODO: Better field detection
      rule: 'length',
      constraint: `${lengthMatch[1]}-${lengthMatch[2]}`,
    });
  }

  return validations;
}

function extractMethods(text: string): MethodInfo[] {
  const methods: MethodInfo[] = [];
  
  // "can X" pattern
  const canPattern = /can\s+([^.]+)/gi;
  for (const match of text.matchAll(canPattern)) {
    const description = match[1].trim();
    const name = toCamelCase(description);
    methods.push({ name, description });
  }

  return methods;
}

function extractRoutes(concept: ConceptDefinition): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  for (const prose of concept.prose) {
    const text = prose.text.trim();
    
    // Pattern: "GET /path — description"
    const routePattern = /(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s—]+)\s*[—–-]\s*([^.\n]+)/gi;
    
    for (const match of text.matchAll(routePattern)) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        description: match[3].trim(),
      });
    }
  }

  return routes;
}

function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

function deduplicateProperties(props: PropertyInfo[]): PropertyInfo[] {
  const seen = new Map<string, PropertyInfo>();
  
  for (const prop of props) {
    if (!seen.has(prop.name)) {
      seen.set(prop.name, prop);
    }
  }
  
  return Array.from(seen.values());
}
