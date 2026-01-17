import { describe, it, expect } from '@jest/globals';
import { extractSchemaFormulas } from '../extract-schema';

describe('extractSchemaFormulas', () => {
  it('should return empty array for schema without formulas', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
      },
    };

    const result = extractSchemaFormulas(schema);

    expect(result).toEqual([]);
  });

  it('should extract single formula', () => {
    const schema = {
      type: 'object',
      properties: {
        price: { type: 'number' },
        tax: {
          type: 'number',
          'x-formula': { version: 1, expression: 'price * 0.1' },
        },
      },
    };

    const result = extractSchemaFormulas(schema);

    expect(result).toHaveLength(1);
    const formula = result[0]!;
    expect(formula.fieldName).toBe('tax');
    expect(formula.expression).toBe('price * 0.1');
    expect(formula.fieldType).toBe('number');
  });

  it('should extract multiple formulas', () => {
    const schema = {
      type: 'object',
      properties: {
        price: { type: 'number' },
        quantity: { type: 'number' },
        subtotal: {
          type: 'number',
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
        tax: {
          type: 'number',
          'x-formula': { version: 1, expression: 'subtotal * 0.1' },
        },
        total: {
          type: 'number',
          'x-formula': { version: 1, expression: 'subtotal + tax' },
        },
      },
    };

    const result = extractSchemaFormulas(schema);

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.fieldName)).toEqual([
      'subtotal',
      'tax',
      'total',
    ]);
  });

  it('should extract field type', () => {
    const schema = {
      type: 'object',
      properties: {
        price: { type: 'number' },
        formatted: {
          type: 'string',
          'x-formula': { version: 1, expression: 'concat("$", price)' },
        },
        isExpensive: {
          type: 'boolean',
          'x-formula': { version: 1, expression: 'price > 100' },
        },
      },
    };

    const result = extractSchemaFormulas(schema);

    expect(result).toHaveLength(2);
    expect(result.find((f) => f.fieldName === 'formatted')?.fieldType).toBe(
      'string',
    );
    expect(result.find((f) => f.fieldName === 'isExpensive')?.fieldType).toBe(
      'boolean',
    );
  });

  it('should handle schema without properties', () => {
    const schema = { type: 'object' };

    const result = extractSchemaFormulas(schema);

    expect(result).toEqual([]);
  });

  it('should default to string type when type is missing', () => {
    const schema = {
      type: 'object',
      properties: {
        computed: {
          'x-formula': { version: 1, expression: 'value' },
        },
      },
    };

    const result = extractSchemaFormulas(schema);

    expect(result[0]!.fieldType).toBe('string');
  });
});
