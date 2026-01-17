import { writeFileSync } from 'fs';
import { formulaSpec } from '../src/formula-spec';

const md = `<!-- AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY -->
<!-- Edit src/formula-spec.ts and run: npm run generate:spec -->

# Formula Specification v${formulaSpec.version}

This document describes the formula syntax and features supported by \`@revisium/formula\`.

## Syntax Overview

Formulas are expressions that reference data fields and perform calculations. The parser analyzes formulas to extract dependencies and detect which features are used.

## Supported Features

### v1.0 Features

#### Simple Field References

${formulaSpec.features[0].description}.

\`\`\`
${formulaSpec.features[0].examples.join('\n')}
\`\`\`

**Dependencies extracted:** ${formulaSpec.features[0].dependenciesExtracted?.join(', ')}

#### Arithmetic Operators

| Operator | Description |
|----------|-------------|
${formulaSpec.syntax.arithmeticOperators.map((o) => `| \`${o.operator}\` | ${o.description} |`).join('\n')}

\`\`\`
${formulaSpec.features[1].examples.join('\n')}
\`\`\`

#### Comparison Operators

| Operator | Description |
|----------|-------------|
${formulaSpec.syntax.comparisonOperators.map((o) => `| \`${o.operator}\` | ${o.description} |`).join('\n')}

\`\`\`
${formulaSpec.features[2].examples.join('\n')}
\`\`\`

#### Unary Minus

\`\`\`
-x
a + -b
\`\`\`

#### Parentheses

Group expressions for precedence control.

\`\`\`
(a + b) * c
price * (1 + taxRate)
\`\`\`

### v1.1 Features

Features below require formula version 1.1 and set \`minVersion: "1.1"\`.

#### Nested Paths

${formulaSpec.features[3].description}.

\`\`\`
${formulaSpec.features[3].examples.join('\n')}
\`\`\`

**Feature:** \`nested_path\`
**Dependencies:** Full path is extracted (e.g., ${formulaSpec.features[3].dependenciesExtracted?.join(', ')})

#### Array Index Access

${formulaSpec.features[4].description}.

\`\`\`
${formulaSpec.features[4].examples.slice(0, 2).join('\n')}
\`\`\`

Negative indices access from the end:
\`\`\`
${formulaSpec.features[4].examples.slice(2).join('\n')}
\`\`\`

**Feature:** \`array_index\`
**Dependencies:** ${formulaSpec.features[4].dependenciesExtracted?.join(', ')}

## Version Detection

${formulaSpec.parseResult.description}:

| Feature | Min Version |
|---------|-------------|
${formulaSpec.versionDetection.map((v) => `| ${v.feature} | ${v.minVersion} |`).join('\n')}

## Parse Result

\`\`\`typescript
${formulaSpec.parseResult.interface}
\`\`\`

## Examples

${formulaSpec.apiExamples
  .filter((e) => e.name !== 'Evaluate expressions')
  .map(
    (e) => `### ${e.name}

\`\`\`typescript
${e.code}
\`\`\`
`,
  )
  .join('\n')}

## Evaluation

The \`evaluate\` function executes a formula with a given context:

\`\`\`typescript
${formulaSpec.apiExamples.find((e) => e.name === 'Evaluate expressions')?.code}
\`\`\`
`;

writeFileSync('SPEC.md', md);
console.log('Generated SPEC.md');
