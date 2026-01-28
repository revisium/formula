import type { ASTNode } from './types';

function escapeDoubleQuoted(value: string): string {
  let result = '';
  for (const char of value) {
    switch (char) {
      case '\\':
        result += String.raw`\\`;
        break;
      case '"':
        result += String.raw`\"`;
        break;
      case '\n':
        result += String.raw`\n`;
        break;
      case '\r':
        result += String.raw`\r`;
        break;
      case '\t':
        result += String.raw`\t`;
        break;
      default:
        result += char;
    }
  }
  return result;
}

const PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '>': 4,
  '<': 4,
  '>=': 4,
  '<=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
};

function serializeBinaryOp(node: ASTNode & { type: 'BinaryOp' }): string {
  const prec = PRECEDENCE[node.op] ?? 0;

  const wrapLeft = (child: ASTNode): string => {
    const s = serializeNode(child);
    if (child.type === 'BinaryOp') {
      const childPrec = PRECEDENCE[child.op] ?? 0;
      if (childPrec < prec) {
        return `(${s})`;
      }
    }
    if (child.type === 'TernaryOp') {
      return `(${s})`;
    }
    return s;
  };

  const wrapRight = (child: ASTNode): string => {
    const s = serializeNode(child);
    if (child.type === 'BinaryOp') {
      const childPrec = PRECEDENCE[child.op] ?? 0;
      if (childPrec <= prec) {
        return `(${s})`;
      }
    }
    if (child.type === 'TernaryOp') {
      return `(${s})`;
    }
    return s;
  };

  return `${wrapLeft(node.left)} ${node.op} ${wrapRight(node.right)}`;
}

function serializeNode(node: ASTNode): string {
  switch (node.type) {
    case 'NumberLiteral':
      return String(node.value);
    case 'StringLiteral':
      return `"${escapeDoubleQuoted(node.value)}"`;
    case 'BooleanLiteral':
      return String(node.value);
    case 'NullLiteral':
      return 'null';
    case 'Identifier':
      return node.name;
    case 'BracketedIdentifier':
      return `["${escapeDoubleQuoted(node.name)}"]`;
    case 'RootPath':
      return node.path;
    case 'RelativePath':
      return node.path;
    case 'ContextToken':
      return node.name;
    case 'BinaryOp':
      return serializeBinaryOp(node);
    case 'UnaryOp':
      return `${node.op}${serializeUnaryArgument(node)}`;
    case 'TernaryOp':
      return `${serializeTernaryCondition(node.condition)} ? ${serializeNode(node.consequent)} : ${serializeNode(node.alternate)}`;
    case 'CallExpression':
      return `${serializeNode(node.callee)}(${node.arguments.map(serializeNode).join(', ')})`;
    case 'MemberExpression':
      return `${serializePostfixObject(node.object)}.${node.property}`;
    case 'BracketedMemberExpression':
      return `${serializePostfixObject(node.object)}["${escapeDoubleQuoted(node.property)}"]`;
    case 'IndexExpression':
      return `${serializePostfixObject(node.object)}[${serializeNode(node.index)}]`;
    case 'WildcardExpression':
      return `${serializePostfixObject(node.object)}[*]`;
  }
}

function serializeUnaryArgument(node: ASTNode & { type: 'UnaryOp' }): string {
  const s = serializeNode(node.argument);
  if (node.argument.type === 'BinaryOp' || node.argument.type === 'TernaryOp') {
    return `(${s})`;
  }
  return s;
}

function serializeTernaryCondition(node: ASTNode): string {
  const s = serializeNode(node);
  if (node.type === 'TernaryOp') {
    return `(${s})`;
  }
  return s;
}

function serializePostfixObject(node: ASTNode): string {
  const s = serializeNode(node);
  if (
    node.type === 'BinaryOp' ||
    node.type === 'TernaryOp' ||
    node.type === 'UnaryOp'
  ) {
    return `(${s})`;
  }
  return s;
}

export function serializeAst(ast: ASTNode): string {
  return serializeNode(ast);
}
