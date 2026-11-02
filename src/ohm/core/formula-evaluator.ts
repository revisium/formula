import { BUILTIN_FUNCTIONS } from './builtin-functions';
import type {
  ASTNode,
  BinaryOp,
  BracketedMemberExpression,
  CallExpression,
  IndexExpression,
  MemberExpression,
  RelativePath,
  RootPath,
  TernaryOp,
  UnaryOp,
  WildcardExpression,
} from './types';

export type EvaluationContext = Record<string, unknown>;

export type FormulaEvaluator = (context: EvaluationContext) => unknown;

type AnyFunction = (...args: unknown[]) => unknown;

function isSafePropertyName(name: string): boolean {
  return name !== '__proto__';
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function compileEvaluator(node: ASTNode): FormulaEvaluator {
  switch (node.type) {
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
      return compileConstant(node.value);
    case 'NullLiteral':
      return compileConstant(null);
    case 'Identifier':
    case 'ContextToken':
      return compileContextLookup(node.name);
    case 'BracketedIdentifier':
      return compileBracketedIdentifier(node.name);
    case 'RootPath':
      return compileRootPath(node);
    case 'RelativePath':
      return compileRelativePath(node);
    case 'UnaryOp':
      return compileUnaryOp(node);
    case 'BinaryOp':
      return compileBinaryOp(node);
    case 'TernaryOp':
      return compileTernaryOp(node);
    case 'CallExpression':
      return compileCall(node);
    case 'MemberExpression':
      return compileMemberExpression(node);
    case 'BracketedMemberExpression':
      return compileBracketedMemberExpression(node);
    case 'IndexExpression':
      return compileIndexExpression(node);
    case 'WildcardExpression':
      return compileWildcardExpression(node);
  }
}

function compileConstant(value: unknown): FormulaEvaluator {
  return () => value;
}

function compileContextLookup(name: string): FormulaEvaluator {
  return (context) => context[name];
}

function compileBracketedIdentifier(name: string): FormulaEvaluator {
  if (!isSafePropertyName(name)) {
    return () => undefined;
  }
  return (context) => context[name];
}

function compileRootPath(node: RootPath): FormulaEvaluator {
  const fullPath = node.path;
  const parts = fullPath.slice(1).split('.');
  const firstPart = parts[0];

  return (context) => {
    if (fullPath in context) {
      return context[fullPath];
    }
    if (!firstPart) {
      return undefined;
    }
    let value = context['/' + firstPart];
    for (let i = 1; i < parts.length; i++) {
      if (value === null || value === undefined) {
        return undefined;
      }
      const part = parts[i];
      if (part) {
        value = (value as Record<string, unknown>)[part];
      }
    }
    return value;
  };
}

function compileRelativePath(node: RelativePath): FormulaEvaluator {
  const fullPath = node.path;
  const pathAfterParents = fullPath.replace(/^(\.\.\/)+/, '');

  return (context) => {
    if (fullPath in context) {
      return context[fullPath];
    }
    return getByPath(context, pathAfterParents);
  };
}

function compileUnaryOp(node: UnaryOp): FormulaEvaluator {
  const argument = compileEvaluator(node.argument);

  switch (node.op) {
    case '-':
      return (context) => -(argument(context) as number);
    case '!':
      return (context) => !argument(context);
    default:
      throw new Error(`Unsupported unary operator: ${node.op}`);
  }
}

function compileBinaryOp(node: BinaryOp): FormulaEvaluator {
  const left = compileEvaluator(node.left);
  const right = compileEvaluator(node.right);

  switch (node.op) {
    case '||':
      return (context) => left(context) || right(context);
    case '&&':
      return (context) => left(context) && right(context);
    case '==':
      return (context) => left(context) == right(context);
    case '!=':
      return (context) => left(context) != right(context);
    case '>=':
      return (context) =>
        (left(context) as number) >= (right(context) as number);
    case '<=':
      return (context) =>
        (left(context) as number) <= (right(context) as number);
    case '>':
      return (context) =>
        (left(context) as number) > (right(context) as number);
    case '<':
      return (context) =>
        (left(context) as number) < (right(context) as number);
    case '+':
      return (context) => add(left(context), right(context));
    case '-':
      return (context) =>
        (left(context) as number) - (right(context) as number);
    case '*':
      return (context) =>
        (left(context) as number) * (right(context) as number);
    case '/':
      return (context) =>
        (left(context) as number) / (right(context) as number);
    case '%':
      return (context) =>
        (left(context) as number) % (right(context) as number);
    default:
      throw new Error(`Unsupported binary operator: ${node.op}`);
  }
}

function add(left: unknown, right: unknown): unknown {
  if (typeof left === 'string' || typeof right === 'string') {
    return String(left) + String(right);
  }
  return (left as number) + (right as number);
}

function compileTernaryOp(node: TernaryOp): FormulaEvaluator {
  const condition = compileEvaluator(node.condition);
  const consequent = compileEvaluator(node.consequent);
  const alternate = compileEvaluator(node.alternate);

  return (context) =>
    condition(context) ? consequent(context) : alternate(context);
}

function compileArguments(
  nodes: ASTNode[],
): (context: EvaluationContext) => unknown[] {
  const evaluators = nodes.map(compileEvaluator);
  return (context) =>
    evaluators.map((evaluateArgument) => evaluateArgument(context));
}

function compileCall(node: CallExpression): FormulaEvaluator {
  const { callee } = node;
  const evaluateArguments = compileArguments(node.arguments);

  if (callee.type === 'Identifier') {
    // The name is observable: `__proto__(1)` throws "builtinFn is not a function".
    const builtinFn = BUILTIN_FUNCTIONS[callee.name.toLowerCase()];
    if (builtinFn) {
      return (context) => builtinFn(...evaluateArguments(context));
    }
  }

  const evaluateCallee = compileEvaluator(callee);
  const calleeName = callee.type === 'Identifier' ? callee.name : 'expression';

  return (context) => {
    const fn = evaluateCallee(context);
    if (typeof fn === 'function') {
      return (fn as AnyFunction)(...evaluateArguments(context));
    }
    throw new Error(`'${calleeName}' is not a function`);
  };
}

function compileMemberExpression(node: MemberExpression): FormulaEvaluator {
  const evaluateObject = compileEvaluator(node.object);
  const { property } = node;

  return (context) => {
    const objectValue = evaluateObject(context);
    if (Array.isArray(objectValue)) {
      return objectValue.map(
        (item) => (item as Record<string, unknown>)?.[property],
      );
    }
    return (objectValue as Record<string, unknown>)?.[property];
  };
}

function compileBracketedMemberExpression(
  node: BracketedMemberExpression,
): FormulaEvaluator {
  const evaluateObject = compileEvaluator(node.object);
  const { property } = node;

  if (!isSafePropertyName(property)) {
    return (context) => {
      evaluateObject(context);
      return undefined;
    };
  }

  return (context) =>
    (evaluateObject(context) as Record<string, unknown>)?.[property];
}

function compileIndexExpression(node: IndexExpression): FormulaEvaluator {
  const evaluateObject = compileEvaluator(node.object);
  const evaluateIndex = compileEvaluator(node.index);

  return (context) => {
    const objectValue = evaluateObject(context);
    const index = evaluateIndex(context);
    if (typeof index === 'string') {
      if (!isSafePropertyName(index)) {
        return undefined;
      }
      return (objectValue as Record<string, unknown>)?.[index];
    }
    const numericIndex = index as number;
    if (numericIndex < 0) {
      return (objectValue as unknown[])?.[
        (objectValue as unknown[]).length + numericIndex
      ];
    }
    return (objectValue as unknown[])?.[numericIndex];
  };
}

function compileWildcardExpression(node: WildcardExpression): FormulaEvaluator {
  const evaluateObject = compileEvaluator(node.object);

  return (context) => {
    const objectValue = evaluateObject(context);
    if (
      Array.isArray(objectValue) &&
      objectValue.length > 0 &&
      Array.isArray(objectValue[0])
    ) {
      return (objectValue as unknown[]).flat();
    }
    return objectValue;
  };
}
