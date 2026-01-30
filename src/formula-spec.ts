export interface FunctionSpec {
  name: string;
  description: string;
  signature: string;
  returnType: 'string' | 'number' | 'boolean' | 'any';
  examples: string[];
}

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
  functions: {
    string: FunctionSpec[];
    numeric: FunctionSpec[];
    boolean: FunctionSpec[];
    array: FunctionSpec[];
    conversion: FunctionSpec[];
    conditional: FunctionSpec[];
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
  astUtilities: {
    name: string;
    description: string;
    signature: string;
    code: string;
  }[];
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
  version: '1.2',
  description:
    'Formula expressions for computed fields. Formulas reference other fields and calculate values automatically.',

  syntax: {
    fieldReferences: [
      'Simple field: fieldName (e.g., price, quantity)',
      'Nested path: object.property (e.g., stats.damage)',
      'Array index: array[0] or array[-1] for last element',
      'Bracket notation: ["field-name"] for field names containing hyphens',
      '  - Required when field name contains hyphen (-)',
      '  - Without brackets: field-name is parsed as "field minus name"',
      '  - With brackets: ["field-name"] references the field correctly',
      'Combined: items[0].price, user.addresses[-1].city, obj["field-name"].value',
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
    other: ['Parentheses: (a + b) * c', 'Unary minus: -value, a + -b'],
  },

  functions: {
    string: [
      {
        name: 'concat',
        description: 'Concatenate multiple values into a single string',
        signature: 'concat(value1, value2, ...)',
        returnType: 'string',
        examples: [
          'concat(firstName, " ", lastName) // "John Doe"',
          'concat("Price: ", price, " USD") // "Price: 100 USD"',
        ],
      },
      {
        name: 'upper',
        description: 'Convert string to uppercase',
        signature: 'upper(text)',
        returnType: 'string',
        examples: ['upper(name) // "HELLO"'],
      },
      {
        name: 'lower',
        description: 'Convert string to lowercase',
        signature: 'lower(text)',
        returnType: 'string',
        examples: ['lower(name) // "hello"'],
      },
      {
        name: 'trim',
        description: 'Remove whitespace from both ends of a string',
        signature: 'trim(text)',
        returnType: 'string',
        examples: ['trim(name) // "hello" from "  hello  "'],
      },
      {
        name: 'left',
        description: 'Extract characters from the beginning of a string',
        signature: 'left(text, count)',
        returnType: 'string',
        examples: ['left(name, 3) // "hel" from "hello"'],
      },
      {
        name: 'right',
        description: 'Extract characters from the end of a string',
        signature: 'right(text, count)',
        returnType: 'string',
        examples: ['right(name, 3) // "llo" from "hello"'],
      },
      {
        name: 'replace',
        description: 'Replace first occurrence of a substring',
        signature: 'replace(text, search, replacement)',
        returnType: 'string',
        examples: ['replace(name, "o", "0") // "hell0" from "hello"'],
      },
      {
        name: 'join',
        description: 'Join array elements into a string',
        signature: 'join(array, separator?)',
        returnType: 'string',
        examples: ['join(tags) // "a,b,c"', 'join(tags, " | ") // "a | b | c"'],
      },
    ],
    numeric: [
      {
        name: 'round',
        description: 'Round a number to specified decimal places',
        signature: 'round(number, decimals?)',
        returnType: 'number',
        examples: ['round(3.14159, 2) // 3.14', 'round(3.5) // 4'],
      },
      {
        name: 'floor',
        description: 'Round down to the nearest integer',
        signature: 'floor(number)',
        returnType: 'number',
        examples: ['floor(3.7) // 3'],
      },
      {
        name: 'ceil',
        description: 'Round up to the nearest integer',
        signature: 'ceil(number)',
        returnType: 'number',
        examples: ['ceil(3.2) // 4'],
      },
      {
        name: 'abs',
        description: 'Get the absolute value',
        signature: 'abs(number)',
        returnType: 'number',
        examples: ['abs(-5) // 5'],
      },
      {
        name: 'sqrt',
        description: 'Calculate the square root',
        signature: 'sqrt(number)',
        returnType: 'number',
        examples: ['sqrt(16) // 4'],
      },
      {
        name: 'pow',
        description: 'Raise a number to a power',
        signature: 'pow(base, exponent)',
        returnType: 'number',
        examples: ['pow(2, 3) // 8'],
      },
      {
        name: 'min',
        description: 'Get the minimum of multiple values',
        signature: 'min(value1, value2, ...)',
        returnType: 'number',
        examples: ['min(a, b, c) // smallest value'],
      },
      {
        name: 'max',
        description: 'Get the maximum of multiple values',
        signature: 'max(value1, value2, ...)',
        returnType: 'number',
        examples: ['max(a, b, c) // largest value'],
      },
      {
        name: 'log',
        description: 'Calculate the natural logarithm',
        signature: 'log(number)',
        returnType: 'number',
        examples: ['log(10) // 2.302...'],
      },
      {
        name: 'log10',
        description: 'Calculate the base-10 logarithm',
        signature: 'log10(number)',
        returnType: 'number',
        examples: ['log10(100) // 2'],
      },
      {
        name: 'exp',
        description: 'Calculate e raised to a power',
        signature: 'exp(number)',
        returnType: 'number',
        examples: ['exp(1) // 2.718...'],
      },
      {
        name: 'sign',
        description: 'Get the sign of a number (-1, 0, or 1)',
        signature: 'sign(number)',
        returnType: 'number',
        examples: ['sign(-5) // -1', 'sign(0) // 0', 'sign(5) // 1'],
      },
      {
        name: 'length',
        description: 'Get the length of a string or array',
        signature: 'length(value)',
        returnType: 'number',
        examples: ['length(name) // 5 from "hello"', 'length(items) // 3'],
      },
    ],
    boolean: [
      {
        name: 'and',
        description: 'Logical AND of two values',
        signature: 'and(a, b)',
        returnType: 'boolean',
        examples: ['and(isActive, hasPermission) // true if both true'],
      },
      {
        name: 'or',
        description: 'Logical OR of two values',
        signature: 'or(a, b)',
        returnType: 'boolean',
        examples: ['or(isAdmin, isOwner) // true if either true'],
      },
      {
        name: 'not',
        description: 'Logical NOT of a value',
        signature: 'not(value)',
        returnType: 'boolean',
        examples: ['not(isDeleted) // true if false'],
      },
      {
        name: 'contains',
        description: 'Check if a string contains a substring',
        signature: 'contains(text, search)',
        returnType: 'boolean',
        examples: ['contains(name, "ell") // true for "hello"'],
      },
      {
        name: 'startswith',
        description: 'Check if a string starts with a prefix',
        signature: 'startswith(text, prefix)',
        returnType: 'boolean',
        examples: ['startswith(name, "hel") // true for "hello"'],
      },
      {
        name: 'endswith',
        description: 'Check if a string ends with a suffix',
        signature: 'endswith(text, suffix)',
        returnType: 'boolean',
        examples: ['endswith(name, "llo") // true for "hello"'],
      },
      {
        name: 'isnull',
        description: 'Check if a value is null or undefined',
        signature: 'isnull(value)',
        returnType: 'boolean',
        examples: ['isnull(optionalField) // true if null/undefined'],
      },
      {
        name: 'includes',
        description: 'Check if an array contains a value',
        signature: 'includes(array, value)',
        returnType: 'boolean',
        examples: [
          'includes(tags, "featured") // true if array contains value',
        ],
      },
    ],
    array: [
      {
        name: 'sum',
        description:
          'Calculate the sum of array elements. Supports wildcard property access to sum nested values.',
        signature: 'sum(array)',
        returnType: 'number',
        examples: [
          'sum(prices) // total of all prices',
          'sum(items[*].price) // sum prices from array of objects',
          'sum(orders[*].items[*].amount) // sum nested arrays',
        ],
      },
      {
        name: 'avg',
        description:
          'Calculate the average of array elements. Supports wildcard property access.',
        signature: 'avg(array)',
        returnType: 'number',
        examples: [
          'avg(scores) // average score',
          'avg(items[*].rating) // average rating from array of objects',
        ],
      },
      {
        name: 'count',
        description: 'Get the number of elements in an array',
        signature: 'count(array)',
        returnType: 'number',
        examples: ['count(items) // number of items'],
      },
      {
        name: 'first',
        description: 'Get the first element of an array',
        signature: 'first(array)',
        returnType: 'any',
        examples: ['first(items) // first item'],
      },
      {
        name: 'last',
        description: 'Get the last element of an array',
        signature: 'last(array)',
        returnType: 'any',
        examples: ['last(items) // last item'],
      },
    ],
    conversion: [
      {
        name: 'tostring',
        description: 'Convert a value to string',
        signature: 'tostring(value)',
        returnType: 'string',
        examples: ['tostring(42) // "42"'],
      },
      {
        name: 'tonumber',
        description: 'Convert a value to number',
        signature: 'tonumber(value)',
        returnType: 'number',
        examples: ['tonumber("42") // 42'],
      },
      {
        name: 'toboolean',
        description: 'Convert a value to boolean',
        signature: 'toboolean(value)',
        returnType: 'boolean',
        examples: ['toboolean(1) // true', 'toboolean(0) // false'],
      },
    ],
    conditional: [
      {
        name: 'if',
        description: 'Return one of two values based on a condition',
        signature: 'if(condition, valueIfTrue, valueIfFalse)',
        returnType: 'any',
        examples: [
          'if(stock > 0, "Available", "Out of Stock")',
          'if(price > 100, price * 0.9, price)',
        ],
      },
      {
        name: 'coalesce',
        description: 'Return the first non-null value',
        signature: 'coalesce(value1, value2, ...)',
        returnType: 'any',
        examples: ['coalesce(nickname, name, "Anonymous")'],
      },
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
    {
      name: 'array_wildcard_property',
      description:
        'Access properties across all array elements using [*] wildcard. Property access after wildcard maps over all elements. Multiple wildcards flatten nested arrays.',
      minVersion: '1.1',
      examples: [
        'items[*].price                    // [10, 20, 30] - map property',
        'sum(items[*].price)               // 60 - sum mapped values',
        'avg(items[*].rating)              // average of all ratings',
        'values[*].nested.value            // deeply nested property access',
        'orders[*].items                   // [[1,2], [3,4]] - array of arrays',
        'orders[*].items[*]                // [1,2,3,4] - flattened',
        'sum(orders[*].items[*].amount)    // sum all nested amounts',
      ],
      dependenciesExtracted: [
        '["items[*].price"]',
        '["orders[*].items[*].amount"]',
      ],
    },
    {
      name: 'root_path',
      description:
        'Absolute path reference starting with /. Always resolves from root data, even inside array item formulas',
      minVersion: '1.1',
      examples: [
        '/taxRate',
        '/config.tax',
        'price * (1 + /taxRate)',
        'price * /config.multiplier',
      ],
      dependenciesExtracted: ['["/taxRate"]', '["/config.tax"]'],
    },
    {
      name: 'relative_path',
      description:
        'Relative path reference starting with ../. Each ../ goes up one level in the path hierarchy. Works with nested objects, arrays, and combinations. Supports accessing nested properties after the relative prefix (e.g., ../config.value)',
      minVersion: '1.1',
      examples: [
        '../discount',
        '../../rootRate',
        '../config.multiplier',
        'price * (1 - ../discount)',
        'price * ../../globalRate',
        'price * ../settings.tax.rate',
      ],
      dependenciesExtracted: [
        '["../discount"]',
        '["../../rootRate"]',
        '["../config.multiplier"]',
      ],
    },
    {
      name: 'function_named_fields',
      description:
        'Fields can have the same name as built-in functions (max, min, sum, etc.). Built-in functions are always checked first when a function call is made',
      minVersion: '1.0',
      examples: [
        'max(max, 0)',
        'min(min, 100)',
        'max(max - field.min, 0)',
        'round(round * 2)',
      ],
    },
    {
      name: 'bracket_notation',
      description:
        'Access fields containing hyphens using bracket notation with quotes. Required because "field-name" would be parsed as "field minus name" (subtraction). Works like JavaScript object["key"] syntax.',
      minVersion: '1.1',
      examples: [
        '["field-name"]          // Without brackets: field - name (subtraction!)',
        "['field-name']          // Single quotes also work",
        '["field-one"]["field-two"]',
        'obj["field-name"].value',
        '["items-list"][0]["val"]',
        '["price-new"] * 2',
      ],
      dependenciesExtracted: ['["field-name"]', "['field-name']"],
    },
    {
      name: 'context_token',
      description:
        'Array context tokens provide information about current position and neighboring elements when evaluating formulas inside arrays. # prefix for scalar metadata (number/boolean), @ prefix for object references.',
      minVersion: '1.2',
      examples: [
        '#index                  // Current array index (0-based)',
        '#length                 // Array length',
        '#first                  // true if first element',
        '#last                   // true if last element',
        '@prev                   // Previous element (null if first)',
        '@next                   // Next element (null if last)',
        '#parent.index           // Index in parent array (nested arrays)',
        '#parent.length          // Length of parent array',
        '#root.index             // Index in topmost array',
        '@root.prev              // Previous element in topmost array',
        'if(#first, value, @prev.total + value)  // Running total',
        'concat(#parent.index + 1, ".", #index + 1)  // "1.1", "1.2" numbering',
      ],
    },
  ],

  versionDetection: [
    { feature: 'Simple refs, arithmetic, comparisons', minVersion: '1.0' },
    { feature: 'Function-named fields (max(max, 0))', minVersion: '1.0' },
    { feature: 'Nested paths (a.b)', minVersion: '1.1' },
    { feature: 'Array index ([0], [-1])', minVersion: '1.1' },
    { feature: 'Absolute paths (/field)', minVersion: '1.1' },
    { feature: 'Relative paths (../field)', minVersion: '1.1' },
    { feature: 'Bracket notation (["field-name"])', minVersion: '1.1' },
    { feature: 'Context tokens (#index, @prev)', minVersion: '1.2' },
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

  astUtilities: [
    {
      name: 'serializeAst',
      description:
        'Convert an AST back to a formula string. Useful for debugging or displaying parsed formulas.',
      signature: 'serializeAst(ast: ASTNode): string',
      code: `import { parseFormula, serializeAst } from '@revisium/formula';

const { ast } = parseFormula('price * (1 + taxRate)');
serializeAst(ast)
// "price * (1 + taxRate)"

// After modifying AST nodes, serialize back to string
const { ast: ast2 } = parseFormula('a + b');
serializeAst(ast2)
// "a + b"`,
    },
    {
      name: 'replaceDependencies',
      description:
        'Replace field references in an AST with new names. Useful for renaming fields or migrating formulas.',
      signature:
        'replaceDependencies(ast: ASTNode, replacements: Record<string, string>): ASTNode',
      code: `import { parseFormula, replaceDependencies, serializeAst } from '@revisium/formula';

// Rename a field in a formula
const { ast } = parseFormula('oldPrice * quantity');
const newAst = replaceDependencies(ast, { oldPrice: 'price' });
serializeAst(newAst)
// "price * quantity"

// Rename multiple fields
const { ast: ast2 } = parseFormula('a + b * c');
const newAst2 = replaceDependencies(ast2, { a: 'x', b: 'y', c: 'z' });
serializeAst(newAst2)
// "x + y * z"

// Works with nested paths
const { ast: ast3 } = parseFormula('stats.damage * multiplier');
const newAst3 = replaceDependencies(ast3, { 'stats.damage': 'stats.power' });
serializeAst(newAst3)
// "stats.power * multiplier"`,
    },
  ],

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
      expression: 'if(stock > 0, "Available", "Out of Stock")',
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
    {
      name: 'Function-named fields',
      description: 'Fields can have the same name as built-in functions',
      code: `// Built-in functions take precedence in function calls
evaluate('max(max, 0)', { max: 10 })
// 10 (max() function, then max field)

evaluate('max(max - field.min, 0)', { max: 100, field: { min: 20 } })
// 80

evaluate('round(round * 2)', { round: 3.7 })
// 7

// Field named "sum" doesn't conflict with sum() function
evaluate('sum(values) + sum', { values: [1, 2, 3], sum: 10 })
// 16`,
    },
    {
      name: 'Evaluate with context (array items)',
      description:
        'Use evaluateWithContext() for array item formulas with path resolution',
      code: `// Absolute path: /field always resolves from root
evaluateWithContext('price * (1 + /taxRate)', {
  rootData: { taxRate: 0.1, items: [{ price: 100 }] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
})
// 110

// Nested absolute path
evaluateWithContext('price * /config.multiplier', {
  rootData: { config: { multiplier: 1.5 }, items: [] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
})
// 150

// Relative path: ../field resolves from parent (root)
evaluateWithContext('price * (1 - ../discount)', {
  rootData: { discount: 0.2, items: [] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
})
// 80

// itemData takes precedence over rootData for same field
evaluateWithContext('value + 10', {
  rootData: { value: 100 },
  itemData: { value: 50 },
  currentPath: 'items[0]'
})
// 60`,
    },
    {
      name: 'Relative paths - path resolution',
      description:
        'Understanding how ../ resolves based on currentPath. Each ../ goes up one segment (object property or array element counts as one segment)',
      code: `// Path structure explanation:
// currentPath splits by "." (dots), keeping array indices attached to field names
// "items[0]" = 1 segment
// "items[0].inner" = 2 segments: ["items[0]", "inner"]
// "container.items[0]" = 2 segments: ["container", "items[0]"]

// Single ../ from array item -> goes to root
// currentPath: "items[0]" (1 segment)
// ../ goes up 1 level -> root
evaluateWithContext('price * ../discount', {
  rootData: { discount: 0.2, items: [{ price: 100 }] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
})
// Resolves ../discount to root.discount = 0.2
// Result: 100 * 0.2 = 20

// Single ../ from nested object in array -> goes to array item
// currentPath: "items[0].inner" (2 segments)
// ../ goes up 1 level -> "items[0]"
evaluateWithContext('price * ../itemMultiplier', {
  rootData: { items: [{ itemMultiplier: 3, inner: { price: 10 } }] },
  itemData: { price: 10 },
  currentPath: 'items[0].inner'
})
// Resolves ../itemMultiplier to items[0].itemMultiplier = 3
// Result: 10 * 3 = 30

// Double ../../ from nested object in array -> goes to root
// currentPath: "items[0].inner" (2 segments)
// ../../ goes up 2 levels -> root
evaluateWithContext('price * ../../rootRate', {
  rootData: { rootRate: 2, items: [{ inner: { price: 5 } }] },
  itemData: { price: 5 },
  currentPath: 'items[0].inner'
})
// Resolves ../../rootRate to root.rootRate = 2
// Result: 5 * 2 = 10`,
    },
    {
      name: 'Relative paths - nested arrays',
      description:
        'How relative paths work with arrays inside objects and nested arrays',
      code: `// Array inside nested object
// currentPath: "container.items[0]" (2 segments: ["container", "items[0]"])
// ../ goes up 1 level -> "container"
evaluateWithContext('price * ../containerRate', {
  rootData: {
    container: {
      containerRate: 4,
      items: [{ price: 5 }]
    }
  },
  itemData: { price: 5 },
  currentPath: 'container.items[0]'
})
// Resolves ../containerRate to container.containerRate = 4
// Result: 5 * 4 = 20

// ../../ from array inside object -> goes to root
// currentPath: "container.items[0]" (2 segments)
// ../../ goes up 2 levels -> root
evaluateWithContext('price * ../../rootVal', {
  rootData: {
    rootVal: 6,
    container: { items: [{ price: 5 }] }
  },
  itemData: { price: 5 },
  currentPath: 'container.items[0]'
})
// Resolves ../../rootVal to root.rootVal = 6
// Result: 5 * 6 = 30

// Nested arrays: items[].subItems[]
// currentPath: "items[0].subItems[0]" (2 segments: ["items[0]", "subItems[0]"])
// ../ goes up 1 level -> "items[0]"
evaluateWithContext('qty * ../itemPrice', {
  rootData: {
    items: [{ itemPrice: 10, subItems: [{ qty: 3 }] }]
  },
  itemData: { qty: 3 },
  currentPath: 'items[0].subItems[0]'
})
// Resolves ../itemPrice to items[0].itemPrice = 10
// Result: 3 * 10 = 30`,
    },
    {
      name: 'Relative paths - accessing nested properties',
      description:
        'Relative paths can include nested property access after the ../ prefix',
      code: `// ../sibling.nested accesses a sibling with nested property
// currentPath: "items[0].products[0]" (2 segments)
// ../ goes to "items[0]", then accesses .config.discount
evaluateWithContext('price * ../config.discount', {
  rootData: {
    items: [{
      config: { discount: 0.9 },
      products: [{ price: 100 }]
    }]
  },
  itemData: { price: 100 },
  currentPath: 'items[0].products[0]'
})
// Resolves ../config.discount to items[0].config.discount = 0.9
// Result: 100 * 0.9 = 90

// Deep nested: ../../settings.tax.rate
evaluateWithContext('amount * ../../settings.tax.rate', {
  rootData: {
    settings: { tax: { rate: 0.1 } },
    orders: [{ items: [{ amount: 200 }] }]
  },
  itemData: { amount: 200 },
  currentPath: 'orders[0].items[0]'
})
// Resolves ../../settings.tax.rate to root.settings.tax.rate = 0.1
// Result: 200 * 0.1 = 20`,
    },
    {
      name: 'Relative paths - complex nesting',
      description: 'Complex scenarios with arrays inside objects inside arrays',
      code: `// Array inside object inside array
// Structure: items[].container.subItems[]
// currentPath: "items[0].container.subItems[0]" (3 segments)
evaluateWithContext('val * ../containerMultiplier', {
  rootData: {
    items: [{
      container: {
        containerMultiplier: 4,
        subItems: [{ val: 3 }]
      }
    }]
  },
  itemData: { val: 3 },
  currentPath: 'items[0].container.subItems[0]'
})
// ../ goes to "items[0].container"
// Resolves ../containerMultiplier to items[0].container.containerMultiplier = 4
// Result: 3 * 4 = 12

// ../../ from same structure -> goes to array item
evaluateWithContext('val * ../../itemRate', {
  rootData: {
    items: [{
      itemRate: 5,
      container: { subItems: [{ val: 2 }] }
    }]
  },
  itemData: { val: 2 },
  currentPath: 'items[0].container.subItems[0]'
})
// ../../ goes to "items[0]"
// Resolves ../../itemRate to items[0].itemRate = 5
// Result: 2 * 5 = 10

// ../../../ from same structure -> goes to root
evaluateWithContext('val * ../../../rootFactor', {
  rootData: {
    rootFactor: 3,
    items: [{
      container: { subItems: [{ val: 7 }] }
    }]
  },
  itemData: { val: 7 },
  currentPath: 'items[0].container.subItems[0]'
})
// ../../../ goes to root
// Resolves ../../../rootFactor to root.rootFactor = 3
// Result: 7 * 3 = 21`,
    },
    {
      name: 'Array context tokens - basic',
      description:
        'Use #index, #length, #first, #last for position info; @prev, @next for neighbor access',
      code: `// arrayContext provides position info for array item formulas
const arrayContext = {
  levels: [{
    index: 2,      // current position
    length: 5,     // array length
    prev: { value: 20 },  // previous element
    next: { value: 40 },  // next element
  }]
};

evaluateWithContext('#index', { rootData: {}, arrayContext })
// 2

evaluateWithContext('#length', { rootData: {}, arrayContext })
// 5

evaluateWithContext('#first', { rootData: {}, arrayContext })
// false (index !== 0)

evaluateWithContext('#last', { rootData: {}, arrayContext })
// false (index !== length - 1)

evaluateWithContext('@prev.value', { rootData: {}, arrayContext })
// 20

evaluateWithContext('@next.value', { rootData: {}, arrayContext })
// 40

// At first element, @prev is null
evaluateWithContext('@prev', {
  rootData: {},
  arrayContext: { levels: [{ index: 0, length: 3, prev: null, next: {} }] }
})
// null`,
    },
    {
      name: 'Array context tokens - nested arrays',
      description:
        'Access parent array context with #parent.*, #root.*, @parent.*, @root.*',
      code: `// For nested arrays like orders[].items[]:
// levels[0] = innermost (items), levels[1] = parent (orders)
const arrayContext = {
  levels: [
    { index: 1, length: 3, prev: {}, next: {} },  // items[1]
    { index: 2, length: 5, prev: {}, next: {} },  // orders[2]
  ]
};

evaluateWithContext('#index', { rootData: {}, arrayContext })
// 1 (current item index)

evaluateWithContext('#parent.index', { rootData: {}, arrayContext })
// 2 (parent order index)

evaluateWithContext('#parent.length', { rootData: {}, arrayContext })
// 5 (number of orders)

// #root.* is shortcut for topmost array (same as #parent.* for 2 levels)
evaluateWithContext('#root.index', { rootData: {}, arrayContext })
// 2

// For 3+ levels, #root always points to outermost array
const threeLevel = {
  levels: [
    { index: 0, length: 2, prev: null, next: {} },  // innermost
    { index: 1, length: 3, prev: {}, next: {} },    // middle
    { index: 2, length: 4, prev: {}, next: null },  // outermost (root)
  ]
};

evaluateWithContext('#parent.parent.index', { rootData: {}, arrayContext: threeLevel })
// 2 (outermost)

evaluateWithContext('#root.index', { rootData: {}, arrayContext: threeLevel })
// 2 (same as #parent.parent.index)`,
    },
    {
      name: 'Array context tokens - practical examples',
      description:
        'Common patterns: running total, numbering, delta calculation',
      code: `// Running total pattern (like Excel)
// rows[].runningTotal = if(#first, value, @prev.runningTotal + value)
const rows = [
  { value: 10 },
  { value: 20 },
  { value: 15 },
];

// For rows[2]:
evaluateWithContext('if(#first, value, @prev.value + value)', {
  rootData: {},
  itemData: { value: 15 },
  arrayContext: {
    levels: [{
      index: 2,
      length: 3,
      prev: { value: 20 },  // Note: use non-computed field from prev
      next: null,
    }]
  }
})
// 35 (20 + 15)

// Nested numbering like "1.1", "1.2", "2.1"
// sections[].questions[].number
evaluateWithContext('concat(#parent.index + 1, ".", #index + 1)', {
  rootData: {},
  arrayContext: {
    levels: [
      { index: 1, length: 3, prev: {}, next: {} },  // question index
      { index: 0, length: 2, prev: null, next: {} }, // section index
    ]
  }
})
// "1.2"

// Delta from previous
// measurements[].delta = if(#first, 0, value - @prev.value)
evaluateWithContext('if(#first, 0, value - @prev.value)', {
  rootData: {},
  itemData: { value: 105 },
  arrayContext: {
    levels: [{
      index: 1,
      length: 3,
      prev: { value: 100 },
      next: { value: 102 },
    }]
  }
})
// 5`,
    },
  ],

  schemaUsage: {
    structure:
      '{ "x-formula": { "version": 1, "expression": "..." }, "readOnly": true }',
    fieldTypes: ['string', 'number', 'boolean'],
    rules: [
      'Add x-formula to string, number, or boolean field schema',
      'readOnly: true is REQUIRED for fields with x-formula',
      'Expression must reference existing fields in the same table',
      'Circular dependencies are not allowed (a references b, b references a)',
    ],
  },
};
