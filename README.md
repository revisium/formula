<div align="center">

# @revisium/formula

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=revisium_formula&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_formula)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=revisium_formula&metric=coverage)](https://sonarcloud.io/summary/new_code?id=revisium_formula)
[![GitHub License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/revisium/formula/blob/master/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/revisium/formula)](https://github.com/revisium/formula/releases)

Formula expression parser and evaluator for [Revisium](https://revisium.io).

[**Specification**](./SPEC.md) • [**API Reference**](#api)

</div>

## Installation

```bash
npm install @revisium/formula
```

## Usage

```typescript
import { parseExpression, evaluate } from '@revisium/formula';

// Simple arithmetic
parseExpression('price * 1.1');
// { minVersion: "1.0", features: [], dependencies: ["price"] }
evaluate('price * 1.1', { price: 100 });
// 110

// Nested object paths
parseExpression('stats.damage * multiplier');
// { minVersion: "1.1", features: ["nested_path"], dependencies: ["stats.damage", "multiplier"] }
evaluate('stats.damage * multiplier', { stats: { damage: 50 }, multiplier: 2 });
// 100

// Array index access
parseExpression('items[0].price + items[1].price');
// { minVersion: "1.1", features: ["array_index", "nested_path"], dependencies: ["items[0].price", "items[1].price"] }
evaluate('items[0].price + items[1].price', { items: [{ price: 10 }, { price: 20 }] });
// 30

// Comparisons
evaluate('price > 100', { price: 150 });
// true

// Fields named like functions
evaluate('max(max, 0)', { max: 10 });
// 10 (max() function is called with field "max" as argument)

evaluate('max(max - field.min, 0)', { max: 100, field: { min: 20 } });
// 80

// Type inference
import { inferFormulaType } from '@revisium/formula';

inferFormulaType('price * quantity', { price: 'number', quantity: 'number' });
// 'number'

inferFormulaType('price > 100');
// 'boolean'

// Schema validation
import { validateFormulaAgainstSchema } from '@revisium/formula';

const schema = {
  type: 'object',
  properties: {
    price: { type: 'number' },
    quantity: { type: 'number' },
    total: { type: 'number', 'x-formula': { version: 1, expression: 'price * quantity' } }
  }
};

validateFormulaAgainstSchema('price * quantity', 'total', schema);
// null (valid)

validateFormulaAgainstSchema('price > 100', 'total', schema);
// { field: 'total', error: "Type mismatch: formula returns 'boolean' but field expects 'number'" }

// Array item formulas with path resolution
import { evaluateWithContext } from '@revisium/formula';

// Absolute path: /field always resolves from root data
evaluateWithContext('price * (1 + /taxRate)', {
  rootData: { taxRate: 0.1, items: [{ price: 100 }] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
});
// 110

// Relative path: ../field resolves from parent (root)
evaluateWithContext('price * (1 - ../discount)', {
  rootData: { discount: 0.2, items: [] },
  itemData: { price: 100 },
  currentPath: 'items[0]'
});
// 80
```

## API

### Parser API

| Function | Description |
|----------|-------------|
| `parseFormula` | Low-level parser returning AST, dependencies, features |
| `validateSyntax` | Validate expression syntax |
| `evaluate` | Evaluate expression with context |
| `evaluateWithContext` | Evaluate with automatic `/` and `../` path resolution |
| `inferFormulaType` | Infer return type of expression |

### Expression API

| Function | Description |
|----------|-------------|
| `parseExpression` | Parse expression, extract dependencies and version |
| `validateFormulaSyntax` | Validate formula expression syntax |

### Graph API

| Function | Description |
|----------|-------------|
| `buildDependencyGraph` | Build dependency graph from `Record<string, string[]>` |
| `detectCircularDependencies` | Detect circular dependencies in graph |
| `getTopologicalOrder` | Get evaluation order for nodes |

### Schema Validation

| Function | Description |
|----------|-------------|
| `extractSchemaFormulas` | Extract formulas from JSON Schema |
| `validateFormulaAgainstSchema` | Validate single formula against schema |
| `validateSchemaFormulas` | Validate all formulas in schema |

## Path Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `field` | Top-level field | `baseDamage` |
| `obj.field` | Nested object | `stats.damage` |
| `arr[N]` | Array index | `items[0].price` |
| `arr[-1]` | Last element | `items[-1]` |
| `/field` | Absolute path (from root) | `/taxRate`, `/config.tax` |
| `../field` | Relative path (parent scope) | `../discount`, `../settings.multiplier` |

## Version Detection

| Feature | Min Version |
|---------|-------------|
| Simple refs (`field`) | 1.0 |
| Function-named fields | 1.0 |
| Nested paths (`a.b`) | 1.1 |
| Array index (`[0]`, `[-1]`) | 1.1 |
| Absolute paths (`/field`) | 1.1 |
| Relative paths (`../field`) | 1.1 |

## License

MIT
