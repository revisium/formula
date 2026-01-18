import { grammar } from '../grammar';
import { semantics } from '../semantics';
import type { ASTNode } from './types';
import type { FormulaFeature, FormulaMinorVersion } from '../../types';

export interface ParseResult {
  ast: ASTNode;
  dependencies: string[];
  features: FormulaFeature[];
  minVersion: FormulaMinorVersion;
}

export function parseFormula(expression: string): ParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const matchResult = grammar.match(trimmed);
  if (matchResult.failed()) {
    throw new Error(matchResult.message ?? 'Parse error');
  }

  const adapter = semantics(matchResult);
  const ast = adapter.toAST() as ASTNode;
  const dependencies = [...new Set(adapter.dependencies() as string[])];
  const allFeatures = adapter.features() as FormulaFeature[];
  const features = [...new Set(allFeatures)];
  const minVersion: FormulaMinorVersion = features.length > 0 ? '1.1' : '1.0';

  return { ast, dependencies, features, minVersion };
}

export function validateSyntax(
  expression: string,
): { isValid: true } | { isValid: false; error: string; position?: number } {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Empty expression' };
  }

  const matchResult = grammar.match(trimmed);
  if (matchResult.failed()) {
    const pos = matchResult.getRightmostFailurePosition?.();
    return {
      isValid: false,
      error: matchResult.message ?? 'Parse error',
      position: pos,
    };
  }

  return { isValid: true };
}

export function evaluate(
  expression: string,
  context: Record<string, unknown>,
): unknown {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const matchResult = grammar.match(trimmed);
  if (matchResult.failed()) {
    throw new Error(matchResult.message ?? 'Parse error');
  }

  const safeContext: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value !== 'function') {
      safeContext[key] = value;
    }
  }

  return semantics(matchResult).eval(safeContext);
}

export interface EvaluateContextOptions {
  rootData: Record<string, unknown>;
  itemData?: Record<string, unknown>;
  currentPath?: string;
}

function getValueByPath(data: Record<string, unknown>, path: string): unknown {
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

function buildPathReferences(
  rootData: Record<string, unknown>,
  dependencies: string[],
): Record<string, unknown> {
  const refs: Record<string, unknown> = {};

  for (const dep of dependencies) {
    if (dep.startsWith('/')) {
      const fieldPath = dep.slice(1);
      const rootField = fieldPath.split('.')[0] ?? fieldPath;
      const contextKey = '/' + rootField;
      if (!(contextKey in refs)) {
        refs[contextKey] = getValueByPath(rootData, rootField);
      }
    } else if (dep.startsWith('../')) {
      const fieldPath = dep.slice(3);
      refs[dep] = getValueByPath(rootData, fieldPath);
    }
  }

  return refs;
}

export function evaluateWithContext(
  expression: string,
  options: EvaluateContextOptions,
): unknown {
  const { rootData, itemData } = options;
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const parsed = parseFormula(trimmed);
  const pathRefs = buildPathReferences(rootData, parsed.dependencies);

  const context: Record<string, unknown> = {
    ...rootData,
    ...(itemData ?? {}),
    ...pathRefs,
  };

  return evaluate(trimmed, context);
}

export type InferredType = 'number' | 'boolean' | 'string' | 'unknown';

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

function inferLiteralType(node: ASTNode): InferredType | null {
  switch (node.type) {
    case 'NumberLiteral':
      return 'number';
    case 'BooleanLiteral':
      return 'boolean';
    case 'StringLiteral':
      return 'string';
    case 'NullLiteral':
      return 'unknown';
    default:
      return null;
  }
}

function inferBinaryOpType(
  node: ASTNode & { type: 'BinaryOp' },
  fieldTypes: FieldTypes,
): InferredType {
  const { op } = node;
  if (op === '+') {
    const leftType = inferTypeFromAST(node.left, fieldTypes);
    const rightType = inferTypeFromAST(node.right, fieldTypes);
    if (leftType === 'string' || rightType === 'string') return 'string';
    if (leftType === 'unknown' || rightType === 'unknown') return 'unknown';
    return 'number';
  }
  if (ARITHMETIC_OPS.has(op)) return 'number';
  if (COMPARISON_OPS.has(op)) return 'boolean';
  if (LOGICAL_OPS.has(op)) return 'boolean';
  return 'unknown';
}

function inferCallExpressionType(
  node: ASTNode & { type: 'CallExpression' },
  fieldTypes: FieldTypes,
): InferredType {
  const funcName =
    node.callee.type === 'Identifier' ? node.callee.name.toLowerCase() : '';
  if (NUMERIC_FUNCTIONS.has(funcName)) return 'number';
  if (STRING_FUNCTIONS.has(funcName)) return 'string';
  if (BOOLEAN_FUNCTIONS.has(funcName)) return 'boolean';
  if (funcName === 'if' && node.arguments.length >= 3) {
    const thenArg = node.arguments[1];
    const elseArg = node.arguments[2];
    if (thenArg && elseArg) {
      const thenType = inferTypeFromAST(thenArg, fieldTypes);
      const elseType = inferTypeFromAST(elseArg, fieldTypes);
      if (thenType === elseType) return thenType;
    }
  }
  return 'unknown';
}

function inferTypeFromAST(node: ASTNode, fieldTypes: FieldTypes): InferredType {
  const literalType = inferLiteralType(node);
  if (literalType !== null) return literalType;

  switch (node.type) {
    case 'Identifier':
      return getFieldType(node.name, fieldTypes);
    case 'RootPath':
    case 'RelativePath':
    case 'ContextToken':
    case 'IndexExpression':
    case 'WildcardExpression':
      return 'unknown';
    case 'MemberExpression': {
      const objectType = inferTypeFromAST(node.object, fieldTypes);
      if (objectType !== 'unknown') return objectType;
      if (node.object.type === 'Identifier') {
        return getFieldType(`${node.object.name}.${node.property}`, fieldTypes);
      }
      return 'unknown';
    }
    case 'BinaryOp':
      return inferBinaryOpType(node, fieldTypes);
    case 'UnaryOp': {
      if (node.op === '-') return 'number';
      if (node.op === '!') return 'boolean';
      return 'unknown';
    }
    case 'TernaryOp': {
      const thenType = inferTypeFromAST(node.consequent, fieldTypes);
      const elseType = inferTypeFromAST(node.alternate, fieldTypes);
      return thenType === elseType ? thenType : 'unknown';
    }
    case 'CallExpression':
      return inferCallExpressionType(node, fieldTypes);
    default:
      return 'unknown';
  }
}

export function inferFormulaType(
  expression: string,
  fieldTypes: FieldTypes = {},
): InferredType {
  const trimmed = expression.trim();
  if (!trimmed) {
    return 'unknown';
  }

  try {
    const { ast } = parseFormula(trimmed);
    return inferTypeFromAST(ast, fieldTypes);
  } catch {
    return 'unknown';
  }
}
