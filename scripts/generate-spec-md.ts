import { writeFileSync } from 'fs';
import { formulaSpec, FunctionSpec } from '../src/formula-spec';

function formatFunctionTable(functions: FunctionSpec[]): string {
  return `| Function | Description | Signature | Returns |
|----------|-------------|-----------|---------|
${functions.map((f) => `| \`${f.name}\` | ${f.description.replace(/\n/g, ' ')} | \`${f.signature}\` | ${f.returnType} |`).join('\n')}`;
}

function getFeature(name: string) {
  const feature = formulaSpec.features.find((f) => f.name === name);
  if (!feature) {
    throw new Error(`Feature "${name}" not found in formulaSpec.features`);
  }
  return feature;
}

function formatFeature(feature: ReturnType<typeof getFeature>) {
  const deps = feature.dependenciesExtracted
    ? `\n\n**Dependencies extracted:** ${feature.dependenciesExtracted.join(', ')}`
    : '';
  return `#### ${feature.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}

${feature.description}.

\`\`\`
${feature.examples.join('\n')}
\`\`\`

**Feature:** \`${feature.name}\`${deps}`;
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
${formulaSpec.syntax.logicalOperators.map((o) => `| \`${o.operator.replace(/\|/g, '\\|')}\` | ${o.description} |`).join('\n')}

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

${formatFeature(getFeature('simple_refs'))}

${formatFeature(getFeature('arithmetic'))}

${formatFeature(getFeature('comparison'))}

${formatFeature(getFeature('function_named_fields'))}

### v1.1 Features

Features below require formula version 1.1 and set \`minVersion: "1.1"\`.

${formatFeature(getFeature('nested_path'))}

${formatFeature(getFeature('array_index'))}

${formatFeature(getFeature('array_wildcard_property'))}

${formatFeature(getFeature('root_path'))}

${formatFeature(getFeature('relative_path'))}

${formatFeature(getFeature('bracket_notation'))}

### v1.2 Features

Features below require formula version 1.2 and set \`minVersion: "1.2"\`.

${formatFeature(getFeature('context_token'))}

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

## AST Utilities

${formulaSpec.astUtilities
  .map(
    (u) => `### ${u.name}

${u.description}

\`\`\`typescript
${u.signature}
\`\`\`

\`\`\`typescript
${u.code}
\`\`\`
`,
  )
  .join('\n')}

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
