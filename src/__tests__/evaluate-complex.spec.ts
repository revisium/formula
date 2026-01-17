import { describe, it, expect } from '@jest/globals';
import { evaluate } from '../parser';

describe('evaluate - complex expressions', () => {
  describe('operators', () => {
    describe('arithmetic operators', () => {
      it('should handle + for numbers', () => {
        expect(evaluate('1 + 2', {})).toBe(3);
        expect(evaluate('a + b', { a: 10, b: 20 })).toBe(30);
      });

      it('should handle + for string concatenation', () => {
        expect(evaluate('"hello" + " " + "world"', {})).toBe('hello world');
        expect(evaluate('a + b', { a: 'foo', b: 'bar' })).toBe('foobar');
      });

      it('should handle -', () => {
        expect(evaluate('10 - 3', {})).toBe(7);
        expect(evaluate('a - b', { a: 100, b: 30 })).toBe(70);
      });

      it('should handle *', () => {
        expect(evaluate('3 * 4', {})).toBe(12);
        expect(evaluate('price * quantity', { price: 10, quantity: 5 })).toBe(50);
      });

      it('should handle /', () => {
        expect(evaluate('20 / 4', {})).toBe(5);
        expect(evaluate('total / count', { total: 100, count: 4 })).toBe(25);
      });

      it('should handle %', () => {
        expect(evaluate('10 % 3', {})).toBe(1);
        expect(evaluate('a % b', { a: 17, b: 5 })).toBe(2);
      });

      it('should handle unary -', () => {
        expect(evaluate('-5', {})).toBe(-5);
        expect(evaluate('-a', { a: 10 })).toBe(-10);
        expect(evaluate('a + -b', { a: 10, b: 3 })).toBe(7);
      });
    });

    describe('comparison operators', () => {
      it('should handle >', () => {
        expect(evaluate('5 > 3', {})).toBe(true);
        expect(evaluate('3 > 5', {})).toBe(false);
        expect(evaluate('a > b', { a: 10, b: 5 })).toBe(true);
      });

      it('should handle <', () => {
        expect(evaluate('3 < 5', {})).toBe(true);
        expect(evaluate('5 < 3', {})).toBe(false);
      });

      it('should handle >=', () => {
        expect(evaluate('5 >= 5', {})).toBe(true);
        expect(evaluate('5 >= 4', {})).toBe(true);
        expect(evaluate('4 >= 5', {})).toBe(false);
      });

      it('should handle <=', () => {
        expect(evaluate('5 <= 5', {})).toBe(true);
        expect(evaluate('4 <= 5', {})).toBe(true);
        expect(evaluate('5 <= 4', {})).toBe(false);
      });

      it('should handle ==', () => {
        expect(evaluate('5 == 5', {})).toBe(true);
        expect(evaluate('5 == 6', {})).toBe(false);
        expect(evaluate('"a" == "a"', {})).toBe(true);
      });

      it('should handle !=', () => {
        expect(evaluate('5 != 6', {})).toBe(true);
        expect(evaluate('5 != 5', {})).toBe(false);
      });

    });

    describe('logical operators', () => {
      it('should handle &&', () => {
        expect(evaluate('1 && 1', {})).toBe(1);
        expect(evaluate('1 && 0', {})).toBe(0);
        expect(evaluate('a && b', { a: true, b: true })).toBe(true);
        expect(evaluate('a && b', { a: true, b: false })).toBe(false);
      });

      it('should handle ||', () => {
        expect(evaluate('1 || 0', {})).toBe(1);
        expect(evaluate('0 || 1', {})).toBe(1);
        expect(evaluate('0 || 0', {})).toBe(0);
        expect(evaluate('a || b', { a: false, b: true })).toBe(true);
      });

      it('should handle !', () => {
        expect(evaluate('!0', {})).toBe(true);
        expect(evaluate('!1', {})).toBe(false);
        expect(evaluate('!a', { a: false })).toBe(true);
      });

      it('should handle and()', () => {
        expect(evaluate('and(1, 1)', {})).toBe(true);
        expect(evaluate('and(1, 0)', {})).toBe(false);
        expect(evaluate('and(a, b)', { a: true, b: true })).toBe(true);
      });

      it('should handle or()', () => {
        expect(evaluate('or(1, 0)', {})).toBe(true);
        expect(evaluate('or(0, 0)', {})).toBe(false);
        expect(evaluate('or(a, b)', { a: false, b: true })).toBe(true);
      });

      it('should handle not()', () => {
        expect(evaluate('not(0)', {})).toBe(true);
        expect(evaluate('not(1)', {})).toBe(false);
        expect(evaluate('not(a)', { a: true })).toBe(false);
      });
    });

    describe('parentheses', () => {
      it('should respect operator precedence with parentheses', () => {
        expect(evaluate('2 + 3 * 4', {})).toBe(14);
        expect(evaluate('(2 + 3) * 4', {})).toBe(20);
        expect(evaluate('10 / (2 + 3)', {})).toBe(2);
        expect(evaluate('(a + b) * c', { a: 2, b: 3, c: 4 })).toBe(20);
      });
    });
  });

  describe('combined expressions', () => {
    describe('e-commerce calculations', () => {
      it('should calculate total with tax', () => {
        const context = { price: 100, quantity: 3, taxRate: 0.1 };
        expect(evaluate('price * quantity * (1 + taxRate)', context)).toBe(330);
      });

      it('should calculate discount price', () => {
        const context = { price: 200, discount: 0.15 };
        expect(evaluate('price * (1 - discount)', context)).toBe(170);
      });

      it('should calculate order summary', () => {
        const context = {
          items: [
            { price: 10, qty: 2 },
            { price: 20, qty: 1 },
            { price: 5, qty: 4 },
          ],
        };
        expect(
          evaluate(
            'items[0].price * items[0].qty + items[1].price * items[1].qty + items[2].price * items[2].qty',
            context,
          ),
        ).toBe(60);
      });

      it('should format price string', () => {
        const context = { price: 99.99, currency: 'USD' };
        expect(evaluate('concat("$", price, " ", currency)', context)).toBe(
          '$99.99 USD',
        );
      });

      it('should show stock status', () => {
        expect(
          evaluate('if(stock > 0, "In Stock", "Out of Stock")', { stock: 10 }),
        ).toBe('In Stock');
        expect(
          evaluate('if(stock > 0, "In Stock", "Out of Stock")', { stock: 0 }),
        ).toBe('Out of Stock');
      });

      it('should calculate shipping tier', () => {
        const expr =
          'if(total >= 100, "Free", if(total >= 50, "$5.99", "$9.99"))';
        expect(evaluate(expr, { total: 150 })).toBe('Free');
        expect(evaluate(expr, { total: 75 })).toBe('$5.99');
        expect(evaluate(expr, { total: 25 })).toBe('$9.99');
      });
    });

    describe('string manipulations', () => {
      it('should build full name', () => {
        const context = { firstName: 'John', lastName: 'Doe' };
        expect(evaluate('firstName + " " + lastName', context)).toBe('John Doe');
        expect(evaluate('concat(firstName, " ", lastName)', context)).toBe(
          'John Doe',
        );
      });

      it('should format name with title', () => {
        const context = { title: 'Mr', firstName: 'John', lastName: 'Doe' };
        expect(
          evaluate('concat(title, ". ", firstName, " ", lastName)', context),
        ).toBe('Mr. John Doe');
      });

      it('should create initials', () => {
        const context = { firstName: 'John', lastName: 'Doe' };
        expect(
          evaluate(
            'concat(upper(left(firstName, 1)), upper(left(lastName, 1)))',
            context,
          ),
        ).toBe('JD');
      });

      it('should normalize and compare strings', () => {
        const context = { input: '  HELLO  ', expected: 'hello' };
        expect(evaluate('lower(trim(input)) == expected', context)).toBe(true);
      });

      it('should check email domain', () => {
        expect(
          evaluate('endswith(email, "@company.com")', {
            email: 'user@company.com',
          }),
        ).toBe(true);
        expect(
          evaluate('endswith(email, "@company.com")', {
            email: 'user@other.com',
          }),
        ).toBe(false);
      });

      it('should validate phone format', () => {
        expect(
          evaluate('startswith(phone, "+1") && length(phone) == 12', {
            phone: '+1234567890',
          }),
        ).toBe(false);
        expect(
          evaluate('startswith(phone, "+1") && length(phone) == 12', {
            phone: '+12345678901',
          }),
        ).toBe(true);
      });
    });

    describe('array operations', () => {
      it('should calculate cart total', () => {
        const context = { prices: [10, 20, 30, 40] };
        expect(evaluate('sum(prices)', context)).toBe(100);
      });

      it('should calculate average score', () => {
        const context = { scores: [85, 90, 78, 92, 88] };
        expect(evaluate('avg(scores)', context)).toBe(86.6);
      });

      it('should find min/max in array context', () => {
        const context = { a: 10, b: 5, c: 15 };
        expect(evaluate('min(a, b, c)', context)).toBe(5);
        expect(evaluate('max(a, b, c)', context)).toBe(15);
      });

      it('should check array membership', () => {
        const context = { tags: ['featured', 'sale', 'new'] };
        expect(evaluate('includes(tags, "featured")', context)).toBe(true);
        expect(evaluate('includes(tags, "archived")', context)).toBe(false);
      });

      it('should join array with separator', () => {
        const context = { tags: ['red', 'blue', 'green'] };
        expect(evaluate('join(tags, ", ")', context)).toBe('red, blue, green');
      });

      it('should get first and last elements', () => {
        const context = { items: ['a', 'b', 'c', 'd'] };
        expect(evaluate('first(items)', context)).toBe('a');
        expect(evaluate('last(items)', context)).toBe('d');
      });

      it('should count and check emptiness', () => {
        expect(evaluate('count(items) > 0', { items: [1, 2, 3] })).toBe(true);
        expect(evaluate('count(items) == 0', { items: [] })).toBe(true);
      });
    });

    describe('nested object access', () => {
      it('should access deeply nested properties', () => {
        const context = {
          user: {
            profile: {
              address: {
                city: 'New York',
                zip: '10001',
              },
            },
          },
        };
        expect(evaluate('user.profile.address.city', context)).toBe('New York');
        expect(evaluate('user.profile.address.zip', context)).toBe('10001');
      });

      it('should combine nested access with operations', () => {
        const context = {
          order: {
            items: [{ price: 10 }, { price: 20 }, { price: 30 }],
            shipping: 5,
          },
        };
        expect(
          evaluate(
            'order.items[0].price + order.items[1].price + order.shipping',
            context,
          ),
        ).toBe(35);
      });

      it('should access array elements in nested structure', () => {
        const context = {
          data: {
            matrix: [
              [1, 2, 3],
              [4, 5, 6],
            ],
          },
        };
        expect(evaluate('data.matrix[0][0]', context)).toBe(1);
        expect(evaluate('data.matrix[1][2]', context)).toBe(6);
      });
    });

    describe('conditional logic', () => {
      it('should handle complex conditionals', () => {
        const expr =
          'if(age >= 65, "Senior", if(age >= 18, "Adult", "Minor"))';
        expect(evaluate(expr, { age: 70 })).toBe('Senior');
        expect(evaluate(expr, { age: 30 })).toBe('Adult');
        expect(evaluate(expr, { age: 10 })).toBe('Minor');
      });

      it('should combine conditions with logical operators', () => {
        const context = { age: 25, hasLicense: true, hasInsurance: true };
        expect(
          evaluate('age >= 18 && hasLicense && hasInsurance', context),
        ).toBe(true);

        context.hasInsurance = false;
        expect(
          evaluate('age >= 18 && hasLicense && hasInsurance', context),
        ).toBe(false);
      });

      it('should use coalesce for fallback values', () => {
        expect(
          evaluate('coalesce(nickname, name, "Anonymous")', {
            nickname: null,
            name: 'John',
          }),
        ).toBe('John');
        expect(
          evaluate('coalesce(nickname, name, "Anonymous")', {
            nickname: null,
            name: null,
          }),
        ).toBe('Anonymous');
        expect(
          evaluate('coalesce(nickname, name, "Anonymous")', {
            nickname: 'Johnny',
            name: 'John',
          }),
        ).toBe('Johnny');
      });

      it('should check for null values', () => {
        expect(
          evaluate('if(isnull(value), "N/A", value)', { value: null }),
        ).toBe('N/A');
        expect(evaluate('if(isnull(value), "N/A", value)', { value: 42 })).toBe(
          42,
        );
      });
    });

    describe('numeric calculations', () => {
      it('should calculate percentage', () => {
        const context = { part: 25, whole: 200 };
        expect(evaluate('(part / whole) * 100', context)).toBe(12.5);
      });

      it('should round currency', () => {
        expect(evaluate('round(price * 1.0825, 2)', { price: 19.99 })).toBe(
          21.64,
        );
      });

      it('should calculate compound interest', () => {
        const context = { principal: 1000, rate: 0.05, years: 3 };
        const result = evaluate(
          'round(principal * pow(1 + rate, years), 2)',
          context,
        );
        expect(result).toBe(1157.63);
      });

      it('should calculate distance', () => {
        const context = { x1: 0, y1: 0, x2: 3, y2: 4 };
        const result = evaluate(
          'sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2))',
          context,
        );
        expect(result).toBe(5);
      });

      it('should normalize value to range', () => {
        const context = { value: 75, min: 0, max: 100 };
        expect(evaluate('(value - min) / (max - min)', context)).toBe(0.75);
      });

      it('should clamp value', () => {
        expect(evaluate('max(0, min(100, value))', { value: 150 })).toBe(100);
        expect(evaluate('max(0, min(100, value))', { value: -50 })).toBe(0);
        expect(evaluate('max(0, min(100, value))', { value: 50 })).toBe(50);
      });
    });

    describe('real-world scenarios', () => {
      it('should calculate BMI', () => {
        const context = { weight: 70, height: 1.75 };
        const result = evaluate(
          'round(weight / pow(height, 2), 1)',
          context,
        );
        expect(result).toBe(22.9);
      });

      it('should format address', () => {
        const context = {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zip: '02101',
        };
        expect(
          evaluate('concat(street, ", ", city, ", ", state, " ", zip)', context),
        ).toBe('123 Main St, Boston, MA 02101');
      });

      it('should calculate age from birth year', () => {
        const context = { birthYear: 1990, currentYear: 2024 };
        expect(evaluate('currentYear - birthYear', context)).toBe(34);
      });

      it('should determine grade letter', () => {
        const expr =
          'if(score >= 90, "A", if(score >= 80, "B", if(score >= 70, "C", if(score >= 60, "D", "F"))))';
        expect(evaluate(expr, { score: 95 })).toBe('A');
        expect(evaluate(expr, { score: 85 })).toBe('B');
        expect(evaluate(expr, { score: 75 })).toBe('C');
        expect(evaluate(expr, { score: 65 })).toBe('D');
        expect(evaluate(expr, { score: 55 })).toBe('F');
      });

      it('should validate password strength', () => {
        const expr = 'length(password) >= 8 && contains(password, "!")';
        expect(evaluate(expr, { password: 'weak' })).toBe(false);
        expect(evaluate(expr, { password: 'StrongPass!' })).toBe(true);
        expect(evaluate(expr, { password: 'NoSpecialChar' })).toBe(false);
      });

      it('should calculate reading time', () => {
        const context = { wordCount: 1500, wordsPerMinute: 200 };
        expect(
          evaluate('ceil(wordCount / wordsPerMinute)', context),
        ).toBe(8);
      });

      it('should format currency with sign', () => {
        expect(
          evaluate('concat(if(amount >= 0, "+$", "-$"), abs(amount))', {
            amount: 50,
          }),
        ).toBe('+$50');
        expect(
          evaluate('concat(if(amount >= 0, "+$", "-$"), abs(amount))', {
            amount: -30,
          }),
        ).toBe('-$30');
      });

      it('should build search query', () => {
        const context = {
          term: 'javascript',
          category: 'programming',
          limit: 10,
        };
        expect(
          evaluate(
            'concat("q=", term, "&cat=", category, "&limit=", limit)',
            context,
          ),
        ).toBe('q=javascript&cat=programming&limit=10');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(evaluate('length(s)', { s: '' })).toBe(0);
      expect(evaluate('s + "suffix"', { s: '' })).toBe('suffix');
    });

    it('should handle zero', () => {
      expect(evaluate('n + 1', { n: 0 })).toBe(1);
      expect(evaluate('n * 100', { n: 0 })).toBe(0);
      expect(evaluate('10 / n', { n: 0 })).toBe(Infinity);
    });

    it('should handle negative numbers', () => {
      expect(evaluate('abs(n)', { n: -5 })).toBe(5);
      expect(evaluate('sign(n)', { n: -10 })).toBe(-1);
    });

    it('should handle empty arrays', () => {
      expect(evaluate('sum(arr)', { arr: [] })).toBe(0);
      expect(evaluate('avg(arr)', { arr: [] })).toBe(0);
      expect(evaluate('count(arr)', { arr: [] })).toBe(0);
      expect(evaluate('first(arr)', { arr: [] })).toBeUndefined();
      expect(evaluate('last(arr)', { arr: [] })).toBeUndefined();
    });

    it('should handle special float values', () => {
      expect(evaluate('n + 1', { n: Infinity })).toBe(Infinity);
      expect(Number.isNaN(evaluate('n + 1', { n: NaN }))).toBe(true);
    });

    it('should handle boolean coercion', () => {
      expect(evaluate('if(s, "truthy", "falsy")', { s: '' })).toBe('falsy');
      expect(evaluate('if(s, "truthy", "falsy")', { s: 'hello' })).toBe(
        'truthy',
      );
      expect(evaluate('if(n, "truthy", "falsy")', { n: 0 })).toBe('falsy');
      expect(evaluate('if(n, "truthy", "falsy")', { n: 1 })).toBe('truthy');
    });

    it('should handle type coercion in comparisons', () => {
      expect(evaluate('"5" == 5', {})).toBe(true);
      expect(evaluate('"5" != 5', {})).toBe(false);
    });

    it('should handle deeply nested expressions', () => {
      expect(
        evaluate('((((a + b) * c) - d) / e)', {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5,
        }),
      ).toBe(1);
    });
  });
});
