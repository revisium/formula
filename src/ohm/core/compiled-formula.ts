import { grammar } from '../grammar';
import { semantics } from '../semantics';
import { BoundedMemo } from './bounded-memo';
import { compileEvaluator, type FormulaEvaluator } from './formula-evaluator';
import type { ASTNode } from './types';
import type { FormulaFeature, FormulaMinorVersion } from '../../types';

export interface CompiledFormula {
  readonly ast: ASTNode;
  readonly dependencies: readonly string[];
  readonly features: readonly FormulaFeature[];
  readonly minVersion: FormulaMinorVersion;
  readonly evaluate: FormulaEvaluator;
}

interface FormulaSemanticsAdapter {
  toAST(): ASTNode;
  dependencies(): string[];
  features(): FormulaFeature[];
}

type Compilation =
  | { readonly formula: CompiledFormula }
  | { readonly parseError: string };

const COMPILED_FORMULA_CAPACITY = 1000;

const compiledFormulas = new BoundedMemo<string, Compilation>(
  COMPILED_FORMULA_CAPACITY,
  compileFormula,
);

export function getCompiledFormula(trimmedExpression: string): CompiledFormula {
  const compilation = compiledFormulas.get(trimmedExpression);
  if ('parseError' in compilation) {
    throw new Error(compilation.parseError);
  }
  return compilation.formula;
}

function compileFormula(trimmedExpression: string): Compilation {
  const matchResult = grammar.match(trimmedExpression);
  if (matchResult.failed()) {
    return { parseError: matchResult.message ?? 'Parse error' };
  }

  const adapter = semantics(matchResult) as FormulaSemanticsAdapter;
  const ast = adapter.toAST();
  const dependencies = [...new Set(adapter.dependencies())];
  const features = [...new Set(adapter.features())];

  const formula: CompiledFormula = {
    ast,
    dependencies,
    features,
    minVersion: detectMinVersion(features),
    evaluate: compileEvaluator(ast),
  };
  deepFreeze(formula);

  return { formula };
}

function deepFreeze(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    return;
  }
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  Object.freeze(value);
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
