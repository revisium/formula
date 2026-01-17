import { describe, it, expect } from '@jest/globals';
import {
  buildDependencyGraph,
  detectCircularDependencies,
  getTopologicalOrder,
} from '../dependency-graph';

describe('buildDependencyGraph', () => {
  it('should build graph from single dependency', () => {
    const graph = buildDependencyGraph({
      tax: ['price'],
    });

    expect(graph.nodes.has('tax')).toBe(true);
    expect(graph.nodes.has('price')).toBe(true);
    expect(graph.edges.get('tax')).toEqual(new Set(['price']));
  });

  it('should build graph from multiple dependencies', () => {
    const graph = buildDependencyGraph({
      subtotal: ['price', 'quantity'],
      tax: ['subtotal'],
      total: ['subtotal', 'tax'],
    });

    expect(graph.nodes.size).toBe(5);
    expect(graph.edges.get('total')).toEqual(new Set(['subtotal', 'tax']));
  });

  it('should handle empty dependencies', () => {
    const graph = buildDependencyGraph({});

    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it('should handle node with no dependencies', () => {
    const graph = buildDependencyGraph({
      constant: [],
    });

    expect(graph.nodes.has('constant')).toBe(true);
    expect(graph.edges.get('constant')).toEqual(new Set());
  });
});

describe('detectCircularDependencies', () => {
  it('should detect no circular dependency in linear chain', () => {
    const graph = buildDependencyGraph({
      b: ['a'],
      c: ['b'],
      d: ['c'],
    });

    const result = detectCircularDependencies(graph);

    expect(result.hasCircular).toBe(false);
    expect(result.cycle).toBeNull();
  });

  it('should detect simple circular dependency', () => {
    const graph = buildDependencyGraph({
      a: ['b'],
      b: ['a'],
    });

    const result = detectCircularDependencies(graph);

    expect(result.hasCircular).toBe(true);
    expect(result.cycle).not.toBeNull();
  });

  it('should detect self-referencing circular dependency', () => {
    const graph = buildDependencyGraph({
      a: ['a'],
    });

    const result = detectCircularDependencies(graph);

    expect(result.hasCircular).toBe(true);
    expect(result.cycle).toEqual(['a', 'a']);
  });

  it('should detect indirect circular dependency', () => {
    const graph = buildDependencyGraph({
      a: ['b'],
      b: ['c'],
      c: ['a'],
    });

    const result = detectCircularDependencies(graph);

    expect(result.hasCircular).toBe(true);
    expect(result.cycle!.length).toBeGreaterThanOrEqual(3);
  });

  it('should not detect cycle when dependency is external', () => {
    const graph = buildDependencyGraph({
      tax: ['price'],
      total: ['price', 'tax'],
    });

    const result = detectCircularDependencies(graph);

    expect(result.hasCircular).toBe(false);
  });
});

describe('getTopologicalOrder', () => {
  it('should return correct order for linear chain', () => {
    const graph = buildDependencyGraph({
      c: ['b'],
      b: ['a'],
    });

    const result = getTopologicalOrder(graph);

    expect(result.success).toBe(true);
    const aIndex = result.order.indexOf('a');
    const bIndex = result.order.indexOf('b');
    const cIndex = result.order.indexOf('c');
    expect(aIndex).toBeLessThan(bIndex);
    expect(bIndex).toBeLessThan(cIndex);
  });

  it('should return correct order for diamond dependency', () => {
    const graph = buildDependencyGraph({
      b: ['a'],
      c: ['a'],
      d: ['b', 'c'],
    });

    const result = getTopologicalOrder(graph);

    expect(result.success).toBe(true);
    const aIndex = result.order.indexOf('a');
    const bIndex = result.order.indexOf('b');
    const cIndex = result.order.indexOf('c');
    const dIndex = result.order.indexOf('d');
    expect(aIndex).toBeLessThan(bIndex);
    expect(aIndex).toBeLessThan(cIndex);
    expect(bIndex).toBeLessThan(dIndex);
    expect(cIndex).toBeLessThan(dIndex);
  });

  it('should fail for circular dependency', () => {
    const graph = buildDependencyGraph({
      a: ['b'],
      b: ['a'],
    });

    const result = getTopologicalOrder(graph);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Circular dependency');
  });

  it('should handle empty graph', () => {
    const graph = buildDependencyGraph({});

    const result = getTopologicalOrder(graph);

    expect(result.success).toBe(true);
    expect(result.order).toEqual([]);
  });

  it('should handle complex invoice calculation', () => {
    const graph = buildDependencyGraph({
      subtotal: ['price', 'quantity'],
      discount: ['subtotal'],
      taxable: ['subtotal', 'discount'],
      tax: ['taxable'],
      total: ['taxable', 'tax'],
    });

    const result = getTopologicalOrder(graph);

    expect(result.success).toBe(true);

    const getIndex = (name: string) => result.order.indexOf(name);
    expect(getIndex('price')).toBeLessThan(getIndex('subtotal'));
    expect(getIndex('subtotal')).toBeLessThan(getIndex('discount'));
    expect(getIndex('subtotal')).toBeLessThan(getIndex('taxable'));
    expect(getIndex('taxable')).toBeLessThan(getIndex('tax'));
    expect(getIndex('taxable')).toBeLessThan(getIndex('total'));
    expect(getIndex('tax')).toBeLessThan(getIndex('total'));
  });
});
