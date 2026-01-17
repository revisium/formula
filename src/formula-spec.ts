export interface FormulaSpec {
  version: string;
  description: string;
  syntax: {
    fieldReferences: string[];
    arithmeticOperators: { operator: string; description: string }[];
    comparisonOperators: { operator: string; description: string }[];
    logicalOperators: { operator: string; description: string }[];
    other: string[];
  };
  features: {
    name: string;
    description: string;
    minVersion: string;
    examples: string[];
    dependenciesExtracted?: string[];
  }[];
  versionDetection: { feature: string; minVersion: string }[];
  parseResult: {
    description: string;
    interface: string;
  };
  examples: {
    expression: string;
    description: string;
    result?: string;
  }[];
  apiExamples: {
    name: string;
    description: string;
    code: string;
  }[];
  schemaUsage: {
    structure: string;
    fieldTypes: string[];
    rules: string[];
  };
}

export const formulaSpec: FormulaSpec = {
  version: '1.1',
  description:
    'Formula expressions for computed fields. Formulas reference other fields and calculate values automatically.',

  syntax: {
    fieldReferences: [
      'Simple field: fieldName (e.g., price, quantity)',
      'Nested path: object.property (e.g., stats.damage)',
      'Array index: array[0] or array[-1] for last element',
      'Combined: items[0].price, user.addresses[-1].city',
    ],
    arithmeticOperators: [
      { operator: '+', description: 'Addition or string concatenation' },
      { operator: '-', description: 'Subtraction' },
      { operator: '*', description: 'Multiplication' },
      { operator: '/', description: 'Division' },
      { operator: '%', description: 'Modulo (remainder)' },
    ],
    comparisonOperators: [
      { operator: '==', description: 'Equal' },
      { operator: '!=', description: 'Not equal' },
      { operator: '>', description: 'Greater than' },
      { operator: '<', description: 'Less than' },
      { operator: '>=', description: 'Greater or equal' },
      { operator: '<=', description: 'Less or equal' },
    ],
    logicalOperators: [
      { operator: '&&', description: 'Logical AND' },
      { operator: '||', description: 'Logical OR' },
      { operator: '!', description: 'Logical NOT' },
    ],
    other: [
      'Parentheses: (a + b) * c',
      'Ternary: condition ? valueIfTrue : valueIfFalse',
      'Unary minus: -value, a + -b',
    ],
  },

  features: [
    {
      name: 'simple_refs',
      description: 'Reference top-level fields by name',
      minVersion: '1.0',
      examples: ['price', 'quantity', 'baseDamage'],
      dependenciesExtracted: ['["price"]', '["quantity"]', '["baseDamage"]'],
    },
    {
      name: 'arithmetic',
      description: 'Basic math operations (+, -, *, /)',
      minVersion: '1.0',
      examples: ['price * 1.1', 'a + b - c', 'quantity * price'],
    },
    {
      name: 'comparison',
      description: 'Compare values (>, <, >=, <=, ==, !=)',
      minVersion: '1.0',
      examples: ['price > 100', 'x == 10', 'quantity >= 5'],
    },
    {
      name: 'nested_path',
      description: 'Access nested object properties using dot notation',
      minVersion: '1.1',
      examples: ['stats.damage', 'user.profile.name', 'item.metadata.category'],
      dependenciesExtracted: ['["stats.damage"]'],
    },
    {
      name: 'array_index',
      description:
        'Access array elements by numeric index. Negative indices access from the end',
      minVersion: '1.1',
      examples: [
        'items[0].price',
        'inventory[1].quantity',
        'items[-1].name  // last element',
        'items[-2].price // second to last',
      ],
      dependenciesExtracted: ['["items[0].price"]', '["items[-1].name"]'],
    },
  ],

  versionDetection: [
    { feature: 'Simple refs, arithmetic, comparisons', minVersion: '1.0' },
    { feature: 'Nested paths (a.b)', minVersion: '1.1' },
    { feature: 'Array index ([0], [-1])', minVersion: '1.1' },
  ],

  parseResult: {
    description:
      'The parser automatically detects the minimum required version',
    interface: `interface ParseResult {
  ast: ASTNode;           // Abstract syntax tree
  dependencies: string[]; // List of field dependencies
  features: string[];     // List of detected features
  minVersion: string;     // Minimum required version ("1.0" or "1.1")
}`,
  },

  examples: [
    {
      expression: 'price * quantity',
      description: 'Calculate total from price and quantity',
      result: 'number',
    },
    {
      expression: 'firstName + " " + lastName',
      description: 'Concatenate strings with space',
      result: 'string',
    },
    {
      expression: 'quantity > 0',
      description: 'Check if in stock',
      result: 'boolean',
    },
    {
      expression: 'stock > 0 ? "Available" : "Out of Stock"',
      description: 'Conditional text based on stock',
      result: 'string',
    },
    {
      expression: 'price * (1 + taxRate)',
      description: 'Price with tax',
      result: 'number',
    },
    {
      expression: 'items[0].price + items[1].price',
      description: 'Sum first two item prices (v1.1)',
      result: 'number',
    },
  ],

  apiExamples: [
    {
      name: 'Simple Expression (v1.0)',
      description: 'Parse a basic arithmetic expression',
      code: `parseExpression('price * 1.1')
// {
//   minVersion: "1.0",
//   features: [],
//   dependencies: ["price"]
// }`,
    },
    {
      name: 'Nested Path (v1.1)',
      description: 'Parse expression with nested object access',
      code: `parseExpression('stats.damage * multiplier')
// {
//   minVersion: "1.1",
//   features: ["nested_path"],
//   dependencies: ["stats.damage", "multiplier"]
// }`,
    },
    {
      name: 'Array Access (v1.1)',
      description: 'Parse expression with array index access',
      code: `parseExpression('items[0].price + items[1].price')
// {
//   minVersion: "1.1",
//   features: ["array_index", "nested_path"],
//   dependencies: ["items[0].price", "items[1].price"]
// }`,
    },
    {
      name: 'Evaluate expressions',
      description: 'Execute formulas with context data',
      code: `evaluate('price * 1.1', { price: 100 })
// 110

evaluate('stats.damage', { stats: { damage: 50 } })
// 50

evaluate('items[0].price', { items: [{ price: 10 }] })
// 10

evaluate('price > 100', { price: 150 })
// true

evaluate('a + b * c', { a: 1, b: 2, c: 3 })
// 7`,
    },
  ],

  schemaUsage: {
    structure: '{ "x-formula": { "version": 1, "expression": "..." }, "readOnly": true }',
    fieldTypes: ['string', 'number', 'boolean'],
    rules: [
      'Add x-formula to string, number, or boolean field schema',
      'readOnly: true is REQUIRED for fields with x-formula',
      'Expression must reference existing fields in the same table',
      'Circular dependencies are not allowed (a references b, b references a)',
      'Referenced fields must exist before the formula field in schema order',
    ],
  },
};
