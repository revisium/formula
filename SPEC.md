<!-- AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY -->
<!-- Edit src/formula-spec.ts and run: npm run generate:spec -->

# Formula Specification v1.1

This document describes the formula syntax and features supported by `@revisium/formula`.

## Syntax Overview

Formulas are expressions that reference data fields and perform calculations. The parser analyzes formulas to extract dependencies and detect which features are used.

## Operators

### Arithmetic Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition or string concatenation |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo (remainder) |

### Comparison Operators

| Operator | Description |
|----------|-------------|
| `==` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |

### Logical Operators

| Operator | Description |
|----------|-------------|
| `&&` | Logical AND |
| `\|\|` | Logical OR |
| `!` | Logical NOT |

### Other Syntax

- Parentheses: (a + b) * c
- Unary minus: -value, a + -b

## Built-in Functions

### String Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `concat` | Concatenate multiple values into a single string | `concat(value1, value2, ...)` | string |
| `upper` | Convert string to uppercase | `upper(text)` | string |
| `lower` | Convert string to lowercase | `lower(text)` | string |
| `trim` | Remove whitespace from both ends of a string | `trim(text)` | string |
| `left` | Extract characters from the beginning of a string | `left(text, count)` | string |
| `right` | Extract characters from the end of a string | `right(text, count)` | string |
| `replace` | Replace first occurrence of a substring | `replace(text, search, replacement)` | string |
| `join` | Join array elements into a string | `join(array, separator?)` | string |

### Numeric Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `round` | Round a number to specified decimal places | `round(number, decimals?)` | number |
| `floor` | Round down to the nearest integer | `floor(number)` | number |
| `ceil` | Round up to the nearest integer | `ceil(number)` | number |
| `abs` | Get the absolute value | `abs(number)` | number |
| `sqrt` | Calculate the square root | `sqrt(number)` | number |
| `pow` | Raise a number to a power | `pow(base, exponent)` | number |
| `min` | Get the minimum of multiple values | `min(value1, value2, ...)` | number |
| `max` | Get the maximum of multiple values | `max(value1, value2, ...)` | number |
| `log` | Calculate the natural logarithm | `log(number)` | number |
| `log10` | Calculate the base-10 logarithm | `log10(number)` | number |
| `exp` | Calculate e raised to a power | `exp(number)` | number |
| `sign` | Get the sign of a number (-1, 0, or 1) | `sign(number)` | number |
| `length` | Get the length of a string or array | `length(value)` | number |

### Boolean Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `and` | Logical AND of two values | `and(a, b)` | boolean |
| `or` | Logical OR of two values | `or(a, b)` | boolean |
| `not` | Logical NOT of a value | `not(value)` | boolean |
| `contains` | Check if a string contains a substring | `contains(text, search)` | boolean |
| `startswith` | Check if a string starts with a prefix | `startswith(text, prefix)` | boolean |
| `endswith` | Check if a string ends with a suffix | `endswith(text, suffix)` | boolean |
| `isnull` | Check if a value is null or undefined | `isnull(value)` | boolean |
| `includes` | Check if an array contains a value | `includes(array, value)` | boolean |

### Array Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `sum` | Calculate the sum of array elements | `sum(array)` | number |
| `avg` | Calculate the average of array elements | `avg(array)` | number |
| `count` | Get the number of elements in an array | `count(array)` | number |
| `first` | Get the first element of an array | `first(array)` | any |
| `last` | Get the last element of an array | `last(array)` | any |

### Conversion Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `tostring` | Convert a value to string | `tostring(value)` | string |
| `tonumber` | Convert a value to number | `tonumber(value)` | number |
| `toboolean` | Convert a value to boolean | `toboolean(value)` | boolean |

### Conditional Functions

| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
| `if` | Return one of two values based on a condition | `if(condition, valueIfTrue, valueIfFalse)` | any |
| `coalesce` | Return the first non-null value | `coalesce(value1, value2, ...)` | any |

## Field References

- Simple field: fieldName (e.g., price, quantity)
- Nested path: object.property (e.g., stats.damage)
- Array index: array[0] or array[-1] for last element
- Bracket notation: ["field-name"] for field names containing hyphens
-   - Required when field name contains hyphen (-)
-   - Without brackets: field-name is parsed as "field minus name"
-   - With brackets: ["field-name"] references the field correctly
- Combined: items[0].price, user.addresses[-1].city, obj["field-name"].value

## Supported Features

### v1.0 Features

#### Simple Field References

Reference top-level fields by name.

```
price
quantity
baseDamage
```

**Dependencies extracted:** ["price"], ["quantity"], ["baseDamage"]

#### Arithmetic Operations

```
price * 1.1
a + b - c
quantity * price
```

#### Comparisons

```
price > 100
x == 10
quantity >= 5
```

### v1.1 Features

Features below require formula version 1.1 and set `minVersion: "1.1"`.

#### Nested Paths

Access nested object properties using dot notation.

```
stats.damage
user.profile.name
item.metadata.category
```

**Feature:** `nested_path`
**Dependencies:** Full path is extracted (e.g., ["stats.damage"])

#### Array Index Access

Access array elements by numeric index. Negative indices access from the end.

```
items[0].price
inventory[1].quantity
```

Negative indices access from the end:
```
items[-1].name  // last element
items[-2].price // second to last
```

**Feature:** `array_index`
**Dependencies:** ["items[0].price"], ["items[-1].name"]

## Version Detection

The parser automatically detects the minimum required version:

| Feature | Min Version |
|---------|-------------|
| Simple refs, arithmetic, comparisons | 1.0 |
| Function-named fields (max(max, 0)) | 1.0 |
| Nested paths (a.b) | 1.1 |
| Array index ([0], [-1]) | 1.1 |
| Absolute paths (/field) | 1.1 |
| Relative paths (../field) | 1.1 |
| Bracket notation (["field-name"]) | 1.1 |

## Parse Result

```typescript
interface ParseResult {
  ast: ASTNode;           // Abstract syntax tree
  dependencies: string[]; // List of field dependencies
  features: string[];     // List of detected features
  minVersion: string;     // Minimum required version ("1.0" or "1.1")
}
```

## API Examples

### Simple Expression (v1.0)

```typescript
parseExpression('price * 1.1')
// {
//   minVersion: "1.0",
//   features: [],
//   dependencies: ["price"]
// }
```

### Nested Path (v1.1)

```typescript
parseExpression('stats.damage * multiplier')
// {
//   minVersion: "1.1",
//   features: ["nested_path"],
//   dependencies: ["stats.damage", "multiplier"]
// }
```

### Array Access (v1.1)

```typescript
parseExpression('items[0].price + items[1].price')
// {
//   minVersion: "1.1",
//   features: ["array_index", "nested_path"],
//   dependencies: ["items[0].price", "items[1].price"]
// }
```

### Function-named fields

```typescript
// Built-in functions take precedence in function calls
evaluate('max(max, 0)', { max: 10 })
// 10 (max() function, then max field)

evaluate('max(max - field.min, 0)', { max: 100, field: { min: 20 } })
// 80

evaluate('round(round * 2)', { round: 3.7 })
// 7

// Field named "sum" doesn't conflict with sum() function
evaluate('sum(values) + sum', { values: [1, 2, 3], sum: 10 })
// 16
```

### Evaluate with context (array items)

```typescript
// Absolute path: /field always resolves from root
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
// 60
```

### Relative paths - path resolution

```typescript
// Path structure explanation:
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
// Result: 5 * 2 = 10
```

### Relative paths - nested arrays

```typescript
// Array inside nested object
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
// Result: 3 * 10 = 30
```

### Relative paths - accessing nested properties

```typescript
// ../sibling.nested accesses a sibling with nested property
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
// Result: 200 * 0.1 = 20
```

### Relative paths - complex nesting

```typescript
// Array inside object inside array
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
// Result: 7 * 3 = 21
```


## Evaluation

The `evaluate` function executes a formula with a given context:

```typescript
evaluate('price * 1.1', { price: 100 })
// 110

evaluate('stats.damage', { stats: { damage: 50 } })
// 50

evaluate('items[0].price', { items: [{ price: 10 }] })
// 10

evaluate('price > 100', { price: 150 })
// true

evaluate('a + b * c', { a: 1, b: 2, c: 3 })
// 7
```

## Schema Usage

Formula fields use the following structure:

```json
{ "x-formula": { "version": 1, "expression": "..." }, "readOnly": true }
```

**Supported field types:** string, number, boolean

**Rules:**
- Add x-formula to string, number, or boolean field schema
- readOnly: true is REQUIRED for fields with x-formula
- Expression must reference existing fields in the same table
- Circular dependencies are not allowed (a references b, b references a)

## Expression Examples

| Expression | Description | Result Type |
|------------|-------------|-------------|
| `price * quantity` | Calculate total from price and quantity | number |
| `firstName + " " + lastName` | Concatenate strings with space | string |
| `quantity > 0` | Check if in stock | boolean |
| `if(stock > 0, "Available", "Out of Stock")` | Conditional text based on stock | string |
| `price * (1 + taxRate)` | Price with tax | number |
| `items[0].price + items[1].price` | Sum first two item prices (v1.1) | number |
