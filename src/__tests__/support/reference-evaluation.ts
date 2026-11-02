// Reference meaning of evaluation: the Ohm `eval(ctx)` operation and the
// evaluate/evaluateWithContext composition of @revisium/formula 0.10.0, kept
// verbatim so differential tests can compare the AST evaluator against it.
import { grammar } from '../../ohm/grammar';
import { semantics } from '../../ohm/semantics';
import { BUILTIN_FUNCTIONS } from '../../ohm/core/builtin-functions';
import {
  buildArrayContextTokens,
  buildPathReferences,
} from '../../ohm/core/evaluation-context';
import type { EvaluateContextOptions } from '../../ohm/core/parser';
import type { ASTNode } from '../../ohm/core/types';

const referenceSemantics = grammar.extendSemantics(semantics);

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
      const builtinFn = BUILTIN_FUNCTIONS[fnName];
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
