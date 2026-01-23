/**
 * x-formula extension structure
 */
export interface XFormula {
  /**
   * Major specification version.
   * Minor version (1.0, 1.1, etc.) is auto-detected from expression syntax.
   * @minimum 1
   * @maximum 1
   */
  version: 1;

  /**
   * Formula expression string
   * @minLength 1
   * @maxLength 10000
   */
  expression: string;
}

/**
 * Detected formula minor version based on syntax features
 */
export type FormulaMinorVersion = '1.0' | '1.1';

/**
 * Features detected in formula expression
 */
export type FormulaFeature =
  | 'nested_path' // stats.damage
  | 'array_index' // items[0]
  | 'array_wildcard' // items[*]
  | 'relative_path' // ../field
  | 'root_path' // /field
  | 'context_token' // @prev, #index
  | 'array_function' // sum(), avg(), etc.
  | 'bracket_notation'; // ["field-name"]

/**
 * Result of formula syntax analysis
 */
export interface FormulaAnalysis {
  /** Detected minimum required version */
  minVersion: FormulaMinorVersion;
  /** Features detected in expression */
  features: FormulaFeature[];
  /** Parsed field dependencies */
  dependencies: string[];
}

/**
 * Path segment types for formula paths
 */
export type PathSegment =
  | { type: 'property'; name: string }
  | { type: 'index'; value: number } // [0], [-1]
  | { type: 'wildcard' } // [*]
  | { type: 'parent' } // ../
  | { type: 'root' } // /
  | { type: 'token'; name: string }; // #index, @prev, etc.

/**
 * Result of path parsing
 */
export interface ParsedPath {
  /** Original path string */
  original: string;
  /** Parsed segments */
  segments: PathSegment[];
  /** Whether path is absolute (starts with /) */
  isAbsolute: boolean;
  /** Whether path is relative (starts with ../) */
  isRelative: boolean;
}

/**
 * Path validation result
 */
export interface PathValidationResult {
  isValid: boolean;
  error?: string;
  segments?: PathSegment[];
}

/**
 * Formula evaluation context
 */
export interface FormulaContext {
  /** Field values from current row */
  [fieldName: string]: unknown;
}

/**
 * Formula evaluation result
 */
export type FormulaResult = number | string | boolean | null;
