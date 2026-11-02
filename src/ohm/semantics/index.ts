import type { NonterminalNode, TerminalNode, IterationNode } from 'ohm-js';
import { grammar } from '../grammar';
import type { ASTNode } from '../core/types';
import type { FormulaFeature } from '../../types';

type OhmNode = NonterminalNode | TerminalNode | IterationNode;

function childrenToAST(children: OhmNode[]): ASTNode[] {
  return children
    .filter((c): c is NonterminalNode => 'toAST' in c)
    .map((c) => c.toAST() as ASTNode);
}

function childrenDependencies(children: OhmNode[]): string[] {
  return children
    .filter((c): c is NonterminalNode => 'dependencies' in c)
    .flatMap((c) => c.dependencies() as string[]);
}

function childrenFeatures(children: OhmNode[]): FormulaFeature[] {
  return children
    .filter((c): c is NonterminalNode => 'features' in c)
    .flatMap((c) => c.features() as FormulaFeature[]);
}

export const semantics = grammar.createSemantics();

// ============ toAST Operation ============
semantics.addOperation<ASTNode>('toAST', {
  Expression(e) {
    return e.toAST();
  },

  Ternary_ternary(cond, _q, cons, _c, alt) {
    return {
      type: 'TernaryOp',
      condition: cond.toAST(),
      consequent: cons.toAST(),
      alternate: alt.toAST(),
    };
  },
  Ternary(e) {
    return e.toAST();
  },

  LogicalOr_or(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '||',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  LogicalOr(e) {
    return e.toAST();
  },

  LogicalAnd_and(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '&&',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  LogicalAnd(e) {
    return e.toAST();
  },

  Equality_eq(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '==',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Equality_neq(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '!=',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Equality(e) {
    return e.toAST();
  },

  Comparison_gte(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '>=',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Comparison_lte(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '<=',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Comparison_gt(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '>',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Comparison_lt(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '<',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Comparison(e) {
    return e.toAST();
  },

  Additive_plus(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '+',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Additive_minus(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '-',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Additive(e) {
    return e.toAST();
  },

  Multiplicative_times(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '*',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Multiplicative_div(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '/',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Multiplicative_mod(left, _op, right) {
    return {
      type: 'BinaryOp',
      op: '%',
      left: left.toAST(),
      right: right.toAST(),
    };
  },
  Multiplicative(e) {
    return e.toAST();
  },

  Unary_neg(_op, expr) {
    return { type: 'UnaryOp', op: '-', argument: expr.toAST() };
  },
  Unary_not(_op, expr) {
    return { type: 'UnaryOp', op: '!', argument: expr.toAST() };
  },
  Unary(e) {
    return e.toAST();
  },

  Postfix_call(callee, _lp, args, _rp) {
    const firstArg = args.children[0];
    const argList = firstArg ? firstArg.toAST() : [];
    return {
      type: 'CallExpression',
      callee: callee.toAST(),
      arguments: Array.isArray(argList) ? argList : [argList],
    };
  },
  Postfix_property(obj, _dot, prop) {
    return {
      type: 'MemberExpression',
      object: obj.toAST(),
      property: prop.sourceString,
    };
  },
  Postfix_index(obj, _lb, index, _rb) {
    const indexAST = index.toAST() as ASTNode;
    if (indexAST.type === 'StringLiteral') {
      return {
        type: 'BracketedMemberExpression',
        object: obj.toAST(),
        property: indexAST.value,
      };
    }
    return {
      type: 'IndexExpression',
      object: obj.toAST(),
      index: indexAST,
    };
  },
  Postfix_wildcard(obj, _lb, _star, _rb) {
    return {
      type: 'WildcardExpression',
      object: obj.toAST(),
    };
  },
  Postfix(e) {
    return e.toAST();
  },

  // Returns an array of arguments, not a single ASTNode
  // @ts-expect-error - intentionally returns array for function arguments
  Arguments(first, _comma, rest) {
    return [first.toAST(), ...rest.children.map((c) => c.toAST())];
  },

  Primary_paren(_lp, expr, _rp) {
    return expr.toAST();
  },
  Primary_bracketedField(_lb, str, _rb) {
    const strAST = str.toAST() as { type: 'StringLiteral'; value: string };
    return { type: 'BracketedIdentifier', name: strAST.value };
  },
  Primary(e) {
    return e.toAST();
  },

  number_float(_neg, _int, _dot, _frac) {
    return {
      type: 'NumberLiteral',
      value: Number.parseFloat(this.sourceString),
    };
  },
  number_int(_neg, _digits) {
    return {
      type: 'NumberLiteral',
      value: Number.parseInt(this.sourceString, 10),
    };
  },

  string(_open, chars, _close) {
    const raw = chars.sourceString;
    return { type: 'StringLiteral', value: raw.replaceAll(/\\(.)/g, '$1') };
  },

  boolean_true(_) {
    return { type: 'BooleanLiteral', value: true };
  },
  boolean_false(_) {
    return { type: 'BooleanLiteral', value: false };
  },

  null(_) {
    return { type: 'NullLiteral' };
  },

  identifier(_start, _rest) {
    return { type: 'Identifier', name: this.sourceString };
  },

  rootPath(_slash, _path) {
    return { type: 'RootPath', path: this.sourceString };
  },

  relativePath(_dotSlashes, _parts) {
    return { type: 'RelativePath', path: this.sourceString };
  },

  contextToken_at(_at, _path) {
    return { type: 'ContextToken', name: this.sourceString };
  },
  contextToken_hash(_hash, _path) {
    return { type: 'ContextToken', name: this.sourceString };
  },

  // @ts-expect-error - _iter returns array for iteration nodes
  _iter(...children) {
    return childrenToAST(children);
  },

  _terminal() {
    return { type: 'Identifier', name: this.sourceString };
  },
});

// ============ dependencies Operation ============
semantics.addOperation<string[]>('dependencies', {
  identifier(_start, _rest) {
    return [this.sourceString];
  },

  Primary_bracketedField(_lb, _str, _rb) {
    return [this.sourceString];
  },

  rootPath(_slash, _path) {
    return [this.sourceString];
  },

  relativePath(_dotSlashes, _parts) {
    return [this.sourceString];
  },

  contextToken_at(_at, _path) {
    return [];
  },
  contextToken_hash(_hash, _path) {
    return [];
  },

  Postfix_property(obj, _dot, prop) {
    const objDeps = obj.dependencies() as string[];
    if (objDeps.length === 1) {
      return [`${objDeps[0]}.${prop.sourceString}`];
    }
    return objDeps;
  },

  Postfix_index(obj, _lb, index, _rb) {
    const objDeps = obj.dependencies() as string[];
    const indexNode = index.toAST() as ASTNode;

    if (indexNode.type === 'StringLiteral') {
      const strValue = indexNode.value;
      const quote = this.sourceString.includes('"') ? '"' : "'";
      if (objDeps.length === 1) {
        return [`${objDeps[0]}[${quote}${strValue}${quote}]`];
      }
      return objDeps;
    }

    const getNumericIndex = (node: ASTNode): number | null => {
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
    };

    const numericIndex = getNumericIndex(indexNode);
    if (objDeps.length === 1 && numericIndex !== null) {
      return [`${objDeps[0]}[${numericIndex}]`];
    }
    return [...objDeps, ...(index.dependencies() as string[])];
  },

  Postfix_wildcard(obj, _lb, _star, _rb) {
    const objDeps = obj.dependencies() as string[];
    if (objDeps.length === 1) {
      return [`${objDeps[0]}[*]`];
    }
    return objDeps;
  },

  Postfix_call(callee, _lp, args, _rp) {
    const calleeDeps = callee.dependencies() as string[];
    const calleeAST = callee.toAST() as ASTNode;
    const argDeps = childrenDependencies(args.children);

    if (calleeAST.type === 'Identifier') {
      return argDeps;
    }
    return [...calleeDeps, ...argDeps];
  },

  number_float(_neg, _int, _dot, _frac) {
    return [];
  },
  number_int(_neg, _digits) {
    return [];
  },

  string(_open, _chars, _close) {
    return [];
  },

  boolean_true(_) {
    return [];
  },
  boolean_false(_) {
    return [];
  },

  null(_) {
    return [];
  },

  _nonterminal(...children) {
    return childrenDependencies(children);
  },

  _iter(...children) {
    return childrenDependencies(children);
  },

  _terminal() {
    return [];
  },
});

// ============ features Operation ============
const ARRAY_FUNCTIONS = new Set([
  'sum',
  'avg',
  'count',
  'first',
  'last',
  'join',
  'includes',
]);

semantics.addOperation<FormulaFeature[]>('features', {
  Primary_bracketedField(_lb, _str, _rb) {
    return ['bracket_notation'];
  },

  rootPath(_slash, _path) {
    const path = this.sourceString;
    const features: FormulaFeature[] = ['root_path'];
    if (path.includes('.')) {
      features.push('nested_path');
    }
    return features;
  },

  relativePath(_dotSlashes, _parts) {
    const path = this.sourceString;
    const features: FormulaFeature[] = ['relative_path'];
    const withoutPrefix = path.replace(/^(\.\.\/)+/, '');
    if (withoutPrefix.includes('.')) {
      features.push('nested_path');
    }
    return features;
  },

  contextToken_at(_at, _path) {
    return ['context_token'];
  },
  contextToken_hash(_hash, _path) {
    return ['context_token'];
  },

  Postfix_property(obj, _dot, _prop) {
    const objFeatures = obj.features() as FormulaFeature[];
    return [...objFeatures, 'nested_path'];
  },

  Postfix_index(obj, _lb, index, _rb) {
    const objFeatures = obj.features() as FormulaFeature[];
    const indexFeatures = index.features() as FormulaFeature[];
    const indexNode = index.toAST() as ASTNode;
    if (indexNode.type === 'StringLiteral') {
      return [...objFeatures, ...indexFeatures, 'bracket_notation'];
    }
    return [...objFeatures, ...indexFeatures, 'array_index'];
  },

  Postfix_wildcard(obj, _lb, _star, _rb) {
    const objFeatures = obj.features() as FormulaFeature[];
    return [...objFeatures, 'array_wildcard'];
  },

  Postfix_call(callee, _lp, args, _rp) {
    const calleeAST = callee.toAST() as ASTNode;
    const argFeatures = childrenFeatures(args.children);

    if (
      calleeAST.type === 'Identifier' &&
      ARRAY_FUNCTIONS.has(calleeAST.name.toLowerCase())
    ) {
      return [...argFeatures, 'array_function'];
    }
    return argFeatures;
  },

  _nonterminal(...children) {
    return childrenFeatures(children);
  },

  _iter(...children) {
    return childrenFeatures(children);
  },

  _terminal() {
    return [];
  },
});
