/**
 * Editor entry point for formula editing in frontend
 * This module will contain:
 * - Formula validation
 * - Autocomplete helpers
 * - Syntax highlighting tokens
 * - Error formatting
 */

export { parseFormula } from '../parser';
export { parseExpression } from '../parse-formula';
export { validateFormulaSyntax } from '../validate-syntax';
export type { ParseResult, ASTNode } from '../parser';
export type { ParsedExpression } from '../parse-formula';
export type { SyntaxValidationResult } from '../validate-syntax';
export type {
  XFormula,
  FormulaMinorVersion,
  FormulaFeature,
  FormulaAnalysis,
  PathSegment,
  ParsedPath,
  PathValidationResult,
} from '../types';
