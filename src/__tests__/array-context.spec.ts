import { describe, it, expect } from '@jest/globals';
import { evaluateWithContext, parseFormula } from '../ohm';
import type { ArrayContext, ArrayLevelContext } from '../types';

describe('array context tokens', () => {
  const createArrayLevel = (
    index: number,
    length: number,
    array: unknown[],
  ): ArrayLevelContext => ({
    index,
    length,
    prev: index > 0 ? array[index - 1] : null,
    next: index < length - 1 ? array[index + 1] : null,
  });

  describe('parsing', () => {
    it('should parse #index', () => {
      const result = parseFormula('#index');
      expect(result.features).toContain('context_token');
    });

    it('should parse #length', () => {
      const result = parseFormula('#length');
      expect(result.features).toContain('context_token');
    });

    it('should parse #first', () => {
      const result = parseFormula('#first');
      expect(result.features).toContain('context_token');
    });

    it('should parse #last', () => {
      const result = parseFormula('#last');
      expect(result.features).toContain('context_token');
    });

    it('should parse #parent.index', () => {
      const result = parseFormula('#parent.index');
      expect(result.features).toContain('context_token');
    });

    it('should parse #parent.length', () => {
      const result = parseFormula('#parent.length');
      expect(result.features).toContain('context_token');
    });

    it('should parse #parent.parent.index', () => {
      const result = parseFormula('#parent.parent.index');
      expect(result.features).toContain('context_token');
    });

    it('should parse #root.index', () => {
      const result = parseFormula('#root.index');
      expect(result.features).toContain('context_token');
    });

    it('should parse #root.length', () => {
      const result = parseFormula('#root.length');
      expect(result.features).toContain('context_token');
    });

    it('should parse @prev', () => {
      const result = parseFormula('@prev');
      expect(result.features).toContain('context_token');
    });

    it('should parse @next', () => {
      const result = parseFormula('@next');
      expect(result.features).toContain('context_token');
    });

    it('should parse @parent.prev', () => {
      const result = parseFormula('@parent.prev');
      expect(result.features).toContain('context_token');
    });

    it('should parse @root.prev', () => {
      const result = parseFormula('@root.prev');
      expect(result.features).toContain('context_token');
    });

    it('should not include context tokens in dependencies', () => {
      const result = parseFormula('#index + value');
      expect(result.dependencies).toContain('value');
      expect(result.dependencies).not.toContain('#index');
    });
  });

  describe('evaluation - single level array', () => {
    const array = [10, 20, 30, 40, 50];

    it('should evaluate #index at first element', () => {
      const result = evaluateWithContext('#index', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 5, array)] },
      });
      expect(result).toBe(0);
    });

    it('should evaluate #index at middle element', () => {
      const result = evaluateWithContext('#index', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(2);
    });

    it('should evaluate #index at last element', () => {
      const result = evaluateWithContext('#index', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(4, 5, array)] },
      });
      expect(result).toBe(4);
    });

    it('should evaluate #length', () => {
      const result = evaluateWithContext('#length', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(5);
    });

    it('should evaluate #first as true at first element', () => {
      const result = evaluateWithContext('#first', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 5, array)] },
      });
      expect(result).toBe(true);
    });

    it('should evaluate #first as false at middle element', () => {
      const result = evaluateWithContext('#first', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(false);
    });

    it('should evaluate #last as true at last element', () => {
      const result = evaluateWithContext('#last', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(4, 5, array)] },
      });
      expect(result).toBe(true);
    });

    it('should evaluate #last as false at first element', () => {
      const result = evaluateWithContext('#last', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 5, array)] },
      });
      expect(result).toBe(false);
    });

    it('should evaluate @prev at middle element', () => {
      const result = evaluateWithContext('@prev', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(20);
    });

    it('should evaluate @prev as null at first element', () => {
      const result = evaluateWithContext('@prev', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 5, array)] },
      });
      expect(result).toBe(null);
    });

    it('should evaluate @next at middle element', () => {
      const result = evaluateWithContext('@next', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(40);
    });

    it('should evaluate @next as null at last element', () => {
      const result = evaluateWithContext('@next', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(4, 5, array)] },
      });
      expect(result).toBe(null);
    });
  });

  describe('evaluation - nested arrays', () => {
    const outerArray = [
      { items: [1, 2, 3] },
      { items: [4, 5] },
      { items: [6, 7, 8, 9] },
    ];

    it('should evaluate #index for inner array', () => {
      const innerArray = outerArray[1]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(0, 2, innerArray),
          createArrayLevel(1, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(0);
    });

    it('should evaluate #parent.index for parent array', () => {
      const innerArray = outerArray[1]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(0, 2, innerArray),
          createArrayLevel(1, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#parent.index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(1);
    });

    it('should evaluate #parent.length for parent array', () => {
      const innerArray = outerArray[1]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(0, 2, innerArray),
          createArrayLevel(1, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#parent.length', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(3);
    });

    it('should evaluate #parent.first', () => {
      const innerArray = outerArray[0]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(1, 3, innerArray),
          createArrayLevel(0, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#parent.first', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(true);
    });

    it('should evaluate #parent.last', () => {
      const innerArray = outerArray[2]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(0, 4, innerArray),
          createArrayLevel(2, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#parent.last', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(true);
    });

    it('should evaluate #root.index as same as #parent.index for 2-level nesting', () => {
      const innerArray = outerArray[1]!.items;
      const arrayContext: ArrayContext = {
        levels: [
          createArrayLevel(0, 2, innerArray),
          createArrayLevel(1, 3, outerArray),
        ],
      };
      const result = evaluateWithContext('#root.index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(1);
    });
  });

  describe('evaluation - three level nesting', () => {
    const level1 = [{ name: 'L1-0' }, { name: 'L1-1' }, { name: 'L1-2' }];
    const level2 = [{ name: 'L2-0' }, { name: 'L2-1' }];
    const level3 = [
      { name: 'L3-0' },
      { name: 'L3-1' },
      { name: 'L3-2' },
      { name: 'L3-3' },
    ];

    const arrayContext: ArrayContext = {
      levels: [
        createArrayLevel(2, 4, level3),
        createArrayLevel(0, 2, level2),
        createArrayLevel(1, 3, level1),
      ],
    };

    it('should evaluate #index for innermost level', () => {
      const result = evaluateWithContext('#index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(2);
    });

    it('should evaluate #parent.index for middle level', () => {
      const result = evaluateWithContext('#parent.index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(0);
    });

    it('should evaluate #parent.parent.index for outermost level', () => {
      const result = evaluateWithContext('#parent.parent.index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(1);
    });

    it('should evaluate #root.index as outermost level index', () => {
      const result = evaluateWithContext('#root.index', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(1);
    });

    it('should evaluate #root.length as outermost level length', () => {
      const result = evaluateWithContext('#root.length', {
        rootData: {},
        arrayContext,
      });
      expect(result).toBe(3);
    });
  });

  describe('evaluation - complex expressions', () => {
    const array = [10, 20, 30, 40, 50];

    it('should use #index in arithmetic', () => {
      const result = evaluateWithContext('#index * 10', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(20);
    });

    it('should use #first in conditional', () => {
      const result = evaluateWithContext('if(#first, "First", "Not first")', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 5, array)] },
      });
      expect(result).toBe('First');
    });

    it('should use @prev for running total pattern', () => {
      const objectArray = [
        { value: 10, total: 10 },
        { value: 20, total: 30 },
        { value: 15, total: 45 },
      ];
      const result = evaluateWithContext(
        'if(#first, value, @prev.total + value)',
        {
          rootData: {},
          itemData: { value: 15, total: 0 },
          arrayContext: { levels: [createArrayLevel(2, 3, objectArray)] },
        },
      );
      expect(result).toBe(45);
    });

    it('should combine #index with #length', () => {
      const result = evaluateWithContext('#index + 1 + " of " + #length', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe('3 of 5');
    });

    it('should use @next in delta calculation', () => {
      const result = evaluateWithContext('if(#last, 0, @next - value)', {
        rootData: {},
        itemData: { value: 30 },
        arrayContext: { levels: [createArrayLevel(2, 5, array)] },
      });
      expect(result).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should return undefined for #index without array context', () => {
      const result = evaluateWithContext('#index', {
        rootData: {},
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined for #parent.index in single level array', () => {
      const result = evaluateWithContext('#parent.index', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(0, 3, [1, 2, 3])] },
      });
      expect(result).toBeUndefined();
    });

    it('should handle single element array', () => {
      const array = [42];
      const arrayContext: ArrayContext = {
        levels: [createArrayLevel(0, 1, array)],
      };
      expect(
        evaluateWithContext('#first', { rootData: {}, arrayContext }),
      ).toBe(true);
      expect(evaluateWithContext('#last', { rootData: {}, arrayContext })).toBe(
        true,
      );
      expect(evaluateWithContext('@prev', { rootData: {}, arrayContext })).toBe(
        null,
      );
      expect(evaluateWithContext('@next', { rootData: {}, arrayContext })).toBe(
        null,
      );
    });

    it('should work with object array elements in @prev', () => {
      const array = [
        { name: 'first', value: 10 },
        { name: 'second', value: 20 },
        { name: 'third', value: 30 },
      ];
      const result = evaluateWithContext('@prev.value', {
        rootData: {},
        arrayContext: { levels: [createArrayLevel(2, 3, array)] },
      });
      expect(result).toBe(20);
    });
  });
});
