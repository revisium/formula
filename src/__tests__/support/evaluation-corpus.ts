import { isDeepStrictEqual } from 'node:util';
import { formulaSpec } from '../../formula-spec';
import { BUILTIN_FUNCTIONS } from '../../ohm/core/builtin-functions';
import type { EvaluateContextOptions } from '../../ohm/core/parser';
import type { ArrayLevelContext } from '../../types';

export interface EvaluateCase {
  readonly expression: string;
  readonly context: Record<string, unknown>;
}

export interface EvaluateWithContextCase {
  readonly expression: string;
  readonly options: EvaluateContextOptions;
}

export type EvaluationOutcome =
  | { readonly value: unknown }
  | { readonly thrown: { readonly type: string; readonly message: string } };

export interface Mismatch {
  readonly expression: string;
  readonly actual: EvaluationOutcome;
  readonly expected: EvaluationOutcome;
}

type Random = () => number;

function createRandom(seed: number): Random {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

function pickFrom<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

function describeThrown(error: unknown): {
  type: string;
  message: string;
} {
  if (error instanceof Error) {
    return { type: error.constructor.name, message: error.message };
  }
  return { type: typeof error, message: String(error) };
}

function outcomeOf(run: () => unknown): EvaluationOutcome {
  try {
    return { value: run() };
  } catch (error) {
    return { thrown: describeThrown(error) };
  }
}

export interface ReferenceComparison {
  readonly mismatches: Mismatch[];
  readonly referenceThrows: number;
}

export function compareWithReference<C extends { readonly expression: string }>(
  cases: readonly C[],
  evaluateActual: (testCase: C) => unknown,
  evaluateReference: (testCase: C) => unknown,
): ReferenceComparison {
  const mismatches: Mismatch[] = [];
  let referenceThrows = 0;
  for (const testCase of cases) {
    const expected = outcomeOf(() => evaluateReference(testCase));
    const actual = outcomeOf(() => evaluateActual(testCase));
    if ('thrown' in expected) {
      referenceThrows++;
    }
    if (!isDeepStrictEqual(actual, expected)) {
      mismatches.push({ expression: testCase.expression, actual, expected });
    }
  }
  return { mismatches, referenceThrows };
}

// ---------------------------------------------------------------- specification examples

function withoutComment(example: string): string {
  const commentStart = example.indexOf('//');
  if (commentStart === -1) {
    return example.trim();
  }
  return example.slice(0, commentStart).trim();
}

export function specificationExpressions(): string[] {
  const functionExamples = Object.values(formulaSpec.functions).flatMap(
    (group) => group.flatMap((fn) => fn.examples),
  );
  const featureExamples = formulaSpec.features.flatMap((f) => f.examples);
  const examples = formulaSpec.examples.map((e) => e.expression);
  return [...functionExamples, ...featureExamples, ...examples].map(
    withoutComment,
  );
}

const specificationItems = [
  { price: 10, name: 'a', rating: 4, quantity: 1, total: 10, value: 1 },
  { price: 20, name: 'b', rating: 5, quantity: 2, total: 40, value: 2 },
  { price: 30, name: 'c', rating: 3, quantity: 3, total: 90, value: 3 },
];

export function specificationData(): Record<string, unknown> {
  return {
    price: 100,
    quantity: 3,
    taxRate: 0.2,
    stock: 0,
    firstName: 'John',
    lastName: 'Doe',
    name: 'hello',
    baseDamage: 5,
    a: 1,
    b: 2,
    c: 3,
    x: 10,
    isActive: true,
    hasPermission: false,
    isAdmin: false,
    isOwner: true,
    isDeleted: false,
    optionalField: null,
    nickname: null,
    tags: ['a', 'b', 'c'],
    value: 7,
    total: 10,
    max: 100,
    min: 5,
    round: 3.7,
    sum: 10,
    field: { min: 20 },
    stats: { damage: 50 },
    user: {
      profile: { name: 'Ann', address: { city: 'Riga' } },
      addresses: [{ city: 'Oslo' }, { city: 'Rome' }],
    },
    item: { metadata: { category: 'tools' } },
    items: specificationItems,
    inventory: [{ quantity: 4 }, { quantity: 6 }],
    values: [{ nested: { value: 1 } }, { nested: { value: 2 } }],
    orders: [
      { items: [{ amount: 1 }, { amount: 2 }] },
      { items: [{ amount: 3 }] },
    ],
    config: { tax: 0.1, multiplier: 2 },
    settings: { tax: { rate: 0.05 } },
    discount: 0.2,
    rootRate: 0.3,
    globalRate: 2,
    'field-name': 1,
    'field-one': { 'field-two': 2 },
    obj: { 'field-name': { value: 3 } },
    'items-list': [{ val: 9 }],
    'price-new': 4,
  };
}

function levelOf(items: readonly unknown[], index: number): ArrayLevelContext {
  return {
    index,
    length: items.length,
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}

export function specificationItemOptions(): EvaluateContextOptions {
  const rootData = specificationData();
  return {
    rootData,
    itemData: specificationItems[1],
    currentPath: 'items[1]',
    arrayContext: {
      levels: [levelOf(specificationItems, 1), levelOf(['x', 'y'], 0)],
    },
  };
}

// ---------------------------------------------------------------- generated expressions

const FIELDS = [
  'p',
  'q',
  'w',
  's',
  'n',
  'items',
  'nested',
  'tags',
  'matrix',
  'obj',
  'max',
  'sum',
  'missing',
  'constructor',
  '__proto__',
];

const LITERALS = [
  '0',
  '1',
  '2.5',
  '10',
  '"t"',
  "'5'",
  String.raw`"a\"b"`,
  '""',
  'true',
  'false',
  'null',
];

const SPECIAL_PATHS = [
  '/p',
  '/nested',
  '/items',
  '../p',
  '../../q',
  '../nested',
  '#index',
  '#length',
  '#first',
  '#last',
  '#parent.index',
  '#root.length',
  '@prev',
  '@next',
  '@parent.prev',
  '@root.next',
  '["w-x"]',
  '["__proto__"]',
  "['p']",
];

const BINARY_OPERATORS = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '==',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '&&',
  '||',
];

const CALLEES = [
  ...Object.keys(BUILTIN_FUNCTIONS),
  'MAX',
  'Round',
  'foo',
  'p',
  'constructor',
  '__proto__',
  'hasOwnProperty',
  'valueOf',
  'nested.fn',
  'nested.boom',
  'missing.fn',
];

const POSTFIXES = [
  '.v',
  '.length',
  '.fn',
  '[0]',
  '[1]',
  '[-1]',
  '["v"]',
  "['__proto__']",
  '[*]',
  '[*].v',
  '[*][*]',
  '[p]',
  '[w]',
  '(1)',
];

const SYNTAX_ERRORS = [
  'p +',
  '(p',
  '* q',
  'p ** 2',
  'max(',
  '1 ? 2',
  '"open',
  '..p',
  '#',
  '@ prev',
  '',
  '   ',
];

class ExpressionGenerator {
  constructor(
    private readonly random: Random,
    private readonly atoms: readonly string[],
  ) {}

  expression(depth = 0): string {
    const roll = this.random();
    if (depth >= 3 || roll < 0.25) {
      return this.atom();
    }
    if (roll < 0.45) {
      return this.binary(depth + 1);
    }
    if (roll < 0.52) {
      return `${pickFrom(this.random, ['-', '!'])}${this.expression(depth + 1)}`;
    }
    if (roll < 0.64) {
      return this.call(depth + 1);
    }
    if (roll < 0.71) {
      return `${this.expression(depth + 1)} ? ${this.expression(depth + 1)} : ${this.expression(depth + 1)}`;
    }
    if (roll < 0.86) {
      return `${this.postfixBase(depth + 1)}${pickFrom(this.random, POSTFIXES)}`;
    }
    if (roll < 0.96) {
      return `(${this.expression(depth + 1)})`;
    }
    return pickFrom(this.random, SYNTAX_ERRORS);
  }

  private atom(): string {
    return pickFrom(this.random, this.atoms);
  }

  private binary(depth: number): string {
    const operator = pickFrom(this.random, BINARY_OPERATORS);
    return `${this.expression(depth)} ${operator} ${this.expression(depth)}`;
  }

  private call(depth: number): string {
    const argumentCount = Math.floor(this.random() * 4);
    const args = Array.from({ length: argumentCount }, () =>
      this.expression(depth),
    );
    return `${pickFrom(this.random, CALLEES)}(${args.join(', ')})`;
  }

  private postfixBase(depth: number): string {
    if (this.random() < 0.7) {
      return this.atom();
    }
    return `(${this.expression(depth)})`;
  }
}

function generateExpressions(seed: number, count: number): string[] {
  const generator = new ExpressionGenerator(createRandom(seed), [
    ...FIELDS,
    ...FIELDS,
    ...LITERALS,
    ...SPECIAL_PATHS,
  ]);
  return Array.from({ length: count }, () => generator.expression());
}

// ---------------------------------------------------------------- generated contexts

function scalarValue(random: Random): unknown {
  return pickFrom(random, [
    0,
    1,
    2,
    -3,
    1.5,
    -0,
    Number.NaN,
    Infinity,
    '7',
    'x',
    '',
    'A b',
    '__proto__',
    true,
    false,
    null,
    undefined,
  ]);
}

function anyValue(random: Random): unknown {
  const roll = random();
  if (roll < 0.6) {
    return scalarValue(random);
  }
  if (roll < 0.7) {
    return [scalarValue(random), scalarValue(random)];
  }
  if (roll < 0.8) {
    return [{ v: scalarValue(random) }, { v: scalarValue(random) }];
  }
  if (roll < 0.9) {
    return { v: scalarValue(random), length: 2 };
  }
  return ['__proto__'];
}

function nestedObject(random: Random): Record<string, unknown> {
  return {
    v: scalarValue(random),
    fn: (x: unknown) => [x, 'called'],
    boom: () => {
      throw new TypeError('boom');
    },
    __proto__: { inherited: true },
  };
}

function contextWithOwnProtoKey(): Record<string, unknown> {
  return JSON.parse(
    '{"__proto__": {"p": "from own __proto__ key"}, "q": 1}',
  ) as Record<string, unknown>;
}

function generateContext(random: Random): Record<string, unknown> {
  if (random() < 0.05) {
    return contextWithOwnProtoKey();
  }

  const context: Record<string, unknown> = {
    p: scalarValue(random),
    q: scalarValue(random),
    w: pickFrom(random, ['v', '__proto__', 'length', 'missing', 0, 1]),
    s: pickFrom(random, [true, false, null]),
    n: anyValue(random),
    items: [
      { v: scalarValue(random), name: 'a' },
      { v: scalarValue(random), name: 'b' },
      { v: scalarValue(random) },
    ],
    nested: nestedObject(random),
    tags: ['x', 'y', scalarValue(random)],
    matrix: [
      [1, 2],
      [3, scalarValue(random)],
    ],
    obj: { v: anyValue(random), __proto__: { hidden: 1 } },
    max: scalarValue(random),
    sum: scalarValue(random),
    'w-x': scalarValue(random),
    '#index': pickFrom(random, [0, 1, 2]),
    '#length': 3,
    '#first': pickFrom(random, [true, false]),
    '#last': false,
    '#parent.index': 1,
    '#root.length': 2,
    '@prev': pickFrom(random, [null, { v: 1 }]),
    '@next': { v: scalarValue(random) },
    '@parent.prev': null,
    '@root.next': { v: 2 },
    '/p': scalarValue(random),
    '../p': scalarValue(random),
    topLevelFunction: () => 'filtered out',
  };

  for (const key of Object.keys(context)) {
    if (random() < 0.1) {
      delete context[key];
    }
  }

  return context;
}

export function generateEvaluateCases(
  seed: number,
  expressionCount: number,
  contextsPerExpression: number,
): EvaluateCase[] {
  const random = createRandom(seed + 1);
  return generateExpressions(seed, expressionCount).flatMap((expression) =>
    Array.from({ length: contextsPerExpression }, () => ({
      expression,
      context: generateContext(random),
    })),
  );
}

// ---------------------------------------------------------------- generated array item formulas

const ITEM_ATOMS = [
  'v',
  'v',
  'name',
  'lineTotal',
  '../p',
  '../discount',
  '../../p',
  '../../taxRate',
  '../config.tax',
  '../items[0].v',
  '/taxRate',
  '/config.tax',
  '/items',
  '/groups[0].title',
  '#index',
  '#length',
  '#first',
  '#last',
  '#parent.index',
  '#parent.length',
  '#root.index',
  '#root.length',
  '@prev',
  '@prev.v',
  '@next.name',
  '@parent.prev.title',
  '@root.next',
  'items[*].v',
  'groups[*].items[*].v',
  'sum(items[*].v)',
  'sum(groups[*].items[*].v)',
  'count(items)',
  '1',
  '"s"',
  'null',
];

interface Item {
  v: unknown;
  name: string;
  lineTotal?: unknown;
}

function generateRootData(random: Random): Record<string, unknown> {
  const item = (name: string): Item => ({
    v: scalarValue(random),
    name,
    lineTotal: random() < 0.5 ? scalarValue(random) : undefined,
  });
  return {
    p: scalarValue(random),
    discount: pickFrom(random, [0, 10, '5', null]),
    taxRate: pickFrom(random, [0.2, 0.1, null]),
    config: random() < 0.8 ? { tax: scalarValue(random) } : null,
    items: [item('a'), item('b'), item('c')],
    groups: [
      { title: 'g0', items: [item('g0a'), item('g0b')] },
      { title: 'g1', items: [item('g1a')] },
    ],
  };
}

function itemOptions(
  random: Random,
  rootData: Record<string, unknown>,
): EvaluateContextOptions {
  const items = rootData.items as Item[];
  const index = Math.floor(random() * items.length);
  return {
    rootData,
    itemData: items[index] as unknown as Record<string, unknown>,
    currentPath: `items[${index}]`,
    arrayContext: { levels: [levelOf(items, index)] },
  };
}

function nestedItemOptions(
  random: Random,
  rootData: Record<string, unknown>,
): EvaluateContextOptions {
  const groups = rootData.groups as { items: Item[] }[];
  const groupIndex = Math.floor(random() * groups.length);
  const items = (groups[groupIndex] as { items: Item[] }).items;
  const index = Math.floor(random() * items.length);
  return {
    rootData,
    itemData: items[index] as unknown as Record<string, unknown>,
    currentPath: `groups[${groupIndex}].items[${index}]`,
    arrayContext: {
      levels: [levelOf(items, index), levelOf(groups, groupIndex)],
    },
  };
}

function generateOptions(random: Random): EvaluateContextOptions {
  const rootData = generateRootData(random);
  const roll = random();
  if (roll < 0.2) {
    return { rootData };
  }
  if (roll < 0.3) {
    return {
      rootData,
      itemData: rootData.config as Record<string, unknown>,
      currentPath: 'config',
    };
  }
  if (roll < 0.65) {
    return itemOptions(random, rootData);
  }
  return nestedItemOptions(random, rootData);
}

export function generateEvaluateWithContextCases(
  seed: number,
  expressionCount: number,
  optionsPerExpression: number,
): EvaluateWithContextCase[] {
  const random = createRandom(seed);
  const generator = new ExpressionGenerator(random, ITEM_ATOMS);
  const expressions = Array.from({ length: expressionCount }, () =>
    generator.expression(),
  );
  return expressions.flatMap((expression) =>
    Array.from({ length: optionsPerExpression }, () => ({
      expression,
      options: generateOptions(random),
    })),
  );
}
