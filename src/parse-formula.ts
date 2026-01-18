import { FormulaFeature, FormulaMinorVersion } from './types';
import { parseFormula } from './ohm';

export interface ParsedExpression {
  expression: string;
  dependencies: string[];
  minVersion: FormulaMinorVersion;
  features: FormulaFeature[];
}

/**
 * Parse a formula expression string
 *
 * @param expression - Formula expression string
 * @returns Parsed expression with dependencies and version info
 *
 * @example
 * parseExpression('price * 1.1')
 * // { expression: 'price * 1.1', dependencies: ['price'], minVersion: '1.0', features: [] }
 *
 * parseExpression('stats.damage * multiplier')
 * // { expression: '...', dependencies: ['stats.damage', 'multiplier'], minVersion: '1.1', features: ['nested_path'] }
 */
export function parseExpression(expression: string): ParsedExpression {
  const result = parseFormula(expression);
  return {
    expression,
    dependencies: result.dependencies,
    minVersion: result.minVersion,
    features: result.features,
  };
}
