// Reference meaning of evaluation: the Ohm `eval(ctx)` operation (renamed
// `referenceEval`), its built-in functions and the evaluate/evaluateWithContext
// composition of @revisium/formula 0.10.0, copied verbatim so differential tests
// compare the AST evaluator against code that production changes cannot reach.
import { grammar } from '../../ohm/grammar';
import { semantics } from '../../ohm/semantics';
import {
  buildArrayContextTokens,
  buildPathReferences,
} from './reference-evaluation-context';
import type {
  EvaluateContextOptions,
  ParseResult,
} from '../../ohm/core/parser';
import type { ASTNode } from '../../ohm/core/types';
import type { FormulaFeature, FormulaMinorVersion } from '../../types';

const referenceSemantics = grammar.extendSemantics(semantics);

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
    if (typeof sep !== 'string' && typeof sep !== 'number') {
      return arr.join(',');
    }
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

export const REFERENCE_BUILTIN_NAMES = Object.keys(BUILTINS);

function isSafePropertyName(name: string): boolean {
  return name !== '__proto__';
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

referenceSemantics.addOperation<unknown>('referenceEval(ctx)', {
  Expression(e) {
    return e.referenceEval(this.args.ctx);
  },

  Ternary_ternary(cond, _q, cons, _c, alt) {
    return cond.referenceEval(this.args.ctx)
      ? cons.referenceEval(this.args.ctx)
      : alt.referenceEval(this.args.ctx);
  },
  Ternary(e) {
    return e.referenceEval(this.args.ctx);
  },

  LogicalOr_or(left, _op, right) {
    return (
      left.referenceEval(this.args.ctx) || right.referenceEval(this.args.ctx)
    );
  },
  LogicalOr(e) {
    return e.referenceEval(this.args.ctx);
  },

  LogicalAnd_and(left, _op, right) {
    return (
      left.referenceEval(this.args.ctx) && right.referenceEval(this.args.ctx)
    );
  },
  LogicalAnd(e) {
    return e.referenceEval(this.args.ctx);
  },

  Equality_eq(left, _op, right) {
    return (
      left.referenceEval(this.args.ctx) == right.referenceEval(this.args.ctx)
    );
  },
  Equality_neq(left, _op, right) {
    return (
      left.referenceEval(this.args.ctx) != right.referenceEval(this.args.ctx)
    );
  },
  Equality(e) {
    return e.referenceEval(this.args.ctx);
  },

  Comparison_gte(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) >=
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Comparison_lte(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) <=
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Comparison_gt(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) >
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Comparison_lt(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) <
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Comparison(e) {
    return e.referenceEval(this.args.ctx);
  },

  Additive_plus(left, _op, right): unknown {
    const l = left.referenceEval(this.args.ctx);
    const r = right.referenceEval(this.args.ctx);
    if (typeof l === 'string' || typeof r === 'string') {
      return String(l) + String(r);
    }
    return (l as number) + (r as number);
  },
  Additive_minus(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) -
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Additive(e) {
    return e.referenceEval(this.args.ctx);
  },

  Multiplicative_times(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) *
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Multiplicative_div(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) /
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Multiplicative_mod(left, _op, right) {
    return (
      (left.referenceEval(this.args.ctx) as number) %
      (right.referenceEval(this.args.ctx) as number)
    );
  },
  Multiplicative(e) {
    return e.referenceEval(this.args.ctx);
  },

  Unary_neg(_op, expr) {
    return -(expr.referenceEval(this.args.ctx) as number);
  },
  Unary_not(_op, expr) {
    return !expr.referenceEval(this.args.ctx);
  },
  Unary(e) {
    return e.referenceEval(this.args.ctx);
  },

  Postfix_call(callee, _lp, args, _rp) {
    const calleeAST = callee.toAST() as ASTNode;

    const getArgValues = (): unknown[] => {
      const argsNode = args.children[0];
      if (!argsNode) {
        return [];
      }
      return argsNode.referenceEval(this.args.ctx) as unknown[];
    };

    if (calleeAST.type === 'Identifier') {
      const fnName = calleeAST.name.toLowerCase();
      const builtinFn = BUILTINS[fnName];
      if (builtinFn) {
        return builtinFn(...getArgValues());
      }
    }

    const fn = callee.referenceEval(this.args.ctx);
    if (typeof fn === 'function') {
      return fn(...getArgValues());
    }

    const calleeName =
      calleeAST.type === 'Identifier' ? calleeAST.name : 'expression';
    throw new Error(`'${calleeName}' is not a function`);
  },
  Postfix_property(obj, _dot, prop) {
    const objVal = obj.referenceEval(this.args.ctx);
    const propName = prop.sourceString;
    if (Array.isArray(objVal)) {
      return objVal.map(
        (item) => (item as Record<string, unknown>)?.[propName],
      );
    }
    return (objVal as Record<string, unknown>)?.[propName];
  },
  Postfix_index(obj, _lb, index, _rb) {
    const objVal = obj.referenceEval(this.args.ctx);
    const idx = index.referenceEval(this.args.ctx);
    if (typeof idx === 'string') {
      if (!isSafePropertyName(idx)) {
        return undefined;
      }
      return (objVal as Record<string, unknown>)?.[idx];
    }
    const numIdx = idx as number;
    if (numIdx < 0) {
      return (objVal as unknown[])?.[(objVal as unknown[]).length + numIdx];
    }
    return (objVal as unknown[])?.[numIdx];
  },
  Postfix_wildcard(obj, _lb, _star, _rb) {
    const objVal = obj.referenceEval(this.args.ctx);
    if (
      Array.isArray(objVal) &&
      objVal.length > 0 &&
      Array.isArray(objVal[0])
    ) {
      return objVal.flat();
    }
    return objVal;
  },
  Postfix(e) {
    return e.referenceEval(this.args.ctx);
  },

  Arguments(first, _comma, rest) {
    return [
      first.referenceEval(this.args.ctx),
      ...rest.children.map((c) => c.referenceEval(this.args.ctx)),
    ];
  },

  Primary_paren(_lp, expr, _rp) {
    return expr.referenceEval(this.args.ctx);
  },
  Primary_bracketedField(_lb, str, _rb) {
    const fieldName = str.referenceEval(this.args.ctx) as string;
    if (!isSafePropertyName(fieldName)) {
      return undefined;
    }
    return this.args.ctx[fieldName];
  },
  Primary(e) {
    return e.referenceEval(this.args.ctx);
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

  contextToken_at(_at, _path) {
    return this.args.ctx[this.sourceString];
  },
  contextToken_hash(_hash, _path) {
    return this.args.ctx[this.sourceString];
  },

  _nonterminal(...children) {
    const ctx = this.args.ctx;
    for (const child of children) {
      if ('referenceEval' in child) {
        return child.referenceEval(ctx);
      }
    }
    return undefined;
  },

  _iter(...children) {
    return children.map((c) => c.referenceEval(this.args.ctx));
  },

  _terminal() {
    return undefined;
  },
});

export function referenceEvaluate(
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

  return referenceSemantics(matchResult).referenceEval(safeContext);
}

function referenceDependencies(trimmed: string): string[] {
  const matchResult = grammar.match(trimmed);
  if (matchResult.failed()) {
    throw new Error(matchResult.message ?? 'Parse error');
  }
  return [
    ...new Set(referenceSemantics(matchResult).dependencies() as string[]),
  ];
}

export function referenceEvaluateWithContext(
  expression: string,
  options: EvaluateContextOptions,
): unknown {
  const { rootData, itemData, currentPath, arrayContext } = options;
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const dependencies = referenceDependencies(trimmed);
  const pathRefs = buildPathReferences(rootData, dependencies, currentPath);
  const arrayTokens = buildArrayContextTokens(arrayContext);

  const context: Record<string, unknown> = {
    ...rootData,
    ...itemData,
    ...pathRefs,
    ...arrayTokens,
  };

  return referenceEvaluate(trimmed, context);
}

function detectMinVersion(features: FormulaFeature[]): FormulaMinorVersion {
  if (features.includes('context_token')) {
    return '1.2';
  }
  if (features.length > 0) {
    return '1.1';
  }
  return '1.0';
}

export function referenceParseFormula(expression: string): ParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Empty expression');
  }

  const matchResult = grammar.match(trimmed);
  if (matchResult.failed()) {
    throw new Error(matchResult.message ?? 'Parse error');
  }

  const adapter = referenceSemantics(matchResult);
  const ast = adapter.toAST() as ASTNode;
  const dependencies = [...new Set(adapter.dependencies() as string[])];
  const allFeatures = adapter.features() as FormulaFeature[];
  const features = [...new Set(allFeatures)];
  const minVersion: FormulaMinorVersion = detectMinVersion(features);

  return { ast, dependencies, features, minVersion };
}
