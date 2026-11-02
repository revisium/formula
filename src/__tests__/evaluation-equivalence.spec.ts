import { describe, it, expect } from '@jest/globals';
import { evaluate, evaluateWithContext, parseFormula } from '../ohm';
import type { EvaluateContextOptions } from '../ohm';
import {
  compareWithReference,
  type EvaluationCase,
} from './support/differential-comparison';
import {
  generateEvaluateCases,
  generateEvaluateWithContextCases,
  parseCases,
  specificationEvaluateCases,
  specificationItemCases,
  type EvaluateCase,
  type EvaluateWithContextCase,
} from './support/evaluation-corpus';
import {
  referenceEvaluate,
  referenceEvaluateWithContext,
  referenceParseFormula,
} from './support/reference-evaluation';

const compareEvaluate = (cases: readonly EvaluateCase[]) =>
  compareWithReference(cases, evaluate, referenceEvaluate);

const compareEvaluateWithContext = (
  cases: readonly EvaluateWithContextCase[],
) =>
  compareWithReference(
    cases,
    evaluateWithContext,
    referenceEvaluateWithContext,
  );

function casesOf<I>(
  createInput: () => I,
  expressions: readonly string[],
): EvaluationCase<I>[] {
  return expressions.map((expression) => ({ expression, createInput }));
}

const edgeContext = (): Record<string, unknown> => {
  const log: unknown[] = [];
  const nested = {
    v: 3,
    fn: (x: unknown) => [x, 'called'],
    boom: () => {
      throw new TypeError('boom');
    },
    record: (x: unknown) => {
      log.push(x);
      return x;
    },
    bump: () => {
      nested.v += 1;
      return nested.v;
    },
  };
  return {
    p: 2,
    w: '__proto__',
    key: ['__proto__'],
    items: [{ v: 1 }, { v: 2 }],
    matrix: [[1, 2], [3]],
    empty: [],
    nested,
    log,
    obj: { v: 1, length: 4 },
    text: 'Hello',
    custom: { valueOf: () => 42, toString: () => 'custom' },
    symbol: Symbol('s'),
    shadowedMap: Object.assign([{ v: 1 }], { map: 0 }),
    shadowedFlat: Object.assign([[1], [2]], { flat: 0 }),
    shadowedReduce: Object.assign([1, 2], { reduce: 0 }),
    shadowedJoin: Object.assign(['a'], { join: 0 }),
    shadowedIncludes: Object.assign(['a'], { includes: 0 }),
    shadowedAt: Object.assign(['a'], { at: 0 }),
    topLevelFunction: () => 'filtered out',
  };
};

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
  'p >= 2',
  'p <= 2',
  'p > 2',
  'p < 2',
  'null >= 0',
  '"b" <= "a"',
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
  'nested.record(1) + nested.record(2)',
  'max(nested.record(3), nested.record(1))',
  'nested.record(1) ? nested.record(2) : nested.record(3)',
  'false && nested.record(1)',
  'nested.bump() + nested.bump() * nested.v',
  'nested.record(foo())',
  'foo(nested.record(1))',
  'nested.record(nested.boom())',
  'matrix[0]',
  'matrix[-1]',
  'items[1]',
  'items[0]["v"]',
  'shadowedMap.v',
  'shadowedFlat[*]',
  'sum(shadowedReduce)',
  'avg(shadowedReduce)',
  'join(shadowedJoin, "-")',
  'includes(shadowedIncludes, "a")',
  'last(shadowedAt)',
];

describe('parsing equals the reference parser', () => {
  it('on the specification examples and generated expressions, cold and cached', () => {
    const comparison = compareWithReference(
      parseCases(),
      parseFormula,
      referenceParseFormula,
    );

    expect(comparison.referenceThrows).toBeGreaterThan(100);
    expect(comparison.mismatches).toEqual([]);
  });
});

describe('evaluation equals the reference Ohm semantics', () => {
  it('on the specification examples, with plain and array item contexts', () => {
    expect(compareEvaluate(specificationEvaluateCases()).mismatches).toEqual(
      [],
    );
    expect(
      compareEvaluateWithContext(specificationItemCases()).mismatches,
    ).toEqual([]);
  });

  it('on edge cases: syntax errors, calls, unsafe names, evaluation order, side effects', () => {
    const cases = casesOf(edgeContext, EDGE_EXPRESSIONS);
    const coldAndWarm = [...cases, ...cases];

    expect(compareEvaluate(coldAndWarm).mismatches).toEqual([]);
  });

  it('on a context with an own "__proto__" key and on a missing context', () => {
    const ownProtoKey = () =>
      JSON.parse(
        '{"__proto__": {"p": "from own __proto__ key"}, "q": 1}',
      ) as Record<string, unknown>;
    const missingContext = () => null as unknown as Record<string, unknown>;

    expect(
      compareEvaluate([
        ...casesOf(ownProtoKey, ['p + q']),
        ...casesOf(missingContext, ['p + 1', 'p +']),
      ]).mismatches,
    ).toEqual([]);
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

  it('on an expression that is not a string', () => {
    const notAString = 42 as unknown as string;
    const emptyContext = (): Record<string, unknown> => ({});
    const rootOnly = (): EvaluateContextOptions => ({ rootData: {} });

    expect(
      compareEvaluate([{ expression: notAString, createInput: emptyContext }])
        .mismatches,
    ).toEqual([]);
    expect(
      compareEvaluateWithContext([
        { expression: notAString, createInput: rootOnly },
      ]).mismatches,
    ).toEqual([]);
    expect(
      compareWithReference(
        [{ expression: notAString, createInput: () => undefined }],
        parseFormula,
        referenceParseFormula,
      ).mismatches,
    ).toEqual([]);
  });

  it('on invalid options passed to evaluateWithContext', () => {
    const missingOptions = () => undefined as unknown as EvaluateContextOptions;
    const missingRootData = () =>
      ({ rootData: null }) as unknown as EvaluateContextOptions;
    const emptyArrayContext = (): EvaluateContextOptions => ({
      rootData: {},
      arrayContext: { levels: [] },
    });

    expect(
      compareEvaluateWithContext([
        ...casesOf(missingOptions, ['p +', '']),
        ...casesOf(missingRootData, ['../p + 1']),
        ...casesOf(emptyArrayContext, ['#index']),
      ]).mismatches,
    ).toEqual([]);
  });
});
