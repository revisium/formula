<div align="center">

# @revisium/formula

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=revisium_formula&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_formula)
[![codecov](https://codecov.io/gh/revisium/formula/graph/badge.svg)](https://codecov.io/gh/revisium/formula)
[![GitHub License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/revisium/formula/blob/master/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/revisium/formula)](https://github.com/revisium/formula/releases)

Formula expression parser and evaluator for [Revisium](https://revisium.io).

</div>

## Installation

```bash
npm install @revisium/formula
```

## Usage

```typescript
import { detectVersion } from '@revisium/formula';

// Simple v1.0 formula
const result1 = detectVersion('baseDamage * attackSpeed');
// { minVersion: "1.0", features: [], dependencies: ["baseDamage", "attackSpeed"] }

// v1.1 formula with nested paths
const result2 = detectVersion('stats.damage * /multiplier');
// { minVersion: "1.1", features: ["nested_path", "root_path"], dependencies: [...] }

// Excel-style running total
const result3 = detectVersion('if(#first, value, @prev.runningTotal + value)');
// { minVersion: "1.1", features: ["context_token"], dependencies: [...] }
```

## API

| Function | Description |
|----------|-------------|
| `detectVersion` | Analyze formula and detect minimum required version |

## Path Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `field` | Top-level field | `baseDamage` |
| `obj.field` | Nested object | `stats.damage` |
| `arr[N]` | Array index | `items[0].price` |
| `arr[-1]` | Last element | `items[-1]` |
| `arr[*]` | Wildcard | `items[*].price` |
| `../field` | Parent (relative) | `../quantity` |
| `/field` | Root (absolute) | `/basePrice` |

## Array Context Tokens

| Token | Type | Description |
|-------|------|-------------|
| `#index` | number | Current array index |
| `#length` | number | Array length |
| `#first` | boolean | Is first element |
| `#last` | boolean | Is last element |
| `@prev` | object | Previous element |
| `@next` | object | Next element |
| `@current` | object | Current element |

## Version Detection

| Feature | Min Version |
|---------|-------------|
| Simple refs (`field`) | 1.0 |
| Nested paths (`a.b`) | 1.1 |
| Arrays (`[0]`, `[*]`) | 1.1 |
| Relative (`../`) | 1.1 |
| Context tokens | 1.1 |
| FK refs (`@table.field`) | 2.0 |

## Specification

See [Formula Specification v1.1](https://github.com/revisium/architecture/blob/master/specs/formula-v1.spec.md).

## License

MIT
