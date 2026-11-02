// Path and array-context helpers of @revisium/formula 0.10.0 (src/ohm/core/parser.ts),
// copied verbatim so the reference evaluation does not depend on production code.
import type { ArrayContext, ArrayLevelContext } from '../../types';

function parseCurrentPath(currentPath: string): string[] {
  const segments: string[] = [];
  let current = '';
  let inBracket = false;

  for (const char of currentPath) {
    if (char === '[') {
      inBracket = true;
      current += char;
    } else if (char === ']') {
      inBracket = false;
      current += char;
    } else if (char === '.' && !inBracket) {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function getValueByPath(data: Record<string, unknown>, path: string): unknown {
  const segments = parseCurrentPath(path);
  let current: unknown = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }

    const bracketMatch = /^([^[]+)\[(\d+)\]$/.exec(segment);
    if (bracketMatch?.[1] && bracketMatch[2]) {
      const fieldName = bracketMatch[1];
      const index = Number.parseInt(bracketMatch[2], 10);
      const arr = (current as Record<string, unknown>)[fieldName];
      if (!Array.isArray(arr)) {
        return undefined;
      }
      current = arr[index];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current;
}

function extractRootField(fieldPath: string): string {
  const dotIndex = fieldPath.indexOf('.');
  const bracketIndex = fieldPath.indexOf('[');

  if (dotIndex === -1 && bracketIndex === -1) {
    return fieldPath;
  }
  if (dotIndex === -1) {
    return fieldPath.slice(0, bracketIndex);
  }
  if (bracketIndex === -1) {
    return fieldPath.slice(0, dotIndex);
  }
  return fieldPath.slice(0, Math.min(dotIndex, bracketIndex));
}

function countParentLevels(path: string): number {
  let count = 0;
  let remaining = path;
  while (remaining.startsWith('../')) {
    count++;
    remaining = remaining.slice(3);
  }
  return count;
}

function getPathAfterParents(path: string): string {
  return path.replace(/^(\.\.\/)+/, '');
}

function resolveRelativePath(
  rootData: Record<string, unknown>,
  currentPath: string | undefined,
  relativePath: string,
): unknown {
  const parentLevels = countParentLevels(relativePath);
  const fieldPath = getPathAfterParents(relativePath);

  if (!currentPath) {
    return getValueByPath(rootData, fieldPath);
  }

  const pathSegments = parseCurrentPath(currentPath);
  const targetLevel = pathSegments.length - parentLevels;

  if (targetLevel <= 0) {
    return getValueByPath(rootData, fieldPath);
  }

  const basePath = pathSegments.slice(0, targetLevel).join('.');
  const fullPath = basePath ? `${basePath}.${fieldPath}` : fieldPath;

  return getValueByPath(rootData, fullPath);
}

function extractRelativeBase(relativePath: string): string {
  const pathAfterParents = getPathAfterParents(relativePath);
  const baseField = extractRootField(pathAfterParents);
  const prefix = relativePath.slice(
    0,
    relativePath.length - pathAfterParents.length,
  );
  return prefix + baseField;
}

export function buildArrayContextTokens(
  arrayContext: ArrayContext | undefined,
): Record<string, unknown> {
  if (!arrayContext || arrayContext.levels.length === 0) {
    return {};
  }

  const tokens: Record<string, unknown> = {};
  const levels = arrayContext.levels;

  const buildLevelTokens = (level: ArrayLevelContext, prefix: string): void => {
    tokens[`${prefix}index`] = level.index;
    tokens[`${prefix}length`] = level.length;
    tokens[`${prefix}first`] = level.index === 0;
    tokens[`${prefix}last`] = level.index === level.length - 1;
  };

  const buildNeighborTokens = (
    level: ArrayLevelContext,
    prefix: string,
  ): void => {
    tokens[`${prefix}prev`] = level.prev;
    tokens[`${prefix}next`] = level.next;
  };

  if (levels[0]) {
    buildLevelTokens(levels[0], '#');
    buildNeighborTokens(levels[0], '@');
  }

  let parentPrefix = '#parent.';
  let atParentPrefix = '@parent.';
  for (let i = 1; i < levels.length; i++) {
    const level = levels[i];
    if (level) {
      buildLevelTokens(level, parentPrefix);
      buildNeighborTokens(level, atParentPrefix);
    }
    parentPrefix = '#parent.' + parentPrefix.slice(1);
    atParentPrefix = '@parent.' + atParentPrefix.slice(1);
  }

  const rootLevel = levels.at(-1);
  if (rootLevel) {
    tokens['#root.index'] = rootLevel.index;
    tokens['#root.length'] = rootLevel.length;
    tokens['#root.first'] = rootLevel.index === 0;
    tokens['#root.last'] = rootLevel.index === rootLevel.length - 1;
    tokens['@root.prev'] = rootLevel.prev;
    tokens['@root.next'] = rootLevel.next;
  }

  return tokens;
}

export function buildPathReferences(
  rootData: Record<string, unknown>,
  dependencies: string[],
  currentPath?: string,
): Record<string, unknown> {
  const refs: Record<string, unknown> = {};

  for (const dep of dependencies) {
    if (dep.startsWith('/')) {
      const fieldPath = dep.slice(1);
      const rootField = extractRootField(fieldPath);
      const contextKey = '/' + rootField;
      if (!(contextKey in refs)) {
        refs[contextKey] = getValueByPath(rootData, rootField);
      }
    } else if (dep.startsWith('../')) {
      const contextKey = extractRelativeBase(dep);
      if (!(contextKey in refs)) {
        refs[contextKey] = resolveRelativePath(
          rootData,
          currentPath,
          contextKey,
        );
      }
    }
  }

  return refs;
}
