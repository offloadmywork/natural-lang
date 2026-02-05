/**
 * Type definitions for the compiler
 */

import type { NaturalDocument, Diagnostic } from '@natural-lang/core';

export interface CompileOptions {
  target?: 'typescript';
}

export interface CompileResult {
  files: Map<string, string>;
  diagnostics: Diagnostic[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface MethodInfo {
  name: string;
  description: string;
}

export interface ValidationInfo {
  field: string;
  rule: string;
  constraint?: string;
}

export interface EntityInfo {
  name: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  validations: ValidationInfo[];
}

export interface RouteInfo {
  method: string;
  path: string;
  description: string;
  statusCode?: number;
}

export interface AnalysisResult {
  entities: Map<string, EntityInfo>;
  routes: RouteInfo[];
  validations: Map<string, ValidationInfo[]>;
}
