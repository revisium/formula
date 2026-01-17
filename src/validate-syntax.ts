import { validateSyntax } from './parser';

export interface SyntaxValidationResult {
  isValid: boolean;
  error?: string;
  position?: number;
}

/**
 * Validate formula expression syntax
 *
 * @param expression - Formula expression string
 * @returns Validation result with error details if invalid
 *
 * @example
 * validateFormulaSyntax('price * 1.1')
 * // { isValid: true }
 *
 * validateFormulaSyntax('price * (1.1')
 * // { isValid: false, error: 'Unclosed (', position: 8 }
 */
export function validateFormulaSyntax(
  expression: string,
): SyntaxValidationResult {
  const result = validateSyntax(expression);

  if (result.isValid) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error,
    position: result.position,
  };
}
