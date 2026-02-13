/**
 * @natural-lang/compiler
 * Agentic AI-powered code generator for Natural language (.nl → TypeScript)
 * 
 * v0.2: Uses LLM for intelligent code generation with template fallback
 */

export { compile } from './compiler.js';
export { getLLMConfig } from './llm.js';
export type {
  CompileOptions,
  CompileResult,
  PropertyInfo,
  MethodInfo,
  EntityInfo,
  RouteInfo,
  ValidationInfo,
} from './types.js';
export type { LLMConfig } from './llm.js';
