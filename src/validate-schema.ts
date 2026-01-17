import { parseExpression } from './parse-formula';
import { validateFormulaSyntax } from './validate-syntax';
import { extractSchemaFormulas, JsonSchema } from './extract-schema';
import {
  buildDependencyGraph,
  detectCircularDependencies,
} from './dependency-graph';
import { inferFormulaType, FieldTypes, InferredType } from './parser';

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

function getSchemaFieldTypes(schema: JsonSchema): FieldTypes {
  const fieldTypes: FieldTypes = {};
  const properties = schema.properties ?? {};

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const schemaType = fieldSchema.type;
    if (
      schemaType === 'number' ||
      schemaType === 'string' ||
      schemaType === 'boolean' ||
      schemaType === 'object' ||
      schemaType === 'array'
    ) {
      fieldTypes[fieldName] = schemaType;
    }
  }

  return fieldTypes;
}

function schemaTypeToInferred(
  schemaType: string | undefined,
): InferredType | null {
  if (schemaType === 'number') return 'number';
  if (schemaType === 'string') return 'string';
  if (schemaType === 'boolean') return 'boolean';
  return null;
}

function isTypeCompatible(
  inferredType: InferredType,
  expectedType: InferredType | null,
): boolean {
  if (expectedType === null) return true;
  if (inferredType === 'unknown') return true;
  return inferredType === expectedType;
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

  const fieldSchema = schema.properties?.[fieldName];
  const expectedType = schemaTypeToInferred(fieldSchema?.type);
  const fieldTypes = getSchemaFieldTypes(schema);
  const inferredType = inferFormulaType(expression, fieldTypes);

  if (!isTypeCompatible(inferredType, expectedType)) {
    return {
      field: fieldName,
      error: `Type mismatch: formula returns '${inferredType}' but field expects '${expectedType}'`,
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

  const cycle = circularCheck.cycle;
  if (circularCheck.hasCircular && cycle && cycle.length > 0) {
    const firstField = cycle[0];
    if (firstField) {
      errors.push({
        field: firstField,
        error: `Circular dependency: ${cycle.join(' → ')}`,
      });
      return { isValid: false, errors };
    }
  }

  return { isValid: true, errors: [] };
}
