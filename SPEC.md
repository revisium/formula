<!-- AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY -->
<!-- Edit src/formula-spec.ts and run: npm run generate:spec -->

# Formula Specification v1.1

This document describes the formula syntax and features supported by `@revisium/formula`.

## Syntax Overview

Formulas are expressions that reference data fields and perform calculations. The parser analyzes formulas to extract dependencies and detect which features are used.

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

#### Arithmetic Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition or string concatenation |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo (remainder) |

```
price * 1.1
a + b - c
quantity * price
```

#### Comparison Operators

| Operator | Description |
|----------|-------------|
| `==` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |

```
price > 100
x == 10
quantity >= 5
```

#### Unary Minus

```
-x
a + -b
```

#### Parentheses

Group expressions for precedence control.

```
(a + b) * c
price * (1 + taxRate)
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
| Nested paths (a.b) | 1.1 |
| Array index ([0], [-1]) | 1.1 |

## Parse Result

```typescript
interface ParseResult {
  ast: ASTNode;           // Abstract syntax tree
  dependencies: string[]; // List of field dependencies
  features: string[];     // List of detected features
  minVersion: string;     // Minimum required version ("1.0" or "1.1")
}
```

## Examples

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
