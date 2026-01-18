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
        description: 'Calculate the sum of array elements',
        signature: 'sum(array)',
        returnType: 'number',
        examples: ['sum(prices) // total of all prices'],
      },
      {
        name: 'avg',
        description: 'Calculate the average of array elements',
        signature: 'avg(array)',
        returnType: 'number',
        examples: ['avg(scores) // average score'],
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
  ],

  versionDetection: [
    { feature: 'Simple refs, arithmetic, comparisons', minVersion: '1.0' },
    { feature: 'Function-named fields (max(max, 0))', minVersion: '1.0' },
    { feature: 'Nested paths (a.b)', minVersion: '1.1' },
    { feature: 'Array index ([0], [-1])', minVersion: '1.1' },
    { feature: 'Absolute paths (/field)', minVersion: '1.1' },
    { feature: 'Relative paths (../field)', minVersion: '1.1' },
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
      description:
        'Complex scenarios with arrays inside objects inside arrays',
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
