import { describe, it, expect } from '@jest/globals';
import { evaluate, evaluateWithContext } from '../ohm';
import {
  compareWithReference,
  generateEvaluateCases,
  generateEvaluateWithContextCases,
  specificationData,
  specificationExpressions,
  specificationItemOptions,
  type EvaluateCase,
  type EvaluateWithContextCase,
} from './support/evaluation-corpus';
import {
  referenceEvaluate,
  referenceEvaluateWithContext,
} from './support/reference-evaluation';

const evaluateCase = ({ expression, context }: EvaluateCase) =>
  evaluate(expression, context);

const referenceEvaluateCase = ({ expression, context }: EvaluateCase) =>
  referenceEvaluate(expression, context);

const evaluateWithContextCase = ({
  expression,
  options,
}: EvaluateWithContextCase) => evaluateWithContext(expression, options);

const referenceEvaluateWithContextCase = ({
  expression,
  options,
}: EvaluateWithContextCase) =>
  referenceEvaluateWithContext(expression, options);

const compareEvaluate = (cases: readonly EvaluateCase[]) =>
  compareWithReference(cases, evaluateCase, referenceEvaluateCase);

const compareEvaluateWithContext = (
  cases: readonly EvaluateWithContextCase[],
) =>
  compareWithReference(
    cases,
    evaluateWithContextCase,
    referenceEvaluateWithContextCase,
  );

const tokenContext = {
  '#index': 1,
  '#length': 3,
  '#first': false,
  '#last': false,
  '@prev': { total: 10 },
  '@next': { total: 90 },
  '#parent.index': 0,
  '#parent.length': 2,
  '#root.index': 0,
  '@root.prev': null,
};

const edgeContext = (): Record<string, unknown> => ({
  p: 2,
  w: '__proto__',
  key: ['__proto__'],
  items: [{ v: 1 }, { v: 2 }],
  matrix: [[1, 2], [3]],
  empty: [],
  nested: {
    v: 3,
    fn: (x: unknown) => [x, 'called'],
    boom: () => {
      throw new TypeError('boom');
    },
  },
  obj: { v: 1, length: 4 },
  text: 'Hello',
  custom: { valueOf: () => 42, toString: () => 'custom' },
  symbol: Symbol('s'),
  topLevelFunction: () => 'filtered out',
});

const EDGE_EXPRESSIONS = [
  '',
  '   ',
  'p +',
  '(p',
  'max(',
  '"open',
  'foo(1)',
  'p(1)',
  'topLevelFunction()',
  'nested.v(1)',
  '(1)(2)',
  'items[0](1)',
  '(max)(1, 5)',
  'constructor(1)',
  'CONSTRUCTOR(2)',
  '__proto__(1)',
  'constructor',
  'hasOwnProperty("p")',
  'valueOf()',
  'toString(1)',
  'text.toUpperCase()',
  'nested.fn(3)',
  'nested.boom()',
  'missing.fn(foo())',
  'nested.fn(foo())',
  'foo(nested.boom())',
  '["__proto__"]',
  'obj["__proto__"]',
  'foo()["__proto__"]',
  'nested.boom()["__proto__"]',
  'obj[w]',
  'obj[key]',
  'obj["length"]',
  'items[-1].v',
  'missing[-1]',
  'items[*].v',
  'matrix[*]',
  'empty[*]',
  'items.v',
  'missing.v.w',
  '1 / 0',
  '-0',
  '0 * -1',
  'p % 0',
  '"5" == 5',
  'null == missing',
  'p > "10"',
  '"a" + 1 + 2',
  '1 + 2 + "a"',
  'true + 1',
  '"a" + custom',
  'custom + 1',
  'custom * 2',
  '"a" + symbol',
  'symbol + 1',
  'p && foo()',
  'p || foo()',
  '0 && foo()',
  'p ? 1 : foo()',
  '!p ? foo() : 2',
  'sum(items[*].v) + count(items)',
  'join(matrix[*], "-")',
  'if(p, "yes", foo())',
];

describe('evaluation equals the reference Ohm semantics', () => {
  it('on the specification examples, with plain and array item contexts', () => {
    const expressions = specificationExpressions();
    const plainCases = expressions.map((expression) => ({
      expression,
      context: { ...specificationData(), ...tokenContext },
    }));
    const itemCases = expressions.map((expression) => ({
      expression,
      options: specificationItemOptions(),
    }));

    expect(compareEvaluate(plainCases).mismatches).toEqual([]);
    expect(compareEvaluateWithContext(itemCases).mismatches).toEqual([]);
  });

  it('on edge cases: syntax errors, calls of non-functions, unsafe names, evaluation order', () => {
    const cases = EDGE_EXPRESSIONS.map((expression) => ({
      expression,
      context: edgeContext(),
    }));
    const coldAndWarm = [...cases, ...cases];

    expect(compareEvaluate(coldAndWarm).mismatches).toEqual([]);
  });

  it('on a context with an own "__proto__" key and on a missing context', () => {
    const ownProtoKey = JSON.parse(
      '{"__proto__": {"p": "from own __proto__ key"}, "q": 1}',
    ) as Record<string, unknown>;
    const missingContext = null as unknown as Record<string, unknown>;
    const cases = [
      { expression: 'p + q', context: ownProtoKey },
      { expression: 'p + 1', context: missingContext },
      { expression: 'p +', context: missingContext },
    ];

    expect(compareEvaluate(cases).mismatches).toEqual([]);
  });

  it('on generated expressions, each evaluated with several contexts', () => {
    const comparison = compareEvaluate(generateEvaluateCases(20261102, 600, 3));

    expect(comparison.referenceThrows).toBeGreaterThan(200);
    expect(comparison.mismatches).toEqual([]);
  });

  it('on generated array item formulas: #index, @prev, ../, /root, wildcards, nested #parent', () => {
    const comparison = compareEvaluateWithContext(
      generateEvaluateWithContextCases(7, 300, 3),
    );

    expect(comparison.referenceThrows).toBeGreaterThan(30);
    expect(comparison.mismatches).toEqual([]);
  });

  it('on invalid options passed to evaluateWithContext', () => {
    const cases = [
      { expression: 'p +', options: undefined },
      { expression: '', options: undefined },
      { expression: '../p + 1', options: { rootData: null } },
      {
        expression: '#index',
        options: { rootData: {}, arrayContext: { levels: [] } },
      },
    ] as unknown as EvaluateWithContextCase[];

    expect(compareEvaluateWithContext(cases).mismatches).toEqual([]);
  });
});
