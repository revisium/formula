interface XFormulaInput {
  version: number;
  expression: string;
}

interface SchemaProperty {
  type?: string;
  'x-formula'?: XFormulaInput;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  [key: string]: unknown;
}

export interface JsonSchema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  [key: string]: unknown;
}

export interface ExtractedFormula {
  fieldName: string;
  expression: string;
  fieldType: string;
}

/**
 * Extract formula definitions from a JSON Schema
 *
 * @param schema - JSON Schema object with properties
 * @returns Array of extracted formulas with field names and expressions
 *
 * @example
 * extractSchemaFormulas({
 *   type: 'object',
 *   properties: {
 *     price: { type: 'number' },
 *     tax: { type: 'number', 'x-formula': { version: 1, expression: 'price * 0.1' } }
 *   }
 * });
 * // [{ fieldName: 'tax', expression: 'price * 0.1', fieldType: 'number' }]
 */
export function extractSchemaFormulas(schema: JsonSchema): ExtractedFormula[] {
  const formulas: ExtractedFormula[] = [];
  extractFormulasRecursive(schema, '', formulas);
  return formulas;
}

function extractFormulasRecursive(
  schema: SchemaProperty | JsonSchema,
  pathPrefix: string,
  formulas: ExtractedFormula[],
): void {
  if (schema.type === 'array' && schema.items) {
    extractFormulasRecursive(schema.items, `${pathPrefix}[]`, formulas);
    return;
  }

  const properties = schema.properties ?? {};

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const fullPath = pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName;

    const xFormula = fieldSchema['x-formula'];
    if (xFormula) {
      formulas.push({
        fieldName: fullPath,
        expression: xFormula.expression,
        fieldType: fieldSchema.type ?? 'string',
      });
    }

    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      extractFormulasRecursive(fieldSchema, fullPath, formulas);
    }

    if (fieldSchema.type === 'array' && fieldSchema.items) {
      extractFormulasRecursive(fieldSchema.items, `${fullPath}[]`, formulas);
    }
  }
}
