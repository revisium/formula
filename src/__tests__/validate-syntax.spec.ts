import { describe, it, expect } from '@jest/globals';
import { validateFormulaSyntax } from '../validate-syntax';

describe('validateFormulaSyntax', () => {
  describe('valid expressions', () => {
    it('should validate simple arithmetic', () => {
      expect(validateFormulaSyntax('price * 1.1').isValid).toBe(true);
      expect(validateFormulaSyntax('a + b - c').isValid).toBe(true);
      expect(validateFormulaSyntax('x / y * z').isValid).toBe(true);
    });

    it('should validate function calls', () => {
      expect(validateFormulaSyntax('round(price, 2)').isValid).toBe(true);
      expect(validateFormulaSyntax('if(x > 0, x, 0)').isValid).toBe(true);
      expect(validateFormulaSyntax('sum(items[*].price)').isValid).toBe(true);
    });

    it('should validate nested brackets', () => {
      expect(validateFormulaSyntax('((a + b) * c)').isValid).toBe(true);
      expect(validateFormulaSyntax('items[0].prices[1]').isValid).toBe(true);
    });

    it('should validate string literals', () => {
      expect(validateFormulaSyntax('concat("hello", name)').isValid).toBe(true);
      expect(validateFormulaSyntax("concat('world', name)").isValid).toBe(true);
    });

    it('should validate comparison operators', () => {
      expect(validateFormulaSyntax('x > 10').isValid).toBe(true);
      expect(validateFormulaSyntax('x >= 10').isValid).toBe(true);
      expect(validateFormulaSyntax('x != y').isValid).toBe(true);
    });

    it('should validate unary minus', () => {
      expect(validateFormulaSyntax('-x').isValid).toBe(true);
      expect(validateFormulaSyntax('a + -b').isValid).toBe(true);
    });
  });

  describe('invalid expressions', () => {
    it('should reject empty expression', () => {
      const result = validateFormulaSyntax('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty expression');
    });

    it('should reject whitespace-only expression', () => {
      const result = validateFormulaSyntax('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty expression');
    });

    it('should reject unclosed parenthesis', () => {
      const result = validateFormulaSyntax('price * (1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unclosed');
    });

    it('should reject unclosed bracket', () => {
      const result = validateFormulaSyntax('items[0');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unclosed');
    });

    it('should reject unexpected closing bracket', () => {
      const result = validateFormulaSyntax('price * 1.1)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unexpected');
    });

    it('should reject unclosed string literal', () => {
      const result = validateFormulaSyntax('concat("hello, name)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should reject expression ending with operator', () => {
      const result = validateFormulaSyntax('price *');
      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should allow brackets inside strings', () => {
      expect(validateFormulaSyntax('concat("(test)", x)').isValid).toBe(true);
    });

    it('should handle operators inside strings', () => {
      expect(validateFormulaSyntax('concat("a**b", x)').isValid).toBe(true);
      expect(validateFormulaSyntax('concat("++", x)').isValid).toBe(true);
    });
  });
});
