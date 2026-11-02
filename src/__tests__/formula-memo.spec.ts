import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { grammar } from '../ohm/grammar';
import { evaluate, evaluateWithContext, parseFormula } from '../ohm';
import type { ASTNode } from '../ohm';

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

function attemptMutation(mutate: () => void): void {
  try {
    mutate();
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
  }
}

function parseDistinctFormulas(prefix: string, count: number): void {
  for (let i = 1; i <= count; i++) {
    parseFormula(`${prefix} + ${i}`);
  }
}

describe('parsed formula memo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

  it('keeps later calls unaffected when a caller mutates a returned parse result', () => {
    const expression = 'memoLeft + memoRight';
    const first = parseFormula(expression);

    attemptMutation(() => {
      const ast = first.ast as ASTNode & { left: { name: string } };
      ast.left.name = 'hacked';
    });
    attemptMutation(() => {
      (first.ast as { type: string }).type = 'NullLiteral';
    });
    attemptMutation(() => first.dependencies.push('hacked'));
    attemptMutation(() => first.features.push('nested_path'));

    expect(parseFormula(expression)).toEqual({
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
