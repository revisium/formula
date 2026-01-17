import { writeFileSync } from 'fs';
import { formulaSpec, FunctionSpec } from '../src/formula-spec';

function formatFunctionTable(functions: FunctionSpec[]): string {
  return `| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
${functions.map((f) => `| \`${f.name}\` | ${f.description} | \`${f.signature}\` | ${f.returnType} |`).join('\n')}`;
}

const md = `<!-- AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY -->
<!-- Edit src/formula-spec.ts and run: npm run generate:spec -->

# Formula Specification v${formulaSpec.version}

This document describes the formula syntax and features supported by \`@revisium/formula\`.

## Syntax Overview

Formulas are expressions that reference data fields and perform calculations. The parser analyzes formulas to extract dependencies and detect which features are used.

## Operators

### Arithmetic Operators

| Operator | Description |
|----------|-------------|
${formulaSpec.syntax.arithmeticOperators.map((o) => `| \`${o.operator}\` | ${o.description} |`).join('\n')}

### Comparison Operators

| Operator | Description |
|----------|-------------|
${formulaSpec.syntax.comparisonOperators.map((o) => `| \`${o.operator}\` | ${o.description} |`).join('\n')}

### Logical Operators

| Operator | Description |
|----------|-------------|
${formulaSpec.syntax.logicalOperators.map((o) => `| \`${o.operator}\` | ${o.description} |`).join('\n')}

### Other Syntax

${formulaSpec.syntax.other.map((o) => `- ${o}`).join('\n')}

## Built-in Functions

### String Functions

${formatFunctionTable(formulaSpec.functions.string)}

### Numeric Functions

${formatFunctionTable(formulaSpec.functions.numeric)}

### Boolean Functions

${formatFunctionTable(formulaSpec.functions.boolean)}

### Array Functions

${formatFunctionTable(formulaSpec.functions.array)}

### Conversion Functions

${formatFunctionTable(formulaSpec.functions.conversion)}

### Conditional Functions

${formatFunctionTable(formulaSpec.functions.conditional)}

## Field References

${formulaSpec.syntax.fieldReferences.map((r) => `- ${r}`).join('\n')}

## Supported Features

### v1.0 Features

#### Simple Field References

${formulaSpec.features[0].description}.

\`\`\`
${formulaSpec.features[0].examples.join('\n')}
\`\`\`

**Dependencies extracted:** ${formulaSpec.features[0].dependenciesExtracted?.join(', ')}

#### Arithmetic Operations

\`\`\`
${formulaSpec.features[1].examples.join('\n')}
\`\`\`

#### Comparisons

\`\`\`
${formulaSpec.features[2].examples.join('\n')}
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

## API Examples

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

## Schema Usage

Formula fields use the following structure:

\`\`\`json
${formulaSpec.schemaUsage.structure}
\`\`\`

**Supported field types:** ${formulaSpec.schemaUsage.fieldTypes.join(', ')}

**Rules:**
${formulaSpec.schemaUsage.rules.map((r) => `- ${r}`).join('\n')}

## Expression Examples

| Expression | Description | Result Type |
|------------|-------------|-------------|
${formulaSpec.examples.map((e) => `| \`${e.expression}\` | ${e.description} | ${e.result} |`).join('\n')}
`;

writeFileSync('SPEC.md', md);
console.log('Generated SPEC.md');
