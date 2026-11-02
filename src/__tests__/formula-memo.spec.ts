import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { grammar } from '../ohm/grammar';
import { evaluate, evaluateWithContext, parseFormula } from '../ohm';
import type { ASTNode } from '../ohm';
import { BUILTIN_FUNCTIONS } from '../ohm/core/builtin-functions';
import type { BinaryOp } from '../ohm/core/types';

const MEMO_CAPACITY = 1000;

function watchParsing(): (expression: string) => number {
  const match = jest.spyOn(grammar, 'match');
  return (expression) =>
    match.mock.calls.filter(([input]) => input === expression).length;
}

function thrownBy(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to throw');
}

function parseDistinctFormulas(prefix: string, count: number): void {
  for (let i = 1; i <= count; i++) {
    parseFormula(`${prefix} + ${i}`);
  }
}

describe('parsed formula memo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete BUILTIN_FUNCTIONS.latebuiltin;
  });

  it('parses a formula once for repeated parseFormula, evaluate and evaluateWithContext calls', () => {
    const parsesOf = watchParsing();
    const expression = 'memoPrice * memoQuantity';

    parseFormula(expression);
    parseFormula(`  ${expression} `);
    const evaluated = evaluate(expression, { memoPrice: 2, memoQuantity: 3 });
    const evaluatedWithContext = evaluateWithContext(expression, {
      rootData: { memoPrice: 4, memoQuantity: 5 },
    });

    expect(evaluated).toBe(6);
    expect(evaluatedWithContext).toBe(20);
    expect(parsesOf(expression)).toBe(1);
  });

  it('rethrows a cached parse error as a new error with the same message, without parsing again', () => {
    const parsesOf = watchParsing();
    const expression = 'memoPrice *';

    const fromParse = thrownBy(() => parseFormula(expression));
    const fromEvaluate = thrownBy(() => evaluate(expression, {}));
    const fromEvaluateWithContext = thrownBy(() =>
      evaluateWithContext(expression, { rootData: {} }),
    );

    expect(fromParse).toBeInstanceOf(Error);
    expect((fromParse as Error).message).toMatch(/^Line 1, col 12:/);
    expect(fromEvaluate).toEqual(fromParse);
    expect(fromEvaluateWithContext).toEqual(fromParse);
    expect(fromEvaluate).not.toBe(fromParse);
    expect(parsesOf(expression)).toBe(1);
  });

  it('returns a fresh, mutable parse result that later calls do not share', () => {
    const expression = 'memoLeft + memoRight';
    const first = parseFormula(expression);

    const firstAst = first.ast as BinaryOp & { left: { name: string } };
    firstAst.left.name = 'hacked';
    firstAst.op = '-';
    first.dependencies.push('hacked');
    first.features.push('nested_path');
    const second = parseFormula(expression);

    expect(second.ast).not.toBe(first.ast);
    expect(second).toEqual({
      ast: {
        type: 'BinaryOp',
        op: '+',
        left: { type: 'Identifier', name: 'memoLeft' },
        right: { type: 'Identifier', name: 'memoRight' },
      },
      dependencies: ['memoLeft', 'memoRight'],
      features: [],
      minVersion: '1.0',
    });
    expect(
      evaluate(expression, { memoLeft: 1, memoRight: 2, hacked: 100 }),
    ).toBe(3);
  });

  it('returns a plain parse result: ast first, the same AST on every read, replaceable', () => {
    const readFirst = parseFormula('memoShape * 2');
    const replacedFirst = parseFormula('memoShape * 2');
    const replacement: ASTNode = { type: 'NullLiteral' };

    expect(Object.keys(readFirst)).toEqual([
      'ast',
      'dependencies',
      'features',
      'minVersion',
    ]);
    expect(readFirst.ast).toBe(readFirst.ast);
    readFirst.ast = replacement;
    replacedFirst.ast = replacement;
    expect(readFirst.ast).toBe(replacement);
    expect({ ...replacedFirst }).toEqual({
      ast: replacement,
      dependencies: ['memoShape'],
      features: [],
      minVersion: '1.0',
    });
  });

  it('looks up built-in functions when a cached formula is evaluated', () => {
    const expression = 'lateBuiltin(2)';

    expect(() => evaluate(expression, {})).toThrow(
      "'lateBuiltin' is not a function",
    );
    BUILTIN_FUNCTIONS.latebuiltin = (x) => (x as number) * 10;
    expect(evaluate(expression, {})).toBe(20);
  });

  it(`keeps a formula while fewer than ${MEMO_CAPACITY} newer formulas were parsed`, () => {
    const parsesOf = watchParsing();
    const expression = 'memoKept + 0';

    parseFormula(expression);
    parseDistinctFormulas('memoKept', MEMO_CAPACITY - 1);
    parseFormula(expression);

    expect(parsesOf(expression)).toBe(1);
  });

  it(`parses a formula again after ${MEMO_CAPACITY} newer formulas were parsed, even if it was used meanwhile`, () => {
    const parsesOf = watchParsing();
    const expression = 'memoEvicted + 0';

    parseFormula(expression);
    parseDistinctFormulas('memoEvicted', MEMO_CAPACITY - 1);
    parseFormula(expression);
    parseFormula('memoEvicted + newest');
    parseFormula(expression);

    expect(parsesOf(expression)).toBe(2);
  });
});
