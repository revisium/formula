export type ASTNode =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | Identifier
  | BracketedIdentifier
  | RootPath
  | RelativePath
  | ContextToken
  | BinaryOp
  | UnaryOp
  | TernaryOp
  | CallExpression
  | MemberExpression
  | BracketedMemberExpression
  | IndexExpression
  | WildcardExpression;

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NullLiteral {
  type: 'NullLiteral';
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface BracketedIdentifier {
  type: 'BracketedIdentifier';
  name: string;
}

export interface RootPath {
  type: 'RootPath';
  path: string;
}

export interface RelativePath {
  type: 'RelativePath';
  path: string;
}

export interface ContextToken {
  type: 'ContextToken';
  name: string;
}

export interface BinaryOp {
  type: 'BinaryOp';
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOp {
  type: 'UnaryOp';
  op: string;
  argument: ASTNode;
}

export interface TernaryOp {
  type: 'TernaryOp';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: ASTNode;
  property: string;
}

export interface BracketedMemberExpression {
  type: 'BracketedMemberExpression';
  object: ASTNode;
  property: string;
}

export interface IndexExpression {
  type: 'IndexExpression';
  object: ASTNode;
  index: ASTNode;
}

export interface WildcardExpression {
  type: 'WildcardExpression';
  object: ASTNode;
}
