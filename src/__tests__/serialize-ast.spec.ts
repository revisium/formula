import { describe, it, expect } from '@jest/globals';
import { parseFormula, serializeAst } from '../ohm';

describe('serializeAst', () => {
  describe('roundtrip', () => {
    const expressions = [
      'a + b',
      '(a + b) * 2',
      'a + b * 2',
      'a * b + c',
      'a * (b + c)',
      '-a',
      '!flag',
      'x ? 1 : 0',
      'MAX(a, b)',
      'obj.field',
      'items[0]',
      'items[*]',
      'items[*].price',
      '../sibling',
      '/root.field',
      '@now',
      '42',
      '3.14',
      '"hello"',
      'true',
      'false',
      'null',
      'a + b + c',
      'a * b * c',
      'a - b - c',
      'a || b || c',
      'a && b && c',
      'a == b',
      'a != b',
      'a > b',
      'a < b',
      'a >= b',
      'a <= b',
      'a % b',
      'a / b',
      'round(price, 2)',
      'sum(items[*].price)',
      'concat(a, " ", b)',
      'if(x > 0, x, 0)',
      'price * (1 + /taxRate)',
      'price * ../discount',
      '../../rootField',
      '../sibling.value',
      '@prev',
      '#index',
      '#index * 10',
      'items[0].price',
      'items[-1]',
      'a + -b',
      '!a && b',
      '!(a && b)',
      'a || b && c',
      '(a || b) && c',
      'a ? b ? 1 : 2 : 3',
      'a ? 1 : b ? 2 : 3',
      'obj.method(x)',
      'items[0].prices[1]',
      '["field-name"]',
      'obj["field-name"].normal',
    ];

    it.each(expressions)('roundtrip: %s', (expr) => {
      const ast = parseFormula(expr).ast;
      const serialized = serializeAst(ast);
      const reparsed = parseFormula(serialized);
      expect(reparsed.ast).toEqual(ast);
    });
  });

  describe('exact output', () => {
    it('should serialize simple addition', () => {
      expect(serializeAst(parseFormula('a + b').ast)).toBe('a + b');
    });

    it('should serialize parenthesized addition in multiplication', () => {
      expect(serializeAst(parseFormula('(a + b) * 2').ast)).toBe('(a + b) * 2');
    });

    it('should not add unnecessary parentheses', () => {
      expect(serializeAst(parseFormula('a + b * 2').ast)).toBe('a + b * 2');
    });

    it('should serialize unary minus', () => {
      expect(serializeAst(parseFormula('-a').ast)).toBe('-a');
    });

    it('should serialize logical not', () => {
      expect(serializeAst(parseFormula('!flag').ast)).toBe('!flag');
    });

    it('should serialize ternary', () => {
      expect(serializeAst(parseFormula('x ? 1 : 0').ast)).toBe('x ? 1 : 0');
    });

    it('should serialize function call', () => {
      expect(serializeAst(parseFormula('MAX(a, b)').ast)).toBe('MAX(a, b)');
    });

    it('should serialize member expression', () => {
      expect(serializeAst(parseFormula('obj.field').ast)).toBe('obj.field');
    });

    it('should serialize index expression', () => {
      expect(serializeAst(parseFormula('items[0]').ast)).toBe('items[0]');
    });

    it('should serialize wildcard expression', () => {
      expect(serializeAst(parseFormula('items[*]').ast)).toBe('items[*]');
    });

    it('should serialize wildcard with member', () => {
      expect(serializeAst(parseFormula('items[*].price').ast)).toBe(
        'items[*].price',
      );
    });

    it('should serialize relative path', () => {
      expect(serializeAst(parseFormula('../sibling').ast)).toBe('../sibling');
    });

    it('should serialize root path', () => {
      expect(serializeAst(parseFormula('/root.field').ast)).toBe('/root.field');
    });

    it('should serialize context token @now', () => {
      expect(serializeAst(parseFormula('@now').ast)).toBe('@now');
    });

    it('should serialize number literal', () => {
      expect(serializeAst(parseFormula('42').ast)).toBe('42');
    });

    it('should serialize string literal', () => {
      expect(serializeAst(parseFormula('"hello"').ast)).toBe('"hello"');
    });

    it('should serialize boolean true', () => {
      expect(serializeAst(parseFormula('true').ast)).toBe('true');
    });

    it('should serialize boolean false', () => {
      expect(serializeAst(parseFormula('false').ast)).toBe('false');
    });

    it('should serialize null', () => {
      expect(serializeAst(parseFormula('null').ast)).toBe('null');
    });

    it('should serialize negative index', () => {
      expect(serializeAst(parseFormula('items[-1]').ast)).toBe('items[-1]');
    });

    it('should serialize context tokens @prev and #index', () => {
      expect(serializeAst(parseFormula('@prev').ast)).toBe('@prev');
      expect(serializeAst(parseFormula('#index').ast)).toBe('#index');
    });

    it('should serialize bracketed identifier', () => {
      expect(serializeAst(parseFormula('["field-name"]').ast)).toBe(
        '["field-name"]',
      );
    });

    it('should serialize multi-level relative path', () => {
      expect(serializeAst(parseFormula('../../rootField').ast)).toBe(
        '../../rootField',
      );
    });

    it('should serialize nested relative path', () => {
      expect(serializeAst(parseFormula('../sibling.value').ast)).toBe(
        '../sibling.value',
      );
    });
  });

  describe('operator precedence', () => {
    it('should not wrap higher precedence in parens', () => {
      expect(serializeAst(parseFormula('a + b * c').ast)).toBe('a + b * c');
    });

    it('should wrap lower precedence in parens when needed', () => {
      expect(serializeAst(parseFormula('(a + b) * c').ast)).toBe('(a + b) * c');
    });

    it('should handle left associativity without parens', () => {
      expect(serializeAst(parseFormula('a - b - c').ast)).toBe('a - b - c');
    });

    it('should wrap right operand when same precedence subtraction', () => {
      expect(serializeAst(parseFormula('a - (b - c)').ast)).toBe('a - (b - c)');
    });

    it('should wrap right operand for division', () => {
      expect(serializeAst(parseFormula('a / (b / c)').ast)).toBe('a / (b / c)');
    });

    it('should handle mixed logical operators', () => {
      expect(serializeAst(parseFormula('a || b && c').ast)).toBe('a || b && c');
      expect(serializeAst(parseFormula('(a || b) && c').ast)).toBe(
        '(a || b) && c',
      );
    });

    it('should wrap ternary in postfix context', () => {
      const ast = parseFormula('(x ? a : b).field').ast;
      expect(serializeAst(ast)).toBe('(x ? a : b).field');
    });

    it('should wrap binary op in unary context', () => {
      expect(serializeAst(parseFormula('-(a + b)').ast)).toBe('-(a + b)');
    });

    it('should wrap ternary inside binary op', () => {
      expect(serializeAst(parseFormula('(x ? 1 : 0) + 1').ast)).toBe(
        '(x ? 1 : 0) + 1',
      );
    });
  });

  describe('complex expressions', () => {
    it('should serialize chained member and index', () => {
      expect(serializeAst(parseFormula('items[0].prices[1]').ast)).toBe(
        'items[0].prices[1]',
      );
    });

    it('should serialize function with complex args', () => {
      expect(serializeAst(parseFormula('max(a * 2, b + c)').ast)).toBe(
        'max(a * 2, b + c)',
      );
    });

    it('should serialize mixed bracket and dot notation', () => {
      expect(serializeAst(parseFormula('obj["field-name"].normal').ast)).toBe(
        'obj["field-name"].normal',
      );
    });

    it('should serialize expression with all path types', () => {
      expect(
        serializeAst(
          parseFormula('price * (1 + /taxRate) * (1 - ../discount)').ast,
        ),
      ).toBe('price * (1 + /taxRate) * (1 - ../discount)');
    });
  });

  describe('string escaping', () => {
    it('should escape backslashes in strings', () => {
      const ast = parseFormula(String.raw`"a\\b"`).ast;
      expect(serializeAst(ast)).toBe(String.raw`"a\\b"`);
    });

    it('should escape quotes in strings', () => {
      const ast = parseFormula(String.raw`"say \"hello\""`).ast;
      expect(serializeAst(ast)).toBe(String.raw`"say \"hello\""`);
    });

    it('should escape newlines in strings (roundtrip)', () => {
      const original = String.raw`"line1\nline2"`;
      const ast = parseFormula(original).ast;
      const serialized = serializeAst(ast);
      const reparsed = parseFormula(serialized).ast;
      expect(reparsed).toEqual(ast);
    });

    it('should escape tabs in strings (roundtrip)', () => {
      const original = String.raw`"col1\tcol2"`;
      const ast = parseFormula(original).ast;
      const serialized = serializeAst(ast);
      const reparsed = parseFormula(serialized).ast;
      expect(reparsed).toEqual(ast);
    });

    it('should escape carriage returns in strings (roundtrip)', () => {
      const original = String.raw`"a\rb"`;
      const ast = parseFormula(original).ast;
      const serialized = serializeAst(ast);
      const reparsed = parseFormula(serialized).ast;
      expect(reparsed).toEqual(ast);
    });
  });

  describe('nested ternary', () => {
    it('should wrap ternary condition that is itself a ternary', () => {
      const ast = parseFormula('(a ? b : c) ? d : e').ast;
      expect(serializeAst(ast)).toBe('(a ? b : c) ? d : e');
    });

    it('should not wrap ternary consequent or alternate', () => {
      const ast = parseFormula('a ? b ? c : d : e').ast;
      expect(serializeAst(ast)).toBe('a ? b ? c : d : e');
    });

    it('should handle deeply nested ternary in condition', () => {
      const ast = parseFormula('((a ? b : c) ? d : e) ? f : g').ast;
      expect(serializeAst(ast)).toBe('((a ? b : c) ? d : e) ? f : g');
    });
  });
});
