/**
 * @natural-lang/compiler
 * Template-based code generator for Natural language (.nl → TypeScript)
 * 
 * v0.1: Uses heuristics and templates (no LLM)
 * TODO: v0.2 will use agentic/LLM-powered compilation for better accuracy
 */

export { compile } from './compiler.js';
export type {
  CompileOptions,
  CompileResult,
  PropertyInfo,
  MethodInfo,
  EntityInfo,
  RouteInfo,
  ValidationInfo,
} from './types.js';
