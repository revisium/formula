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
    return {
      type: 'IndexExpression',
      object: obj.toAST(),
      index: index.toAST(),
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

  contextToken_at(_at, _name) {
    return { type: 'ContextToken', name: this.sourceString };
  },
  contextToken_hash(_hash, _name) {
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

  rootPath(_slash, _path) {
    return [this.sourceString];
  },

  relativePath(_dotSlashes, _parts) {
    return [this.sourceString];
  },

  contextToken_at(_at, _name) {
    return [];
  },
  contextToken_hash(_hash, _name) {
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

  contextToken_at(_at, _name) {
    return ['context_token'];
  },
  contextToken_hash(_hash, _name) {
    return ['context_token'];
  },

  Postfix_property(obj, _dot, _prop) {
    const objFeatures = obj.features() as FormulaFeature[];
    return [...objFeatures, 'nested_path'];
  },

  Postfix_index(obj, _lb, index, _rb) {
    const objFeatures = obj.features() as FormulaFeature[];
    const indexFeatures = index.features() as FormulaFeature[];
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

// ============ eval Operation ============
const BUILTINS: Record<string, (...args: unknown[]) => unknown> = {
  // Logical
  and: (a, b) => Boolean(a) && Boolean(b),
  or: (a, b) => Boolean(a) || Boolean(b),
  not: (a) => !a,

  // String
  concat: (...args) => args.map(String).join(''),
  upper: (s) => String(s).toUpperCase(),
  lower: (s) => String(s).toLowerCase(),
  trim: (s) => String(s).trim(),
  left: (s, n) => String(s).slice(0, Math.max(0, Math.floor(Number(n)))),
  right: (s, n) => {
    const str = String(s);
    const count = Math.max(0, Math.floor(Number(n)));
    return count === 0 ? '' : str.slice(-count);
  },
  replace: (s, search, repl) => String(s).replace(String(search), String(repl)),
  tostring: String,
  length: (s) => {
    if (Array.isArray(s)) return s.length;
    if (typeof s === 'string') return s.length;
    if (s !== null && typeof s === 'object') return Object.keys(s).length;
    return String(s).length;
  },
  contains: (s, search) => String(s).includes(String(search)),
  startswith: (s, search) => String(s).startsWith(String(search)),
  endswith: (s, search) => String(s).endsWith(String(search)),
  join: (arr: unknown, sep: unknown) => {
    if (!Array.isArray(arr)) return '';
    if (sep === undefined || sep === null) return arr.join(',');
    return arr.join(String(sep));
  },

  // Numeric
  tonumber: Number,
  toboolean: Boolean,
  isnull: (v) => v === null || v === undefined,
  coalesce: (...args) =>
    args.find((v) => v !== null && v !== undefined) ?? null,
  round: (n, dec) => {
    const factor = 10 ** (dec === undefined ? 0 : Number(dec));
    return Math.round(Number(n) * factor) / factor;
  },
  floor: (n) => Math.floor(Number(n)),
  ceil: (n) => Math.ceil(Number(n)),
  abs: (n) => Math.abs(Number(n)),
  sqrt: (n) => Math.sqrt(Number(n)),
  pow: (base, exp) => Math.pow(Number(base), Number(exp)),
  min: (...args) =>
    args.length === 0 ? Number.NaN : Math.min(...args.map(Number)),
  max: (...args) =>
    args.length === 0 ? Number.NaN : Math.max(...args.map(Number)),
  log: (n) => Math.log(Number(n)),
  log10: (n) => Math.log10(Number(n)),
  exp: (n) => Math.exp(Number(n)),
  sign: (n) => Math.sign(Number(n)),

  // Array
  sum: (arr) =>
    Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b), 0) : 0,
  avg: (arr) =>
    Array.isArray(arr) && arr.length > 0
      ? arr.reduce((a, b) => a + Number(b), 0) / arr.length
      : 0,
  count: (arr) => (Array.isArray(arr) ? arr.length : 0),
  first: (arr) => (Array.isArray(arr) ? arr[0] : undefined),
  last: (arr) => (Array.isArray(arr) ? arr.at(-1) : undefined),
  includes: (arr, val) => (Array.isArray(arr) ? arr.includes(val) : false),

  // Conditional
  if: (cond, ifTrue, ifFalse) => (cond ? ifTrue : ifFalse),
};

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

semantics.addOperation<unknown>('eval(ctx)', {
  Expression(e) {
    return e.eval(this.args.ctx);
  },

  Ternary_ternary(cond, _q, cons, _c, alt) {
    return cond.eval(this.args.ctx)
      ? cons.eval(this.args.ctx)
      : alt.eval(this.args.ctx);
  },
  Ternary(e) {
    return e.eval(this.args.ctx);
  },

  LogicalOr_or(left, _op, right) {
    return left.eval(this.args.ctx) || right.eval(this.args.ctx);
  },
  LogicalOr(e) {
    return e.eval(this.args.ctx);
  },

  LogicalAnd_and(left, _op, right) {
    return left.eval(this.args.ctx) && right.eval(this.args.ctx);
  },
  LogicalAnd(e) {
    return e.eval(this.args.ctx);
  },

  Equality_eq(left, _op, right) {
    return left.eval(this.args.ctx) == right.eval(this.args.ctx);
  },
  Equality_neq(left, _op, right) {
    return left.eval(this.args.ctx) != right.eval(this.args.ctx);
  },
  Equality(e) {
    return e.eval(this.args.ctx);
  },

  Comparison_gte(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) >=
      (right.eval(this.args.ctx) as number)
    );
  },
  Comparison_lte(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) <=
      (right.eval(this.args.ctx) as number)
    );
  },
  Comparison_gt(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) >
      (right.eval(this.args.ctx) as number)
    );
  },
  Comparison_lt(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) <
      (right.eval(this.args.ctx) as number)
    );
  },
  Comparison(e) {
    return e.eval(this.args.ctx);
  },

  Additive_plus(left, _op, right): unknown {
    const l = left.eval(this.args.ctx);
    const r = right.eval(this.args.ctx);
    if (typeof l === 'string' || typeof r === 'string') {
      return String(l) + String(r);
    }
    return (l as number) + (r as number);
  },
  Additive_minus(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) -
      (right.eval(this.args.ctx) as number)
    );
  },
  Additive(e) {
    return e.eval(this.args.ctx);
  },

  Multiplicative_times(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) *
      (right.eval(this.args.ctx) as number)
    );
  },
  Multiplicative_div(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) /
      (right.eval(this.args.ctx) as number)
    );
  },
  Multiplicative_mod(left, _op, right) {
    return (
      (left.eval(this.args.ctx) as number) %
      (right.eval(this.args.ctx) as number)
    );
  },
  Multiplicative(e) {
    return e.eval(this.args.ctx);
  },

  Unary_neg(_op, expr) {
    return -(expr.eval(this.args.ctx) as number);
  },
  Unary_not(_op, expr) {
    return !expr.eval(this.args.ctx);
  },
  Unary(e) {
    return e.eval(this.args.ctx);
  },

  Postfix_call(callee, _lp, args, _rp) {
    const calleeAST = callee.toAST() as ASTNode;

    const getArgValues = (): unknown[] => {
      const argsNode = args.children[0];
      if (!argsNode) {
        return [];
      }
      return argsNode.eval(this.args.ctx) as unknown[];
    };

    if (calleeAST.type === 'Identifier') {
      const fnName = calleeAST.name.toLowerCase();
      const builtinFn = BUILTINS[fnName];
      if (builtinFn) {
        return builtinFn(...getArgValues());
      }
    }

    const fn = callee.eval(this.args.ctx);
    if (typeof fn === 'function') {
      return fn(...getArgValues());
    }

    const calleeName =
      calleeAST.type === 'Identifier' ? calleeAST.name : 'expression';
    throw new Error(`'${calleeName}' is not a function`);
  },
  Postfix_property(obj, _dot, prop) {
    const objVal = obj.eval(this.args.ctx) as Record<string, unknown>;
    return objVal?.[prop.sourceString];
  },
  Postfix_index(obj, _lb, index, _rb) {
    const objVal = obj.eval(this.args.ctx) as unknown[];
    const idx = index.eval(this.args.ctx) as number;
    if (idx < 0) {
      return objVal?.[objVal.length + idx];
    }
    return objVal?.[idx];
  },
  Postfix_wildcard(obj, _lb, _star, _rb) {
    return obj.eval(this.args.ctx);
  },
  Postfix(e) {
    return e.eval(this.args.ctx);
  },

  Arguments(first, _comma, rest) {
    return [
      first.eval(this.args.ctx),
      ...rest.children.map((c) => c.eval(this.args.ctx)),
    ];
  },

  Primary_paren(_lp, expr, _rp) {
    return expr.eval(this.args.ctx);
  },
  Primary(e) {
    return e.eval(this.args.ctx);
  },

  number_float(_neg, _int, _dot, _frac) {
    return Number.parseFloat(this.sourceString);
  },
  number_int(_neg, _digits) {
    return Number.parseInt(this.sourceString, 10);
  },

  string(_open, chars, _close) {
    return chars.sourceString.replaceAll(/\\(.)/g, '$1');
  },

  boolean_true(_) {
    return true;
  },
  boolean_false(_) {
    return false;
  },

  null(_) {
    return null;
  },

  identifier(_start, _rest) {
    const name = this.sourceString;
    return this.args.ctx[name];
  },

  rootPath(_slash, _path) {
    const fullPath = this.sourceString;
    if (fullPath in this.args.ctx) {
      return this.args.ctx[fullPath];
    }
    const parts = fullPath.slice(1).split('.');
    const firstPart = parts[0];
    if (!firstPart) return undefined;
    const rootKey = '/' + firstPart;
    let value = this.args.ctx[rootKey];
    for (let i = 1; i < parts.length; i++) {
      if (value === null || value === undefined) return undefined;
      const part = parts[i];
      if (!part) continue;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  },

  relativePath(_dotSlashes, _parts) {
    const fullPath = this.sourceString;
    if (fullPath in this.args.ctx) {
      return this.args.ctx[fullPath];
    }
    const path = fullPath.replace(/^(\.\.\/)+/, '');
    return getByPath(this.args.ctx, path);
  },

  contextToken_at(_at, _name) {
    return this.args.ctx[this.sourceString];
  },
  contextToken_hash(_hash, _name) {
    return this.args.ctx[this.sourceString];
  },

  _nonterminal(...children) {
    const ctx = this.args.ctx;
    for (const child of children) {
      if ('eval' in child) {
        return child.eval(ctx);
      }
    }
    return undefined;
  },

  _iter(...children) {
    return children.map((c) => c.eval(this.args.ctx));
  },

  _terminal() {
    return undefined;
  },
});
