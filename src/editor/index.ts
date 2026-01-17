/**
 * Editor entry point for formula editing in frontend
 * This module will contain:
 * - Formula validation
 * - Autocomplete helpers
 * - Syntax highlighting tokens
 * - Error formatting
 */

export { detectVersion } from '../detect-version';
export type {
  XFormula,
  FormulaMinorVersion,
  FormulaFeature,
  FormulaAnalysis,
  PathSegment,
  ParsedPath,
  PathValidationResult,
  FormulaValidationResult,
  FormulaValidationError,
  FormulaValidationErrorType,
  FormulaValidationWarning,
  FormulaValidationWarningType,
  FormulaFieldSchema,
  ParsedFormula,
} from '../types';
