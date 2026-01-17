import { FormulaFeature, FormulaMinorVersion, FormulaAnalysis } from './types';

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

  if (expression.includes('.') && /[a-zA-Z_]\w*\.[a-zA-Z_]/.test(expression)) {
    features.push('nested_path');
  }

  if (/\[\d+\]/.test(expression) || /\[-\d+\]/.test(expression)) {
    features.push('array_index');
  }

  if (/\[\*\]/.test(expression)) {
    features.push('array_wildcard');
  }

  if (/\.\.\//.test(expression)) {
    features.push('relative_path');
  }

  if (/\/[a-zA-Z_]/.test(expression)) {
    features.push('root_path');
  }

  if (/@[a-zA-Z]/.test(expression) || /#[a-zA-Z]/.test(expression)) {
    features.push('context_token');
  }

  const arrayFunctions = ['sum', 'avg', 'count', 'first', 'last', 'join', 'filter', 'map', 'includes'];
  const funcRegex = new RegExp(`\\b(${arrayFunctions.join('|')})\\s*\\(`, 'i');
  if (funcRegex.test(expression)) {
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

  const identifierRegex = /(?:^|[^.@#/\w])([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*(?:\[\d+\]|\[\*\]|\[-\d+\])?(?:\.[a-zA-Z_]\w*)*)/g;

  let match;
  while ((match = identifierRegex.exec(expression)) !== null) {
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
