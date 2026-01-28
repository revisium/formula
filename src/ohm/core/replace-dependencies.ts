import type { ASTNode } from './types';
import { parseFormula } from './parser';

function collectDependencyPath(node: ASTNode): string | null {
  switch (node.type) {
    case 'Identifier':
      return node.name;
    case 'BracketedIdentifier':
      return `["${node.name}"]`;
    case 'RootPath':
      return node.path;
    case 'RelativePath':
      return node.path;
    case 'MemberExpression': {
      const objPath = collectDependencyPath(node.object);
      if (objPath === null) {
        return null;
      }
      return `${objPath}.${node.property}`;
    }
    case 'BracketedMemberExpression': {
      const objPath = collectDependencyPath(node.object);
      if (objPath === null) {
        return null;
      }
      const quote = '"';
      return `${objPath}[${quote}${node.property}${quote}]`;
    }
    case 'IndexExpression': {
      const objPath = collectDependencyPath(node.object);
      if (objPath === null) {
        return null;
      }
      const numericIndex = getNumericIndex(node.index);
      if (numericIndex !== null) {
        return `${objPath}[${numericIndex}]`;
      }
      return null;
    }
    case 'WildcardExpression': {
      const objPath = collectDependencyPath(node.object);
      if (objPath === null) {
        return null;
      }
      return `${objPath}[*]`;
    }
    default:
      return null;
  }
}

function getNumericIndex(node: ASTNode): number | null {
  if (node.type === 'NumberLiteral') {
    return node.value;
  }
  if (
    node.type === 'UnaryOp' &&
    node.op === '-' &&
    node.argument.type === 'NumberLiteral'
  ) {
    return -node.argument.value;
  }
  return null;
}

function findMatch(
  node: ASTNode,
  replacements: Record<string, string>,
): string | null {
  const fullPath = collectDependencyPath(node);
  if (fullPath !== null) {
    const value = replacements[fullPath];
    if (value !== undefined) {
      return value;
    }
  }
  return null;
}

function pathToAst(path: string): ASTNode {
  const { ast } = parseFormula(path);
  return ast;
}

function replaceNode(
  node: ASTNode,
  replacements: Record<string, string>,
): ASTNode {
  const replacement = findMatch(node, replacements);
  if (replacement !== null) {
    return pathToAst(replacement);
  }

  switch (node.type) {
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'Identifier':
    case 'BracketedIdentifier':
    case 'RootPath':
    case 'RelativePath':
    case 'ContextToken':
      return node;

    case 'BinaryOp':
      return {
        ...node,
        left: replaceNode(node.left, replacements),
        right: replaceNode(node.right, replacements),
      };

    case 'UnaryOp':
      return {
        ...node,
        argument: replaceNode(node.argument, replacements),
      };

    case 'TernaryOp':
      return {
        ...node,
        condition: replaceNode(node.condition, replacements),
        consequent: replaceNode(node.consequent, replacements),
        alternate: replaceNode(node.alternate, replacements),
      };

    case 'CallExpression':
      return {
        ...node,
        callee: replaceNode(node.callee, replacements),
        arguments: node.arguments.map((arg) => replaceNode(arg, replacements)),
      };

    case 'MemberExpression':
    case 'BracketedMemberExpression':
    case 'WildcardExpression':
      return {
        ...node,
        object: replaceNode(node.object, replacements),
      };

    case 'IndexExpression':
      return {
        ...node,
        object: replaceNode(node.object, replacements),
        index: replaceNode(node.index, replacements),
      };
  }
}

export function replaceDependencies(
  ast: ASTNode,
  replacements: Record<string, string>,
): ASTNode {
  return replaceNode(ast, replacements);
}
