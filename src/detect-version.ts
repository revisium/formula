import { FormulaFeature, FormulaMinorVersion, FormulaAnalysis } from './types';

const NESTED_PATH_REGEX = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_]/;
const ARRAY_INDEX_REGEX = /\[-?\d+]/;
const ROOT_PATH_REGEX = /\/[a-zA-Z_]/;
const CONTEXT_TOKEN_REGEX = /@(?:prev|next|current)\b|#(?:index|first|last|length)\b/;
const ARRAY_FUNCTION_REGEX = /\b(?:sum|avg|count|first|last|join|filter|map|includes)\s*\(/i;
const IDENTIFIER_REGEX = new RegExp(
  String.raw`(?:^|[^.@#/\w])([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*(?:\[-?\d+]|\[\*])?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)`,
  'g',
);

/**
 * Detect formula features and minimum required version from expression
 *
 * @param expression - Formula expression string
 * @returns Analysis result with detected version and features
 *
 * @example
 * detectVersion("baseDamage * attackSpeed")
 * // { minVersion: "1.0", features: [], dependencies: ["baseDamage", "attackSpeed"] }
 *
 * detectVersion("stats.damage * /multiplier")
 * // { minVersion: "1.1", features: ["nested_path", "root_path"], dependencies: ["stats.damage", "multiplier"] }
 */
export function detectVersion(expression: string): FormulaAnalysis {
  const features: FormulaFeature[] = [];

  if (expression.includes('.') && NESTED_PATH_REGEX.test(expression)) {
    features.push('nested_path');
  }

  if (ARRAY_INDEX_REGEX.test(expression)) {
    features.push('array_index');
  }

  if (expression.includes('[*]')) {
    features.push('array_wildcard');
  }

  if (expression.includes('../')) {
    features.push('relative_path');
  }

  if (ROOT_PATH_REGEX.test(expression)) {
    features.push('root_path');
  }

  if (CONTEXT_TOKEN_REGEX.test(expression)) {
    features.push('context_token');
  }

  if (ARRAY_FUNCTION_REGEX.test(expression)) {
    features.push('array_function');
  }

  const minVersion: FormulaMinorVersion = features.length > 0 ? '1.1' : '1.0';

  const dependencies = extractDependencies(expression);

  return {
    minVersion,
    features,
    dependencies,
  };
}

function extractDependencies(expression: string): string[] {
  const deps = new Set<string>();

  let match;
  while ((match = IDENTIFIER_REGEX.exec(expression)) !== null) {
    const identifier = match[1];
    if (identifier && !isKeyword(identifier)) {
      deps.add(identifier);
    }
  }

  return Array.from(deps);
}

const KEYWORDS = new Set([
  'true', 'false', 'null',
  'and', 'or', 'not',
  'if', 'round', 'floor', 'ceil', 'abs', 'sqrt', 'pow', 'min', 'max', 'log', 'log10', 'exp', 'sign',
  'concat', 'upper', 'lower', 'length', 'trim', 'left', 'right', 'replace', 'contains', 'startsWith', 'endsWith',
  'toString', 'toNumber', 'toBoolean', 'isNull', 'coalesce',
  'sum', 'avg', 'count', 'first', 'last', 'join', 'filter', 'map', 'includes',
]);

function isKeyword(identifier: string): boolean {
  return KEYWORDS.has(identifier.toLowerCase());
}
