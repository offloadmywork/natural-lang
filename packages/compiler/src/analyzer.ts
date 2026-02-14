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

  // First pass: collect all entity names for type inference
  const entityNames = new Set<string>();
  for (const concept of doc.concepts) {
    if (!isAPIDefinition(concept.name)) {
      entityNames.add(concept.name);
    }
  }

  // Second pass: extract entities with knowledge of all entity names
  for (const concept of doc.concepts) {
    // Check if this is an API definition
    if (isAPIDefinition(concept.name)) {
      const extractedRoutes = extractRoutes(concept);
      routes.push(...extractedRoutes);
      continue;
    }

    // Otherwise, treat as entity definition
    const entity = extractEntity(concept, entityNames);
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

function extractEntity(concept: ConceptDefinition, entityNames: Set<string>): EntityInfo {
  const properties: PropertyInfo[] = [];
  const methods: MethodInfo[] = [];
  const validationRules: ValidationInfo[] = [];

  for (const prose of concept.prose) {
    const text = prose.text.trim();
    
    // Extract properties: "has a/an X", "contains Y", "includes Z"
    const propMatches = extractProperties(text, entityNames);
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

function extractProperties(text: string, entityNames: Set<string>): PropertyInfo[] {
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
      
      const prop = parseProperty(part, text, entityNames);
      if (prop) {
        properties.push(prop);
      }
    }
  }

  return properties;
}

/**
 * Convert a plural word to its singular form (simple heuristics)
 */
function toSingular(word: string): string {
  const lower = word.toLowerCase();
  
  // Common irregular plurals
  const irregulars: Record<string, string> = {
    'children': 'child',
    'people': 'person',
    'men': 'man',
    'women': 'woman',
    'mice': 'mouse',
    'geese': 'goose',
    'teeth': 'tooth',
    'feet': 'foot',
    'data': 'datum',
    'indices': 'index',
    'vertices': 'vertex',
    'matrices': 'matrix',
  };
  
  if (irregulars[lower]) {
    // Preserve original casing of first letter
    const singular = irregulars[lower];
    return word[0] === word[0].toUpperCase() 
      ? singular.charAt(0).toUpperCase() + singular.slice(1)
      : singular;
  }
  
  // Words ending in -ies → -y (e.g., categories → category)
  if (lower.endsWith('ies') && lower.length > 4) {
    return word.slice(0, -3) + 'y';
  }
  
  // Words ending in -es (e.g., boxes → box, statuses → status)
  if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('zes') ||
      lower.endsWith('ches') || lower.endsWith('shes')) {
    return word.slice(0, -2);
  }
  
  // Words ending in -s (e.g., users → user)
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
    return word.slice(0, -1);
  }
  
  return word;
}

/**
 * Check if a word matches an entity name (case-insensitive)
 */
function findMatchingEntity(word: string, entityNames: Set<string>): string | null {
  const lower = word.toLowerCase();
  for (const entity of entityNames) {
    if (entity.toLowerCase() === lower) {
      return entity;
    }
  }
  return null;
}

function parseProperty(propText: string, context: string, entityNames: Set<string>): PropertyInfo | null {
  // Remove leading articles
  let name = propText.replace(/^(?:a|an|the)\s+/i, '').trim();
  
  // Skip if it's not a valid property name
  if (name.length === 0 || name.length > 100) return null;

  // Extract the core word (first word, for type inference)
  const words = name.split(/\s+/);
  const coreWord = words[words.length - 1]; // Use last word (e.g., "parent category" → "category")

  // Convert to camelCase
  name = toCamelCase(name);

  // Infer type from keywords
  let type = 'string';
  
  // First, check if the property references a known entity
  // Check exact match (singular entity reference)
  const exactMatch = findMatchingEntity(coreWord, entityNames);
  if (exactMatch) {
    type = exactMatch;
  } else {
    // Check if it's a plural of an entity (e.g., "tags" → Tag[])
    const singular = toSingular(coreWord);
    const singularMatch = findMatchingEntity(singular, entityNames);
    if (singularMatch && singular.toLowerCase() !== coreWord.toLowerCase()) {
      // It's a plural form → array type
      type = `${singularMatch}[]`;
    } else {
      // Fall back to keyword-based inference
      if (/\b(?:id|identifier)\b/i.test(propText)) {
        type = 'string';
      } else if (/\b(?:status|state)\b/i.test(propText)) {
        type = 'boolean';
      } else if (/\b(?:count|number|quantity|amount|price|total)\b/i.test(propText)) {
        type = 'number';
      } else if (/\b(?:date|time|timestamp)\b/i.test(propText)) {
        type = 'Date';
      } else if (/\b(?:list|array|collection)\b/i.test(propText)) {
        type = 'string[]';
      }
    }
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
