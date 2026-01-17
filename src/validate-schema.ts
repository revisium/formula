import { parseExpression } from './parse-formula';
import { validateFormulaSyntax } from './validate-syntax';
import { extractSchemaFormulas, JsonSchema } from './extract-schema';
import {
  buildDependencyGraph,
  detectCircularDependencies,
} from './dependency-graph';

export interface FormulaValidationError {
  field: string;
  error: string;
  position?: number;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: FormulaValidationError[];
}

function getSchemaFields(schema: JsonSchema): Set<string> {
  const fields = new Set<string>();
  const properties = schema.properties ?? {};

  for (const fieldName of Object.keys(properties)) {
    fields.add(fieldName);
  }

  return fields;
}

function extractFieldRoot(dependency: string): string {
  const root = dependency.split('.')[0]?.split('[')[0];
  return root || dependency;
}

export function validateFormulaAgainstSchema(
  expression: string,
  fieldName: string,
  schema: JsonSchema,
): FormulaValidationError | null {
  const syntaxResult = validateFormulaSyntax(expression);
  if (!syntaxResult.isValid) {
    return {
      field: fieldName,
      error: syntaxResult.error,
      position: syntaxResult.position,
    };
  }

  const parseResult = parseExpression(expression);
  const schemaFields = getSchemaFields(schema);

  for (const dep of parseResult.dependencies) {
    const rootField = extractFieldRoot(dep);
    if (!schemaFields.has(rootField)) {
      return {
        field: fieldName,
        error: `Unknown field '${rootField}' in formula`,
      };
    }
  }

  if (parseResult.dependencies.some((d) => extractFieldRoot(d) === fieldName)) {
    return {
      field: fieldName,
      error: `Formula cannot reference itself`,
    };
  }

  return null;
}

export function validateSchemaFormulas(
  schema: JsonSchema,
): SchemaValidationResult {
  const errors: FormulaValidationError[] = [];
  const formulas = extractSchemaFormulas(schema);

  for (const formula of formulas) {
    const error = validateFormulaAgainstSchema(
      formula.expression,
      formula.fieldName,
      schema,
    );
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const dependencies: Record<string, string[]> = {};
  for (const formula of formulas) {
    const parseResult = parseExpression(formula.expression);
    dependencies[formula.fieldName] =
      parseResult.dependencies.map(extractFieldRoot);
  }

  const graph = buildDependencyGraph(dependencies);
  const circularCheck = detectCircularDependencies(graph);

  if (
    circularCheck.hasCircular &&
    circularCheck.cycle &&
    circularCheck.cycle.length > 0
  ) {
    errors.push({
      field: circularCheck.cycle[0],
      error: `Circular dependency: ${circularCheck.cycle.join(' → ')}`,
    });
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}
