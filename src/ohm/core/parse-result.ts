import type { CompiledFormula } from './compiled-formula';
import type { ASTNode } from './types';
import type { FormulaFeature, FormulaMinorVersion } from '../../types';

export interface ParseResult {
  ast: ASTNode;
  dependencies: string[];
  features: FormulaFeature[];
  minVersion: FormulaMinorVersion;
}

export function createParseResult(formula: CompiledFormula): ParseResult {
  return {
    ast: copyAst(formula.ast),
    dependencies: [...formula.dependencies],
    features: [...formula.features],
    minVersion: formula.minVersion,
  };
}

function copyAst(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
      return { type: node.type, value: node.value } as ASTNode;
    case 'NullLiteral':
      return { type: node.type };
    case 'Identifier':
    case 'BracketedIdentifier':
    case 'ContextToken':
      return { type: node.type, name: node.name };
    case 'RootPath':
    case 'RelativePath':
      return { type: node.type, path: node.path };
    case 'BinaryOp':
      return {
        type: node.type,
        op: node.op,
        left: copyAst(node.left),
        right: copyAst(node.right),
      };
    case 'UnaryOp':
      return { type: node.type, op: node.op, argument: copyAst(node.argument) };
    case 'TernaryOp':
      return {
        type: node.type,
        condition: copyAst(node.condition),
        consequent: copyAst(node.consequent),
        alternate: copyAst(node.alternate),
      };
    case 'CallExpression':
      return {
        type: node.type,
        callee: copyAst(node.callee),
        arguments: node.arguments.map(copyAst),
      };
    case 'MemberExpression':
    case 'BracketedMemberExpression':
      return {
        type: node.type,
        object: copyAst(node.object),
        property: node.property,
      };
    case 'IndexExpression':
      return {
        type: node.type,
        object: copyAst(node.object),
        index: copyAst(node.index),
      };
    case 'WildcardExpression':
      return { type: node.type, object: copyAst(node.object) };
  }
}
