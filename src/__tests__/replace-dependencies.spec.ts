import { describe, it, expect } from '@jest/globals';
import { parseFormula, serializeAst, replaceDependencies } from '../ohm';

describe('replaceDependencies', () => {
  describe('simple identifiers', () => {
    it('should replace a simple identifier', () => {
      const ast = parseFormula('price * quantity + 10').ast;
      const newAst = replaceDependencies(ast, { price: 'cost' });
      expect(serializeAst(newAst)).toBe('cost * quantity + 10');
    });

    it('should replace multiple identifiers', () => {
      const ast = parseFormula('price * quantity + 10').ast;
      const newAst = replaceDependencies(ast, {
        price: 'cost',
        quantity: 'qty',
      });
      expect(serializeAst(newAst)).toBe('cost * qty + 10');
    });

    it('should leave unmatched identifiers unchanged', () => {
      const ast = parseFormula('price * quantity + 10').ast;
      const newAst = replaceDependencies(ast, { price: 'cost' });
      expect(serializeAst(newAst)).toBe('cost * quantity + 10');
    });

    it('should not modify original AST', () => {
      const ast = parseFormula('price * quantity').ast;
      const original = serializeAst(ast);
      replaceDependencies(ast, { price: 'cost' });
      expect(serializeAst(ast)).toBe(original);
    });
  });

  describe('identifier to other path types', () => {
    it('should replace identifier with relative path', () => {
      const ast = parseFormula('price * quantity + 10').ast;
      const newAst = replaceDependencies(ast, {
        price: '../cost',
        quantity: '../qty',
      });
      expect(serializeAst(newAst)).toBe('../cost * ../qty + 10');
    });

    it('should replace identifier with root path', () => {
      const ast = parseFormula('price * 2').ast;
      const newAst = replaceDependencies(ast, { price: '/globalPrice' });
      expect(serializeAst(newAst)).toBe('/globalPrice * 2');
    });

    it('should replace identifier with compound path', () => {
      const ast = parseFormula('price + 10').ast;
      const newAst = replaceDependencies(ast, { price: 'obj.field' });
      expect(serializeAst(newAst)).toBe('obj.field + 10');
    });
  });

  describe('compound paths (MemberExpression chains)', () => {
    it('should replace dot-notation path', () => {
      const ast = parseFormula('stats.damage * 2').ast;
      const newAst = replaceDependencies(ast, {
        'stats.damage': 'stats.attack',
      });
      expect(serializeAst(newAst)).toBe('stats.attack * 2');
    });

    it('should replace deep nested path', () => {
      const ast = parseFormula('user.profile.name + " test"').ast;
      const newAst = replaceDependencies(ast, {
        'user.profile.name': 'account.info.displayName',
      });
      expect(serializeAst(newAst)).toBe('account.info.displayName + " test"');
    });
  });

  describe('wildcard paths', () => {
    it('should replace wildcard path', () => {
      const ast = parseFormula('items[*].price * 2').ast;
      const newAst = replaceDependencies(ast, {
        'items[*].price': 'products[*].cost',
      });
      expect(serializeAst(newAst)).toBe('products[*].cost * 2');
    });

    it('should replace simple wildcard', () => {
      const ast = parseFormula('sum(items[*])').ast;
      const newAst = replaceDependencies(ast, { 'items[*]': 'values[*]' });
      expect(serializeAst(newAst)).toBe('sum(values[*])');
    });
  });

  describe('index paths', () => {
    it('should replace indexed path', () => {
      const ast = parseFormula('items[0].price + 10').ast;
      const newAst = replaceDependencies(ast, {
        'items[0].price': 'products[0].cost',
      });
      expect(serializeAst(newAst)).toBe('products[0].cost + 10');
    });

    it('should replace negative indexed path', () => {
      const ast = parseFormula('items[-1].name').ast;
      const newAst = replaceDependencies(ast, {
        'items[-1].name': 'list[-1].title',
      });
      expect(serializeAst(newAst)).toBe('list[-1].title');
    });
  });

  describe('root paths', () => {
    it('should replace root path', () => {
      const ast = parseFormula('price * (1 + /taxRate)').ast;
      const newAst = replaceDependencies(ast, { '/taxRate': '/vatRate' });
      expect(serializeAst(newAst)).toBe('price * (1 + /vatRate)');
    });

    it('should replace nested root path', () => {
      const ast = parseFormula('/config.tax * price').ast;
      const newAst = replaceDependencies(ast, {
        '/config.tax': '/settings.vat',
      });
      expect(serializeAst(newAst)).toBe('/settings.vat * price');
    });
  });

  describe('relative paths', () => {
    it('should replace relative path', () => {
      const ast = parseFormula('../discount * price').ast;
      const newAst = replaceDependencies(ast, {
        '../discount': '../rebate',
      });
      expect(serializeAst(newAst)).toBe('../rebate * price');
    });

    it('should replace multi-level relative path', () => {
      const ast = parseFormula('../../rate * value').ast;
      const newAst = replaceDependencies(ast, {
        '../../rate': '../../factor',
      });
      expect(serializeAst(newAst)).toBe('../../factor * value');
    });

    it('should replace relative path with simple identifier', () => {
      const ast = parseFormula('../cost * 2').ast;
      const newAst = replaceDependencies(ast, { '../cost': 'price' });
      expect(serializeAst(newAst)).toBe('price * 2');
    });
  });

  describe('bracketed identifiers', () => {
    it('should replace bracketed identifier', () => {
      const ast = parseFormula('["field-name"] + 10').ast;
      const newAst = replaceDependencies(ast, {
        '["field-name"]': '["new-field"]',
      });
      expect(serializeAst(newAst)).toBe('["new-field"] + 10');
    });

    it('should replace bracketed identifier with simple identifier', () => {
      const ast = parseFormula('["old-field"] * 2').ast;
      const newAst = replaceDependencies(ast, { '["old-field"]': 'newField' });
      expect(serializeAst(newAst)).toBe('newField * 2');
    });
  });

  describe('function arguments', () => {
    it('should replace dependencies inside function arguments', () => {
      const ast = parseFormula('max(price, minPrice)').ast;
      const newAst = replaceDependencies(ast, {
        price: 'cost',
        minPrice: 'minCost',
      });
      expect(serializeAst(newAst)).toBe('max(cost, minCost)');
    });

    it('should replace wildcard path in function argument', () => {
      const ast = parseFormula('sum(items[*].price)').ast;
      const newAst = replaceDependencies(ast, {
        'items[*].price': 'products[*].cost',
      });
      expect(serializeAst(newAst)).toBe('sum(products[*].cost)');
    });
  });

  describe('ternary and unary', () => {
    it('should replace in ternary branches', () => {
      const ast = parseFormula('flag ? price : fallback').ast;
      const newAst = replaceDependencies(ast, {
        price: 'cost',
        fallback: 'defaultCost',
      });
      expect(serializeAst(newAst)).toBe('flag ? cost : defaultCost');
    });

    it('should replace in unary argument', () => {
      const ast = parseFormula('-price + 10').ast;
      const newAst = replaceDependencies(ast, { price: 'cost' });
      expect(serializeAst(newAst)).toBe('-cost + 10');
    });
  });

  describe('edge cases', () => {
    it('should handle empty replacements', () => {
      const ast = parseFormula('price * quantity').ast;
      const newAst = replaceDependencies(ast, {});
      expect(serializeAst(newAst)).toBe('price * quantity');
    });

    it('should replace compound path with simple identifier', () => {
      const ast = parseFormula('items[*].price * 2').ast;
      const newAst = replaceDependencies(ast, {
        'items[*].price': 'totalPrice',
      });
      expect(serializeAst(newAst)).toBe('totalPrice * 2');
    });

    it('should replace simple identifier with compound path', () => {
      const ast = parseFormula('price + 5').ast;
      const newAst = replaceDependencies(ast, {
        price: 'items[*].cost',
      });
      expect(serializeAst(newAst)).toBe('items[*].cost + 5');
    });

    it('should not replace literals', () => {
      const ast = parseFormula('42 + "hello" + true + null').ast;
      const newAst = replaceDependencies(ast, { '42': 'x', hello: 'y' });
      expect(serializeAst(newAst)).toBe('42 + "hello" + true + null');
    });

    it('should not replace context tokens', () => {
      const ast = parseFormula('@prev + #index').ast;
      const newAst = replaceDependencies(ast, {
        '@prev': 'x',
        '#index': 'y',
      });
      expect(serializeAst(newAst)).toBe('@prev + #index');
    });

    it('should not replace function names', () => {
      const ast = parseFormula('max(a, b)').ast;
      const newAst = replaceDependencies(ast, { max: 'min' });
      expect(serializeAst(newAst)).toBe('min(a, b)');
    });

    it('should handle replacement producing valid dependencies', () => {
      const ast = parseFormula('price * quantity + 10').ast;
      const newAst = replaceDependencies(ast, {
        price: '../cost',
        quantity: '../qty',
      });
      const result = parseFormula(serializeAst(newAst));
      expect(result.dependencies).toContain('../cost');
      expect(result.dependencies).toContain('../qty');
    });
  });
});
