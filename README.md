<div align="center">

# @revisium/formula

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=revisium_formula&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_formula)
[![codecov](https://codecov.io/gh/revisium/formula/graph/badge.svg)](https://codecov.io/gh/revisium/formula)
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
```

## API

### Parser API

| Function | Description |
|----------|-------------|
| `parseFormula` | Low-level parser returning AST, dependencies, features |
| `validateSyntax` | Validate expression syntax |
| `evaluate` | Evaluate expression with context |

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

### Schema Extraction

| Function | Description |
|----------|-------------|
| `extractSchemaFormulas` | Extract formulas from JSON Schema |

## Path Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `field` | Top-level field | `baseDamage` |
| `obj.field` | Nested object | `stats.damage` |
| `arr[N]` | Array index | `items[0].price` |
| `arr[-1]` | Last element | `items[-1]` |

## Version Detection

| Feature | Min Version |
|---------|-------------|
| Simple refs (`field`) | 1.0 |
| Nested paths (`a.b`) | 1.1 |
| Array index (`[0]`, `[-1]`) | 1.1 |

## License

MIT
