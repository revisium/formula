export * from './types';

// Parser API
export {
  parseFormula,
  validateSyntax,
  evaluate,
  evaluateWithContext,
  inferFormulaType,
} from './parser';
export type {
  ASTNode,
  ParseResult,
  InferredType,
  FieldTypes,
  EvaluateContextOptions,
} from './parser';

// Expression API (high-level)
export { parseExpression } from './parse-formula';
export type { ParsedExpression } from './parse-formula';
export { validateFormulaSyntax } from './validate-syntax';
export type { SyntaxValidationResult } from './validate-syntax';

// Graph API (primitives)
export {
  buildDependencyGraph,
  detectCircularDependencies,
  getTopologicalOrder,
} from './dependency-graph';
export type {
  DependencyGraph,
  CircularDependencyResult,
  TopologicalOrderResult,
} from './dependency-graph';

// Schema extraction
export { extractSchemaFormulas } from './extract-schema';
export type { JsonSchema, ExtractedFormula } from './extract-schema';

// Schema validation
export {
  validateFormulaAgainstSchema,
  validateSchemaFormulas,
} from './validate-schema';
export type {
  FormulaValidationError,
  SchemaValidationResult,
} from './validate-schema';
