import { describe, it, expect } from '@jest/globals';
import { parseExpression } from '../parse-formula';

describe('parseExpression', () => {
  it('should parse simple expression', () => {
    const result = parseExpression('price * 1.1');

    expect(result.expression).toBe('price * 1.1');
    expect(result.dependencies).toContain('price');
    expect(result.minVersion).toBe('1.0');
    expect(result.features).toEqual([]);
  });

  it('should parse expression with nested paths', () => {
    const result = parseExpression('stats.damage * multiplier');

    expect(result.dependencies).toContain('stats.damage');
    expect(result.dependencies).toContain('multiplier');
    expect(result.minVersion).toBe('1.1');
    expect(result.features).toContain('nested_path');
  });

  it('should parse expression with context tokens', () => {
    const result = parseExpression('if(#first, value, @prev.total + value)');

    expect(result.minVersion).toBe('1.2');
    expect(result.features).toContain('context_token');
  });

  it('should parse expression with array functions', () => {
    const result = parseExpression('sum(items[*].price)');

    expect(result.minVersion).toBe('1.1');
    expect(result.features).toContain('array_wildcard');
    expect(result.features).toContain('array_function');
  });

  it('should parse expression with array index', () => {
    const result = parseExpression('items[0].price + items[-1].price');

    expect(result.minVersion).toBe('1.1');
    expect(result.features).toContain('array_index');
  });
});
