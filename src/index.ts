export type {
  XFormula,
  FormulaMinorVersion,
  FormulaFeature,
  FormulaAnalysis,
  PathSegment,
  ParsedPath,
  PathValidationResult,
  FormulaContext,
  FormulaResult,
  ArrayLevelContext,
  ArrayContext,
} from './types';

// Parser API (Ohm-based)
export {
  parseFormula,
  validateSyntax,
  evaluate,
  evaluateWithContext,
  inferFormulaType,
  serializeAst,
  replaceDependencies,
} from './ohm';
export type {
  ASTNode,
  ParseResult,
  InferredType,
  FieldTypes,
  EvaluateContextOptions,
} from './ohm';

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
