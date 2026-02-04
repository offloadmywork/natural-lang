/**
 * Type definitions for the compiler pipeline
 */

export interface ParseResult {
  concepts: Concept[];
}

export interface Concept {
  name: string;
  content: string;
}

export interface Analysis {
  dataModels: DataModel[];
  behaviors: Behavior[];
  uiComponents: UIComponent[];
  businessRules: BusinessRule[];
  apiEndpoints?: APIEndpoint[];
  storage?: string;
}

export interface DataModel {
  name: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  validation?: string;
}

export interface Behavior {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export interface UIComponent {
  name: string;
  type: string;
  description: string;
  interactions: string[];
}

export interface BusinessRule {
  context: string;
  rule: string;
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
}

export interface FilePlan {
  path: string;
  purpose: string;
  dependencies: string[];
  type: 'config' | 'entry' | 'model' | 'logic' | 'component';
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CompileOptions {
  model?: string;
  outputDir: string;
  verbose?: boolean;
}

export interface CompileResult {
  success: boolean;
  outputDir: string;
  files: string[];
  errors?: string[];
}
