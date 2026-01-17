import subscript, { parse, compile, token } from 'subscript';
import { FormulaFeature, FormulaMinorVersion } from './types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - subscript internal module
import * as parseModule from 'subscript/src/parse.js';

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

export type ASTNode = string | number | boolean | null | [string, ...ASTNode[]];

const KEYWORDS = new Set([
  'true',
  'false',
  'null',
  'and',
  'or',
  'not',
  'if',
  'constructor',
  '__proto__',
  'prototype',
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
  'filter',
  'map',
  'includes',
]);

const ARRAY_FUNCTIONS = new Set([
  'sum',
  'avg',
  'count',
  'first',
  'last',
  'join',
  'filter',
  'map',
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
    const position = match ? parseInt(match[2] ?? '0', 10) - 1 : undefined;
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
  const fn = subscript(expression);
  return fn(context);
}

export { parse, compile };
