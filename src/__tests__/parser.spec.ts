import { describe, it, expect } from '@jest/globals';
import {
  parseFormula,
  validateSyntax,
  evaluate,
  inferFormulaType,
} from '../parser';

describe('parseFormula', () => {
  describe('basic expressions', () => {
    it('should parse simple arithmetic', () => {
      const result = parseFormula('price * 1.1');
      expect(result.dependencies).toContain('price');
      expect(result.minVersion).toBe('1.0');
      expect(result.features).toEqual([]);
    });

    it('should parse multiple identifiers', () => {
      const result = parseFormula('a + b - c');
      expect(result.dependencies).toContain('a');
      expect(result.dependencies).toContain('b');
      expect(result.dependencies).toContain('c');
    });

    it('should parse function calls', () => {
      const result = parseFormula('round(price, 2)');
      expect(result.dependencies).toContain('price');
      expect(result.dependencies).not.toContain('round');
    });

    it('should not include keywords as dependencies', () => {
      const result = parseFormula('if(x > 0, x, 0)');
      expect(result.dependencies).toContain('x');
      expect(result.dependencies).not.toContain('if');
    });
  });

  describe('nested paths (v1.1)', () => {
    it('should detect nested path feature', () => {
      const result = parseFormula('stats.damage');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('nested_path');
      expect(result.dependencies).toContain('stats.damage');
    });

    it('should parse deep nested paths', () => {
      const result = parseFormula('user.profile.address.city');
      expect(result.dependencies).toContain('user.profile.address.city');
      expect(result.features).toContain('nested_path');
    });
  });

  describe('array index (v1.1)', () => {
    it('should detect array index feature', () => {
      const result = parseFormula('items[0].price');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_index');
      expect(result.features).toContain('nested_path');
    });

    it('should parse negative array index', () => {
      const result = parseFormula('items[-1].name');
      expect(result.features).toContain('array_index');
    });
  });

  describe('array wildcard [*] (v1.1)', () => {
    it('should detect array wildcard feature', () => {
      const result = parseFormula('items[*].price');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_wildcard');
      expect(result.dependencies).toContain('items[*].price');
    });

    it('should parse wildcard with function', () => {
      const result = parseFormula('sum(items[*].price)');
      expect(result.features).toContain('array_wildcard');
      expect(result.features).toContain('array_function');
    });
  });

  describe('context tokens @ and # (v1.1)', () => {
    it('should detect @prev token', () => {
      const result = parseFormula('@prev.total + value');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('context_token');
      expect(result.features).toContain('nested_path');
      expect(result.dependencies).toContain('value');
      expect(result.dependencies).not.toContain('@prev');
    });

    it('should detect #index token', () => {
      const result = parseFormula('#index * 10');
      expect(result.features).toContain('context_token');
      expect(result.dependencies).not.toContain('#index');
    });

    it('should parse complex expression with context tokens', () => {
      const result = parseFormula('if(#first, value, @prev.total + value)');
      expect(result.features).toContain('context_token');
      expect(result.dependencies).toContain('value');
    });
  });

  describe('array functions (v1.1)', () => {
    it('should detect sum as array function', () => {
      const result = parseFormula('sum(prices)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_function');
    });

    it('should detect avg as array function', () => {
      const result = parseFormula('avg(scores)');
      expect(result.features).toContain('array_function');
    });
  });
});

describe('validateSyntax', () => {
  describe('valid expressions', () => {
    it('should validate simple arithmetic', () => {
      expect(validateSyntax('price * 1.1').isValid).toBe(true);
      expect(validateSyntax('a + b - c').isValid).toBe(true);
    });

    it('should validate function calls', () => {
      expect(validateSyntax('round(price, 2)').isValid).toBe(true);
      expect(validateSyntax('if(x > 0, x, 0)').isValid).toBe(true);
    });

    it('should validate wildcards', () => {
      expect(validateSyntax('sum(items[*].price)').isValid).toBe(true);
    });

    it('should validate context tokens', () => {
      expect(validateSyntax('@prev.total').isValid).toBe(true);
      expect(validateSyntax('#index + 1').isValid).toBe(true);
    });

    it('should validate nested brackets', () => {
      expect(validateSyntax('((a + b) * c)').isValid).toBe(true);
      expect(validateSyntax('items[0].prices[1]').isValid).toBe(true);
    });

    it('should validate string literals', () => {
      expect(validateSyntax('concat("hello", name)').isValid).toBe(true);
      expect(validateSyntax("concat('world', name)").isValid).toBe(true);
    });

    it('should validate comparison operators', () => {
      expect(validateSyntax('x > 10').isValid).toBe(true);
      expect(validateSyntax('x >= 10').isValid).toBe(true);
      expect(validateSyntax('x != y').isValid).toBe(true);
    });

    it('should validate unary minus', () => {
      expect(validateSyntax('-x').isValid).toBe(true);
      expect(validateSyntax('a + -b').isValid).toBe(true);
    });
  });

  describe('invalid expressions', () => {
    it('should reject empty expression', () => {
      const result = validateSyntax('');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Empty expression');
      }
    });

    it('should reject whitespace-only expression', () => {
      const result = validateSyntax('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Empty expression');
      }
    });

    it('should reject unclosed parenthesis', () => {
      const result = validateSyntax('price * (1.1');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toContain('Unclosed');
      }
    });

    it('should reject unclosed bracket', () => {
      const result = validateSyntax('items[0');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toContain('Unclosed');
      }
    });

    it('should reject unexpected closing bracket', () => {
      const result = validateSyntax('price * 1.1)');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toContain('Unexpected');
      }
    });

    it('should reject unclosed string literal', () => {
      const result = validateSyntax('concat("hello, name)');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toContain('string');
      }
    });

    it('should reject expression ending with operator', () => {
      const result = validateSyntax('price *');
      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should allow brackets inside strings', () => {
      expect(validateSyntax('concat("(test)", x)').isValid).toBe(true);
    });

    it('should handle operators inside strings', () => {
      expect(validateSyntax('concat("a**b", x)').isValid).toBe(true);
    });
  });
});

describe('evaluate', () => {
  describe('arithmetic', () => {
    it('should evaluate simple arithmetic', () => {
      expect(evaluate('2 + 3', {})).toBe(5);
      expect(evaluate('10 * 2', {})).toBe(20);
      expect(evaluate('10 / 2', {})).toBe(5);
      expect(evaluate('10 - 3', {})).toBe(7);
    });

    it('should evaluate with context', () => {
      expect(evaluate('price * 2', { price: 50 })).toBe(100);
      expect(evaluate('a + b', { a: 5, b: 3 })).toBe(8);
    });

    it('should evaluate unary minus', () => {
      expect(evaluate('-5', {})).toBe(-5);
      expect(evaluate('a + -b', { a: 10, b: 3 })).toBe(7);
    });
  });

  describe('nested paths', () => {
    it('should evaluate nested paths', () => {
      expect(
        evaluate('user.profile.age', { user: { profile: { age: 25 } } }),
      ).toBe(25);
    });

    it('should evaluate deep nested paths', () => {
      const context = { a: { b: { c: { d: 42 } } } };
      expect(evaluate('a.b.c.d', context)).toBe(42);
    });
  });

  describe('array access', () => {
    it('should evaluate array index', () => {
      const context = { items: [{ price: 10 }, { price: 20 }, { price: 30 }] };
      expect(evaluate('items[0].price', context)).toBe(10);
      expect(evaluate('items[1].price', context)).toBe(20);
      expect(evaluate('items[2].price', context)).toBe(30);
    });

    it('should evaluate multiple array accesses', () => {
      const context = { items: [{ price: 10 }, { price: 20 }] };
      expect(evaluate('items[0].price + items[1].price', context)).toBe(30);
    });

    it('should evaluate nested arrays', () => {
      const context = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };
      expect(evaluate('matrix[0][0]', context)).toBe(1);
      expect(evaluate('matrix[1][1]', context)).toBe(4);
    });
  });

  describe('comparisons', () => {
    it('should evaluate comparison operators', () => {
      expect(evaluate('5 > 3', {})).toBe(true);
      expect(evaluate('5 < 3', {})).toBe(false);
      expect(evaluate('5 >= 5', {})).toBe(true);
      expect(evaluate('5 <= 4', {})).toBe(false);
      expect(evaluate('x == 10', { x: 10 })).toBe(true);
      expect(evaluate('x != 10', { x: 5 })).toBe(true);
    });
  });
});

describe('inferFormulaType', () => {
  describe('arithmetic expressions', () => {
    it('should infer number for arithmetic operations', () => {
      expect(inferFormulaType('price * quantity')).toBe('number');
      expect(inferFormulaType('a + b')).toBe('number');
      expect(inferFormulaType('a - b')).toBe('number');
      expect(inferFormulaType('a / b')).toBe('number');
      expect(inferFormulaType('a % b')).toBe('number');
    });

    it('should infer number for unary minus', () => {
      expect(inferFormulaType('-price')).toBe('number');
    });

    it('should infer number for numeric literals', () => {
      expect(inferFormulaType('42')).toBe('number');
      expect(inferFormulaType('3.14')).toBe('number');
    });
  });

  describe('comparison expressions', () => {
    it('should infer boolean for comparison operations', () => {
      expect(inferFormulaType('price > 100')).toBe('boolean');
      expect(inferFormulaType('a < b')).toBe('boolean');
      expect(inferFormulaType('a >= b')).toBe('boolean');
      expect(inferFormulaType('a <= b')).toBe('boolean');
      expect(inferFormulaType('a == b')).toBe('boolean');
      expect(inferFormulaType('a != b')).toBe('boolean');
    });
  });

  describe('logical expressions', () => {
    it('should infer boolean for logical operations', () => {
      expect(inferFormulaType('a && b')).toBe('boolean');
      expect(inferFormulaType('a || b')).toBe('boolean');
      expect(inferFormulaType('!a')).toBe('boolean');
    });
  });

  describe('field type lookup', () => {
    it('should infer type from field types', () => {
      const fieldTypes = {
        price: 'number' as const,
        name: 'string' as const,
        active: 'boolean' as const,
      };
      expect(inferFormulaType('price', fieldTypes)).toBe('number');
      expect(inferFormulaType('name', fieldTypes)).toBe('string');
      expect(inferFormulaType('active', fieldTypes)).toBe('boolean');
    });

    it('should return unknown for unknown fields', () => {
      expect(inferFormulaType('unknown')).toBe('unknown');
      expect(inferFormulaType('unknown', {})).toBe('unknown');
    });
  });

  describe('function calls', () => {
    it('should infer number for numeric functions', () => {
      expect(inferFormulaType('round(price)')).toBe('number');
      expect(inferFormulaType('floor(price)')).toBe('number');
      expect(inferFormulaType('ceil(price)')).toBe('number');
      expect(inferFormulaType('abs(price)')).toBe('number');
      expect(inferFormulaType('sqrt(price)')).toBe('number');
      expect(inferFormulaType('sum(items)')).toBe('number');
      expect(inferFormulaType('avg(items)')).toBe('number');
      expect(inferFormulaType('count(items)')).toBe('number');
    });

    it('should infer string for string functions', () => {
      expect(inferFormulaType('concat(a, b)')).toBe('string');
      expect(inferFormulaType('upper(name)')).toBe('string');
      expect(inferFormulaType('lower(name)')).toBe('string');
      expect(inferFormulaType('trim(name)')).toBe('string');
    });

    it('should infer boolean for boolean functions', () => {
      expect(inferFormulaType('contains(name, "test")')).toBe('boolean');
      expect(inferFormulaType('startswith(name, "a")')).toBe('boolean');
      expect(inferFormulaType('endswith(name, "z")')).toBe('boolean');
      expect(inferFormulaType('isnull(value)')).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('should return unknown for empty expression', () => {
      expect(inferFormulaType('')).toBe('unknown');
      expect(inferFormulaType('  ')).toBe('unknown');
    });

    it('should return unknown for invalid expression', () => {
      expect(inferFormulaType('price *')).toBe('unknown');
    });

    it('should handle nested paths with field types', () => {
      const fieldTypes = { stats: 'object' as const };
      expect(inferFormulaType('stats.damage', fieldTypes)).toBe('unknown');
    });
  });
});
