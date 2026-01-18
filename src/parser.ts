import subscript, { parse, token, operator, compile } from 'subscript';
import type { Node as SubscriptNode } from 'subscript/src/compile.js';
import { FormulaFeature, FormulaMinorVersion } from './types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - subscript internal module
import * as parseModule from 'subscript/src/parse.js';

type ASTNodeInternal = SubscriptNode;

const { next } = parseModule as { next: (fn: (c: number) => number) => string };

// Helper for identifier chars - returns 1 if valid, 0 otherwise
const isIdChar = (c: number): number =>
  (c >= 97 && c <= 122) || // a-z
  (c >= 65 && c <= 90) || // A-Z
  (c >= 48 && c <= 57) || // 0-9
  c === 95 // _
    ? 1
    : 0;

// Register @ for context tokens (@prev, @next, @current)
token('@', 200, (a: unknown) => {
  if (a) return; // must not follow another token
  const name = next(isIdChar);
  if (!name) return;
  return '@' + name;
});

// Register # for position tokens (#index, #first, #last, #length)
token('#', 200, (a: unknown) => {
  if (a) return;
  const name = next(isIdChar);
  if (!name) return;
  return '#' + name;
});

// Create sparse array literal for wildcard: [, '*'] means literal value '*'
const createWildcardLiteral = (): unknown[] => {
  const arr: unknown[] = [];
  arr[1] = '*';
  return arr;
};

// Register * as wildcard when standalone (inside [])
token('*', 200, (a: unknown) => {
  if (!a) return createWildcardLiteral();
  return undefined;
});

// Register / for absolute paths (/field, /nested.field)
token('/', 200, (a: unknown) => {
  if (a) return; // must not follow another token (avoid division)
  const name = next(isIdChar);
  if (!name) return;
  return '/' + name;
});

// Helper for relative path chars - extends isIdChar with / and .
const isRelativePathChar = (c: number): number =>
  isIdChar(c) || c === 47 || c === 46 ? 1 : 0; // 47 = /, 46 = .

// Register .. for relative paths (../field, ../../field)
token('.', 200, (a: unknown) => {
  if (a) return; // must not follow another token
  // Check if this is .. (double dot for relative path)
  const second = next((c: number) => (c === 46 ? 1 : 0)); // 46 = .
  if (!second) return; // single dot - let normal parsing handle it
  // Now we have .. - read the rest of the relative path
  const rest = next(isRelativePathChar);
  if (!rest) return; // just .. without path - invalid
  return '..' + rest;
});

// Built-in functions - defined early for operator registration
const BUILTIN_FUNCTIONS: Record<string, (...args: unknown[]) => unknown> = {
  and: (a: unknown, b: unknown) => Boolean(a) && Boolean(b),
  or: (a: unknown, b: unknown) => Boolean(a) || Boolean(b),
  not: (a: unknown) => !a,
  concat: (...args: unknown[]) => args.map(String).join(''),
  upper: (s: unknown) => String(s).toUpperCase(),
  lower: (s: unknown) => String(s).toLowerCase(),
  trim: (s: unknown) => String(s).trim(),
  left: (s: unknown, n: unknown) => {
    const count = Math.max(0, Math.floor(Number(n)));
    return String(s).slice(0, count);
  },
  right: (s: unknown, n: unknown) => {
    const str = String(s);
    const count = Math.max(0, Math.floor(Number(n)));
    return count === 0 ? '' : str.slice(-count);
  },
  replace: (s: unknown, search: unknown, replacement: unknown) =>
    String(s).replace(String(search), String(replacement)),
  tostring: String,
  length: (s: unknown) => {
    if (Array.isArray(s)) return s.length;
    if (typeof s === 'string') return s.length;
    if (s !== null && typeof s === 'object') return Object.keys(s).length;
    return String(s).length;
  },
  contains: (s: unknown, search: unknown) => String(s).includes(String(search)),
  startswith: (s: unknown, search: unknown) =>
    String(s).startsWith(String(search)),
  endswith: (s: unknown, search: unknown) => String(s).endsWith(String(search)),
  tonumber: Number,
  toboolean: Boolean,
  isnull: (v: unknown) => v === null || v === undefined,
  coalesce: (...args: unknown[]) =>
    args.find((v) => v !== null && v !== undefined) ?? null,
  round: (n: unknown, decimals?: unknown) => {
    const num = Number(n);
    const dec = decimals === undefined ? 0 : Number(decimals);
    const factor = 10 ** dec;
    return Math.round(num * factor) / factor;
  },
  floor: (n: unknown) => Math.floor(Number(n)),
  ceil: (n: unknown) => Math.ceil(Number(n)),
  abs: (n: unknown) => Math.abs(Number(n)),
  sqrt: (n: unknown) => Math.sqrt(Number(n)),
  pow: (base: unknown, exp: unknown) => Math.pow(Number(base), Number(exp)),
  min: (...args: unknown[]) =>
    args.length === 0 ? Number.NaN : Math.min(...args.map(Number)),
  max: (...args: unknown[]) =>
    args.length === 0 ? Number.NaN : Math.max(...args.map(Number)),
  log: (n: unknown) => Math.log(Number(n)),
  log10: (n: unknown) => Math.log10(Number(n)),
  exp: (n: unknown) => Math.exp(Number(n)),
  sign: (n: unknown) => Math.sign(Number(n)),
  sum: (arr: unknown) =>
    Array.isArray(arr) ? arr.reduce((a: number, b) => a + Number(b), 0) : 0,
  avg: (arr: unknown) =>
    Array.isArray(arr) && arr.length > 0
      ? arr.reduce((a: number, b) => a + Number(b), 0) / arr.length
      : 0,
  count: (arr: unknown) => (Array.isArray(arr) ? arr.length : 0),
  first: (arr: unknown): unknown =>
    Array.isArray(arr) ? (arr[0] as unknown) : undefined,
  last: (arr: unknown): unknown =>
    Array.isArray(arr) ? (arr.at(-1) as unknown) : undefined,
  join: (arr: unknown, separator?: unknown) => {
    if (!Array.isArray(arr)) return '';
    if (separator === undefined) return arr.join(',');
    if (typeof separator === 'string') return arr.join(separator);
    if (typeof separator === 'number') return arr.join(String(separator));
    return arr.join(',');
  },
  includes: (arr: unknown, value: unknown) =>
    Array.isArray(arr) ? arr.includes(value) : false,
  if: (condition: unknown, ifTrue: unknown, ifFalse: unknown) =>
    condition ? ifTrue : ifFalse,
};

// Helper to extract arguments from AST node
function extractCallArgs(argsNode: ASTNodeInternal): ASTNodeInternal[] {
  if (!argsNode) return [];
  if (!Array.isArray(argsNode)) return [argsNode];
  if (argsNode[0] === ',') {
    return argsNode.slice(1) as ASTNodeInternal[];
  }
  return [argsNode];
}

// Override function call operator to use builtin functions namespace
// This allows fields to have same names as functions (e.g., max, min, round)
// Note: () operator handles both grouping (a + b) and function calls fn(a, b)
// - Grouping: ["()", expr] - one argument, just evaluate it
// - Function call: ["()", fn, args] - two arguments, call function
operator(
  '()',
  (fn: ASTNodeInternal, argsNode?: ASTNodeInternal) => {
    // If no argsNode, this is grouping: (expr) - just evaluate fn
    if (argsNode === undefined) {
      const compiledExpr = compile(fn);
      return (ctx: Record<string, unknown>) => compiledExpr(ctx);
    }

    // This is a function call: fn(args)
    const args = extractCallArgs(argsNode);
    const compiledArgs = args.map((arg) => compile(arg));

    return (ctx: Record<string, unknown>) => {
      const argValues = compiledArgs.map((a) => a(ctx));

      // If fn is a string identifier, check builtins first
      if (typeof fn === 'string') {
        const builtinFn = BUILTIN_FUNCTIONS[fn.toLowerCase()];
        if (builtinFn) {
          return builtinFn(...argValues);
        }
      }

      // Otherwise evaluate fn and call it
      const fnValue = compile(fn)(ctx);
      if (typeof fnValue === 'function') {
        return fnValue(...argValues);
      }

      throw new Error(`'${fn}' is not a function`);
    };
  },
);

export type ASTNode = string | number | boolean | null | [string, ...ASTNode[]];

const KEYWORDS = new Set([
  'true',
  'false',
  'null',
  'and',
  'or',
  'not',
  'if',
  'round',
  'floor',
  'ceil',
  'abs',
  'sqrt',
  'pow',
  'min',
  'max',
  'log',
  'log10',
  'exp',
  'sign',
  'concat',
  'upper',
  'lower',
  'length',
  'trim',
  'left',
  'right',
  'replace',
  'contains',
  'startswith',
  'endswith',
  'tostring',
  'tonumber',
  'toboolean',
  'isnull',
  'coalesce',
  'sum',
  'avg',
  'count',
  'first',
  'last',
  'join',
  'includes',
]);

const ARRAY_FUNCTIONS = new Set([
  'sum',
  'avg',
  'count',
  'first',
  'last',
  'join',
  'includes',
]);

export interface ParseResult {
  ast: ASTNode;
  dependencies: string[];
  features: FormulaFeature[];
  minVersion: FormulaMinorVersion;
}

function isKeyword(name: string): boolean {
  return KEYWORDS.has(name.toLowerCase());
}

function isArrayFunction(name: string): boolean {
  return ARRAY_FUNCTIONS.has(name.toLowerCase());
}

function isContextToken(name: string): boolean {
  return name.startsWith('@') || name.startsWith('#');
}

function isRootPath(name: string): boolean {
  return name.startsWith('/');
}

function isRelativePath(name: string): boolean {
  return name.startsWith('..');
}

function isValidIdentifierRoot(rootName: string): boolean {
  return !isKeyword(rootName) && !isContextToken(rootName);
}

function extractRootName(path: string): string {
  return path.split('.')[0]?.split('[')[0] ?? '';
}

function addPathIfValid(path: string | null, identifiers: Set<string>): void {
  if (path && isValidIdentifierRoot(extractRootName(path))) {
    identifiers.add(path);
  }
}

function collectStringIdentifier(node: string, identifiers: Set<string>): void {
  if (isRootPath(node) || isRelativePath(node)) {
    identifiers.add(node);
    return;
  }
  if (!isContextToken(node) && !isKeyword(node)) {
    identifiers.add(node);
  }
}

function collectFunctionCallIdentifiers(
  args: ASTNode[],
  identifiers: Set<string>,
): void {
  for (let i = 1; i < args.length; i++) {
    collectIdentifiers(args[i] as ASTNode, identifiers);
  }
  const funcName = args[0];
  if (typeof funcName !== 'string') {
    collectIdentifiers(funcName as ASTNode, identifiers);
  }
}

function collectPathOrFallback(node: ASTNode, identifiers: Set<string>): void {
  const path = buildDotPath(node);
  if (path) {
    addPathIfValid(path, identifiers);
  } else {
    const [, ...args] = node as [string, ...ASTNode[]];
    for (const arg of args) {
      collectIdentifiers(arg, identifiers);
    }
  }
}

function collectIdentifiers(node: ASTNode, identifiers: Set<string>): void {
  if (typeof node === 'string') {
    collectStringIdentifier(node, identifiers);
    return;
  }

  if (!Array.isArray(node)) {
    return;
  }

  if (isLiteralArray(node)) {
    return;
  }

  const [op, ...args] = node;

  if (op === '.' || op === '[]') {
    collectPathOrFallback(node, identifiers);
    return;
  }

  if (op === '()') {
    collectFunctionCallIdentifiers(args, identifiers);
    return;
  }

  for (const arg of args) {
    collectIdentifiers(arg, identifiers);
  }
}

function isLiteralArray(arr: unknown[]): boolean {
  return !(0 in arr);
}

function buildPropertyAccessPath(left: ASTNode, right: ASTNode): string | null {
  const leftPath = buildDotPath(left);
  const rightPath = typeof right === 'string' ? right : null;
  if (leftPath && rightPath) {
    return `${leftPath}.${rightPath}`;
  }
  return null;
}

function getNegativeIndexValue(index: unknown): number | null {
  if (!Array.isArray(index) || index[0] !== '-' || index.length !== 2) {
    return null;
  }
  const inner: unknown = index[1];
  if (
    Array.isArray(inner) &&
    isLiteralArray(inner) &&
    typeof inner[1] === 'number'
  ) {
    return -inner[1];
  }
  return null;
}

function buildArrayAccessPath(left: ASTNode, right: ASTNode): string | null {
  const leftPath = buildDotPath(left);
  if (!leftPath) {
    return null;
  }

  if (Array.isArray(right) && isLiteralArray(right)) {
    if (right[1] === '*') {
      return `${leftPath}[*]`;
    }
    if (typeof right[1] === 'number') {
      return `${leftPath}[${right[1]}]`;
    }
  }

  const negativeIndex = getNegativeIndexValue(right);
  if (negativeIndex !== null) {
    return `${leftPath}[${negativeIndex}]`;
  }

  const rightPath = buildDotPath(right);
  if (rightPath) {
    return `${leftPath}[${rightPath}]`;
  }
  return null;
}

function buildDotPath(node: ASTNode): string | null {
  if (typeof node === 'string') {
    return node;
  }

  if (!Array.isArray(node) || isLiteralArray(node)) {
    return null;
  }

  const [op, left, right] = node;

  if (op === '.') {
    return buildPropertyAccessPath(left as ASTNode, right as ASTNode);
  }

  if (op === '[]') {
    return buildArrayAccessPath(left as ASTNode, right as ASTNode);
  }

  return null;
}

function isNegativeIndexLiteral(index: unknown): boolean {
  if (!Array.isArray(index) || index[0] !== '-' || index.length !== 2) {
    return false;
  }
  const inner: unknown = index[1];
  return (
    Array.isArray(inner) &&
    isLiteralArray(inner) &&
    typeof inner[1] === 'number'
  );
}

function detectArrayAccessFeatures(
  index: ASTNode,
  features: Set<FormulaFeature>,
): void {
  if (Array.isArray(index) && isLiteralArray(index)) {
    if (index[1] === '*') {
      features.add('array_wildcard');
    } else if (typeof index[1] === 'number') {
      features.add('array_index');
    }
  }
  if (isNegativeIndexLiteral(index)) {
    features.add('array_index');
  }
}

function detectFunctionCallFeatures(
  funcName: ASTNode,
  features: Set<FormulaFeature>,
): void {
  if (typeof funcName === 'string' && isArrayFunction(funcName)) {
    features.add('array_function');
  }
}

function detectFeatures(node: ASTNode, features: Set<FormulaFeature>): void {
  if (typeof node === 'string') {
    if (isContextToken(node)) {
      features.add('context_token');
    }
    if (isRootPath(node)) {
      features.add('root_path');
      if (node.includes('.')) {
        features.add('nested_path');
      }
    }
    if (isRelativePath(node)) {
      features.add('relative_path');
      const withoutPrefix = node.replace(/^(\.\.\/)+/, '');
      if (withoutPrefix.includes('.')) {
        features.add('nested_path');
      }
    }
    return;
  }

  if (!Array.isArray(node) || isLiteralArray(node)) {
    return;
  }

  const op = node[0];

  if (op === '.') {
    features.add('nested_path');
  }

  if (op === '[]') {
    detectArrayAccessFeatures(node[2] as ASTNode, features);
  }

  if (op === '()') {
    detectFunctionCallFeatures(node[1] as ASTNode, features);
  }

  for (let i = 1; i < node.length; i++) {
    detectFeatures(node[i] as ASTNode, features);
  }
}

export function parseFormula(expression: string): ParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const ast = parse(trimmed) as ASTNode;

  const identifiers = new Set<string>();
  collectIdentifiers(ast, identifiers);

  const featuresSet = new Set<FormulaFeature>();
  detectFeatures(ast, featuresSet);

  const features = Array.from(featuresSet);
  const minVersion: FormulaMinorVersion = features.length > 0 ? '1.1' : '1.0';

  return {
    ast,
    dependencies: Array.from(identifiers),
    features,
    minVersion,
  };
}

export function validateSyntax(
  expression: string,
): { isValid: true } | { isValid: false; error: string; position?: number } {
  const trimmed = expression.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Empty expression' };
  }

  try {
    parse(trimmed);

    return { isValid: true };
  } catch (e) {
    const error = e as Error;
    const match = /at (\d+):(\d+)/.exec(error.message);
    const position = match
      ? Number.parseInt(match[2] ?? '0', 10) - 1
      : undefined;
    return {
      isValid: false,
      error: error.message,
      position,
    };
  }
}

export function evaluate(
  expression: string,
  context: Record<string, unknown>,
): unknown {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Empty expression');
  }
  const fn = subscript(trimmed);
  const safeContext: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value !== 'function') {
      safeContext[key] = value;
    }
  }
  return fn(safeContext);
}

/**
 * Options for evaluateWithContext
 */
export interface EvaluateContextOptions {
  /** Root document data - used for absolute paths (/field) */
  rootData: Record<string, unknown>;
  /** Current item data - merged with rootData, takes precedence */
  itemData?: Record<string, unknown>;
  /** Current path in document (e.g. 'items[0]') - used for relative paths (../field) */
  currentPath?: string;
}

/**
 * Get value by dot-separated path from object
 */
function getValueByPath(
  data: Record<string, unknown>,
  path: string,
): unknown {
  const segments = path.split('.');
  let current: unknown = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Build path references for absolute and relative paths.
 *
 * Subscript parses paths differently based on nesting:
 * - "/config.tax" → [".", "/config", "tax"] - property access with /config as root
 * - "../settings.multiplier" → "../settings.multiplier" as single string token
 *
 * So for "/" paths we add the root field as object (e.g., "/config" → rootData.config)
 * For "../" paths we add the full resolved value (e.g., "../settings.multiplier" → rootData.settings.multiplier)
 */
function buildPathReferences(
  rootData: Record<string, unknown>,
  dependencies: string[],
): Record<string, unknown> {
  const refs: Record<string, unknown> = {};

  for (const dep of dependencies) {
    if (dep.startsWith('/')) {
      // Absolute path: /field or /nested.field
      // Subscript parses as property access: [".", "/field", "nested"]
      // So we need to add "/field" → rootData.field as object
      const fieldPath = dep.slice(1);
      const rootField = fieldPath.split('.')[0] ?? fieldPath;
      const contextKey = '/' + rootField;
      if (!(contextKey in refs)) {
        refs[contextKey] = getValueByPath(rootData, rootField);
      }
    } else if (dep.startsWith('../')) {
      // Relative path: ../field or ../nested.field
      // Subscript parses as single string token: "../nested.field"
      // So we add the full path as key with resolved value
      const fieldPath = dep.slice(3);
      refs[dep] = getValueByPath(rootData, fieldPath);
    }
  }

  return refs;
}

/**
 * Evaluate formula with context - resolves absolute and relative paths automatically.
 *
 * @param expression - Formula expression string
 * @param options - Evaluation context options
 * @returns Evaluated result
 *
 * @example
 * // Simple evaluation at root level
 * evaluateWithContext('price * quantity', {
 *   rootData: { price: 100, quantity: 2 }
 * });
 * // → 200
 *
 * @example
 * // Evaluation in array item with absolute path
 * evaluateWithContext('price * (1 + /taxRate)', {
 *   rootData: { taxRate: 0.1, items: [...] },
 *   itemData: { price: 100 },
 *   currentPath: 'items[0]'
 * });
 * // → 110
 *
 * @example
 * // Evaluation with relative path
 * evaluateWithContext('price * (1 - ../discount)', {
 *   rootData: { discount: 0.2, items: [...] },
 *   itemData: { price: 100 },
 *   currentPath: 'items[0]'
 * });
 * // → 80
 */
export function evaluateWithContext(
  expression: string,
  options: EvaluateContextOptions,
): unknown {
  const { rootData, itemData } = options;
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new Error('Empty expression');
  }

  // Parse to get dependencies
  const parsed = parseFormula(trimmed);

  // Build path references for / and ../ paths
  const pathRefs = buildPathReferences(rootData, parsed.dependencies);

  // Build final context
  const context: Record<string, unknown> = {
    ...rootData,
    ...(itemData ?? {}),
    ...pathRefs,
  };

  return evaluate(trimmed, context);
}

/**
 * Inferred type of a formula expression
 */
export type InferredType = 'number' | 'boolean' | 'string' | 'unknown';

/**
 * Schema field types for type inference
 */
export interface FieldTypes {
  [fieldName: string]: 'number' | 'string' | 'boolean' | 'object' | 'array';
}

const ARITHMETIC_OPS = new Set(['+', '-', '*', '/', '%']);
const COMPARISON_OPS = new Set(['<', '>', '<=', '>=', '==', '!=']);
const LOGICAL_OPS = new Set(['&&', '||', '!']);
const NUMERIC_FUNCTIONS = new Set([
  'round',
  'floor',
  'ceil',
  'abs',
  'sqrt',
  'pow',
  'min',
  'max',
  'log',
  'log10',
  'exp',
  'sign',
  'sum',
  'avg',
  'count',
  'tonumber',
  'length',
]);
const STRING_FUNCTIONS = new Set([
  'concat',
  'upper',
  'lower',
  'trim',
  'left',
  'right',
  'replace',
  'tostring',
  'join',
]);
const BOOLEAN_FUNCTIONS = new Set([
  'and',
  'or',
  'not',
  'contains',
  'startswith',
  'endswith',
  'isnull',
  'toboolean',
  'includes',
]);

function getFieldType(path: string, fieldTypes: FieldTypes): InferredType {
  const rootField = path.split('.')[0]?.split('[')[0] || path;
  const schemaType = fieldTypes[rootField];
  if (schemaType === 'number') return 'number';
  if (schemaType === 'string') return 'string';
  if (schemaType === 'boolean') return 'boolean';
  return 'unknown';
}

function inferPrimitiveType(
  node: ASTNode,
  fieldTypes: FieldTypes,
): InferredType | null {
  if (typeof node === 'number') return 'number';
  if (typeof node === 'boolean') return 'boolean';
  if (typeof node === 'string') return getFieldType(node, fieldTypes);
  if (node === null) return 'unknown';
  return null;
}

function inferLiteralArrayType(node: unknown[]): InferredType {
  const val = node[1];
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  return 'unknown';
}

function inferOperatorType(
  op: string,
  argsLength: number,
  argTypes?: InferredType[],
): InferredType | null {
  if (op === '+' && argTypes) {
    if (argTypes.includes('string')) return 'string';
    if (argTypes.includes('unknown')) return 'unknown';
    return 'number';
  }
  if (ARITHMETIC_OPS.has(op)) return 'number';
  if (COMPARISON_OPS.has(op)) return 'boolean';
  if (LOGICAL_OPS.has(op)) return 'boolean';
  if (op === '-' && argsLength === 1) return 'number';
  return null;
}

function inferPropertyAccessType(
  node: ASTNode,
  fieldTypes: FieldTypes,
): InferredType {
  const path = buildDotPath(node);
  return path ? getFieldType(path, fieldTypes) : 'unknown';
}

function inferFunctionCallType(funcName: ASTNode): InferredType {
  if (typeof funcName !== 'string') return 'unknown';
  const lowerName = funcName.toLowerCase();
  if (NUMERIC_FUNCTIONS.has(lowerName)) return 'number';
  if (STRING_FUNCTIONS.has(lowerName)) return 'string';
  if (BOOLEAN_FUNCTIONS.has(lowerName)) return 'boolean';
  return 'unknown';
}

function inferTypeFromNode(
  node: ASTNode,
  fieldTypes: FieldTypes,
): InferredType {
  const primitiveType = inferPrimitiveType(node, fieldTypes);
  if (primitiveType !== null) return primitiveType;

  if (!Array.isArray(node)) return 'unknown';
  if (isLiteralArray(node)) return inferLiteralArrayType(node);

  const [op, ...args] = node;

  const argTypes =
    op === '+'
      ? args.map((arg) => inferTypeFromNode(arg, fieldTypes))
      : undefined;
  const operatorType = inferOperatorType(op, args.length, argTypes);
  if (operatorType !== null) return operatorType;

  if (op === '.' || op === '[]') {
    return inferPropertyAccessType(node, fieldTypes);
  }

  if (op === '()') {
    return inferFunctionCallType(args[0] as ASTNode);
  }

  return 'unknown';
}

/**
 * Infer the return type of a formula expression
 *
 * @param expression - Formula expression string
 * @param fieldTypes - Map of field names to their types from schema
 * @returns Inferred type of the expression result
 *
 * @example
 * inferFormulaType('price * quantity', { price: 'number', quantity: 'number' })
 * // 'number'
 *
 * inferFormulaType('price > 100', { price: 'number' })
 * // 'boolean'
 *
 * inferFormulaType('name', { name: 'string' })
 * // 'string'
 */
export function inferFormulaType(
  expression: string,
  fieldTypes: FieldTypes = {},
): InferredType {
  const trimmed = expression.trim();
  if (!trimmed) {
    return 'unknown';
  }

  try {
    const ast = parse(trimmed) as ASTNode;
    return inferTypeFromNode(ast, fieldTypes);
  } catch {
    return 'unknown';
  }
}

export { parse, compile } from 'subscript';
