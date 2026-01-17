interface XFormulaInput {
  version: number;
  expression: string;
  onError?: 'null' | 'default' | 'throw';
}

interface SchemaProperty {
  type?: string;
  'x-formula'?: XFormulaInput;
  [key: string]: unknown;
}

export interface JsonSchema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
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
  const properties = schema.properties ?? {};

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const xFormula = fieldSchema['x-formula'];
    if (xFormula) {
      formulas.push({
        fieldName,
        expression: xFormula.expression,
        fieldType: fieldSchema.type ?? 'string',
      });
    }
  }

  return formulas;
}
