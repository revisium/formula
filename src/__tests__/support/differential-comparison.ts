import { isDeepStrictEqual } from 'node:util';

export interface EvaluationCase<I> {
  readonly expression: string;
  readonly createInput: () => I;
}

export type Evaluation<I> = (expression: string, input: I) => unknown;

type ResultSnapshot =
  | { readonly value: unknown }
  | { readonly thrown: { readonly type: string; readonly message: string } };

export interface EvaluationOutcome {
  readonly result: ResultSnapshot;
  readonly inputAfterwards: unknown;
}

export interface Mismatch {
  readonly expression: string;
  readonly actual: EvaluationOutcome;
  readonly expected: EvaluationOutcome;
}

export interface ReferenceComparison {
  readonly mismatches: Mismatch[];
  readonly referenceThrows: number;
}

const COVERAGE_COUNTER =
  /\(\(cov_\w+\(\.\.\.\)\.\w\[\d+\](?:\[\d+\])?\+\+\) , (.+?)\)/g;

function engineMessage(message: string): string {
  return message.replaceAll(COVERAGE_COUNTER, '$1');
}

function describeThrown(error: unknown): {
  type: string;
  message: string;
} {
  if (error instanceof TypeError) {
    return { type: 'TypeError', message: engineMessage(error.message) };
  }
  if (error instanceof Error) {
    return { type: error.constructor.name, message: error.message };
  }
  return { type: typeof error, message: String(error) };
}

function isIntrinsicPrototype(prototype: object): boolean {
  return (
    Object.hasOwn(prototype, 'constructor') &&
    (prototype as { constructor: { prototype?: unknown } }).constructor
      .prototype === prototype
  );
}

function primitiveOf(value: object): unknown {
  if (
    value instanceof Number ||
    value instanceof String ||
    value instanceof Boolean
  ) {
    return value.valueOf();
  }
  return undefined;
}

function snapshotOf(
  value: unknown,
  path = '$',
  seen = new Map<object, string>(),
): unknown {
  if (typeof value === 'function') {
    return { function: value.name };
  }
  if (typeof value === 'symbol') {
    return { symbol: value.description };
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const seenAt = seen.get(value);
  if (seenAt !== undefined) {
    return { seen: seenAt };
  }
  seen.set(value, path);

  return {
    kind: Object.prototype.toString.call(value),
    primitive: primitiveOf(value),
    prototype: prototypeSnapshotOf(value, path, seen),
    entries: Object.entries(value).map(([key, child]) => [
      key,
      snapshotOf(child, `${path}.${key}`, seen),
    ]),
  };
}

function prototypeSnapshotOf(
  value: object,
  path: string,
  seen: Map<object, string>,
): unknown {
  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype === null) {
    return null;
  }
  if (isIntrinsicPrototype(prototype)) {
    return (prototype as { constructor: { name: string } }).constructor.name;
  }
  return snapshotOf(prototype, `${path}.[[Prototype]]`, seen);
}

function resultOf(run: () => unknown): ResultSnapshot {
  try {
    return { value: snapshotOf(run()) };
  } catch (error) {
    return { thrown: describeThrown(error) };
  }
}

function evaluateOnOwnInput<I>(
  testCase: EvaluationCase<I>,
  evaluation: Evaluation<I>,
): EvaluationOutcome {
  const input = testCase.createInput();
  const result = resultOf(() => evaluation(testCase.expression, input));
  return { result, inputAfterwards: snapshotOf(input) };
}

export function compareWithReference<I>(
  cases: readonly EvaluationCase<I>[],
  evaluateActual: Evaluation<I>,
  evaluateReference: Evaluation<I>,
): ReferenceComparison {
  const mismatches: Mismatch[] = [];
  let referenceThrows = 0;
  for (const testCase of cases) {
    const expected = evaluateOnOwnInput(testCase, evaluateReference);
    const actual = evaluateOnOwnInput(testCase, evaluateActual);
    if ('thrown' in expected.result) {
      referenceThrows++;
    }
    if (!isDeepStrictEqual(actual, expected)) {
      mismatches.push({ expression: testCase.expression, actual, expected });
    }
  }
  return { mismatches, referenceThrows };
}
