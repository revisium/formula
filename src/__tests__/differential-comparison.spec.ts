import { describe, it, expect } from '@jest/globals';
import { evaluate } from '../ohm';
import {
  compareWithReference,
  type Evaluation,
  type EvaluationCase,
} from './support/differential-comparison';

type Context = Record<string, unknown>;

const withSparseItems = (): Context => ({ items: new Array(3) });

const withItems = (): Context => ({ items: [{ v: 1 }, { v: 2 }] });

const truncatingItems: Evaluation<Context> = (expression, context) => {
  (context.items as unknown[]).length = 0;
  return evaluate(expression, context);
};

const copyingResult: Evaluation<Context> = (expression, context) =>
  structuredClone(evaluate(expression, context));

const cases: EvaluationCase<Context>[] = [
  { expression: '1 + 1', createInput: withSparseItems },
  { expression: 'items', createInput: withItems },
  { expression: 'items[0]', createInput: withItems },
];

describe('compareWithReference', () => {
  it('reports no mismatch when both sides evaluate the same way', () => {
    expect(compareWithReference(cases, evaluate, evaluate).mismatches).toEqual(
      [],
    );
  });

  it('reports an evaluator that changes the length of an input array', () => {
    const comparison = compareWithReference(
      [{ expression: '1 + 1', createInput: withSparseItems }],
      truncatingItems,
      evaluate,
    );

    expect(comparison.mismatches).toHaveLength(1);
  });

  it('reports an evaluator that returns a copy instead of the input object', () => {
    const comparison = compareWithReference(
      [
        { expression: 'items', createInput: withItems },
        { expression: 'items[0]', createInput: withItems },
      ],
      copyingResult,
      evaluate,
    );

    expect(comparison.mismatches).toHaveLength(2);
  });
});
