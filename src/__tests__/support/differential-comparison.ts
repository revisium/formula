import { isDeepStrictEqual } from 'node:util';

export interface EvaluationCase<I> {
  readonly expression: string;
  readonly createInput: () => I;
}

export type Evaluation<I> = (expression: string, input: I) => unknown;

type ThrownSnapshot = {
  readonly thrown: { readonly type: string; readonly message: string };
};

type ResultSnapshot = { readonly value: unknown } | ThrownSnapshot;

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

const HOLE = { hole: true };

const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;

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

class SnapshotWriter {
  private readonly seen = new Map<unknown, string>();

  of(value: unknown, path: string): unknown {
    if (typeof value === 'symbol') {
      return { symbol: value.description };
    }
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function')
    ) {
      return value;
    }

    const seenAt = this.seen.get(value);
    if (seenAt !== undefined) {
      return { sameAs: seenAt };
    }
    this.seen.set(value, path);

    if (typeof value === 'function') {
      return { function: value.name };
    }
    if (Array.isArray(value)) {
      return this.ofArray(value, path);
    }
    return {
      kind: Object.prototype.toString.call(value),
      primitive: primitiveOf(value),
      prototype: this.prototypeOf(value, path),
      entries: this.entriesOf(Object.entries(value), path),
    };
  }

  private ofArray(value: unknown[], path: string): unknown {
    return {
      kind: 'Array',
      prototype: this.prototypeOf(value, path),
      length: value.length,
      items: Array.from({ length: value.length }, (_, index) =>
        index in value ? this.of(value[index], `${path}[${index}]`) : HOLE,
      ),
      properties: this.entriesOf(
        Object.entries(value).filter(([key]) => !ARRAY_INDEX.test(key)),
        path,
      ),
    };
  }

  private entriesOf(entries: [string, unknown][], path: string): unknown[] {
    return entries.map(([key, child]) => [
      key,
      this.of(child, `${path}.${key}`),
    ]);
  }

  private prototypeOf(value: object, path: string): unknown {
    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype === null) {
      return null;
    }
    if (isIntrinsicPrototype(prototype)) {
      return (prototype as { constructor: { name: string } }).constructor.name;
    }
    return this.of(prototype, `${path}.[[Prototype]]`);
  }
}

type RawResult = { readonly value: unknown } | ThrownSnapshot;

function resultOf(run: () => unknown): RawResult {
  try {
    return { value: run() };
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
  const snapshots = new SnapshotWriter();
  const inputAfterwards = snapshots.of(input, 'input');

  if ('thrown' in result) {
    return { result, inputAfterwards };
  }
  return {
    result: { value: snapshots.of(result.value, 'result') },
    inputAfterwards,
  };
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
