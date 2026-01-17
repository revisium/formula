export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

export interface CircularDependencyResult {
  hasCircular: boolean;
  cycle: string[] | null;
}

export interface TopologicalOrderResult {
  success: boolean;
  order: string[];
  error?: string;
}

/**
 * Build a dependency graph from a dependencies map
 *
 * @param dependencies - Map of node names to their dependencies
 * @returns Dependency graph with nodes and edges
 *
 * @example
 * const graph = buildDependencyGraph({
 *   tax: ['price'],
 *   total: ['price', 'tax']
 * });
 * // graph.edges.get('tax') = Set(['price'])
 * // graph.edges.get('total') = Set(['price', 'tax'])
 */
export function buildDependencyGraph(
  dependencies: Record<string, string[]>,
): DependencyGraph {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();

  for (const [node, deps] of Object.entries(dependencies)) {
    nodes.add(node);
    edges.set(node, new Set(deps));

    for (const dep of deps) {
      nodes.add(dep);
    }
  }

  return { nodes, edges };
}

/**
 * Detect first circular dependency in a dependency graph
 *
 * @param graph - Dependency graph
 * @returns Result with detected cycle (null if no cycle)
 *
 * @example
 * detectCircularDependencies(graph)
 * // { hasCircular: true, cycle: ['a', 'b', 'c', 'a'] }
 */
export function detectCircularDependencies(
  graph: DependencyGraph,
): CircularDependencyResult {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      const cycle = dfsVisit(node, graph, visited, recursionStack, path);
      if (cycle) {
        return { hasCircular: true, cycle };
      }
    }
  }

  return { hasCircular: false, cycle: null };
}

function dfsVisit(
  node: string,
  graph: DependencyGraph,
  visited: Set<string>,
  recursionStack: Set<string>,
  path: string[],
): string[] | null {
  visited.add(node);
  recursionStack.add(node);
  path.push(node);

  const deps = graph.edges.get(node);
  if (deps) {
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const cycle = dfsVisit(dep, graph, visited, recursionStack, path);
        if (cycle) {
          return cycle;
        }
      } else if (recursionStack.has(dep)) {
        const cycleStart = path.indexOf(dep);
        return [...path.slice(cycleStart), dep];
      }
    }
  }

  path.pop();
  recursionStack.delete(node);
  return null;
}

/**
 * Get topological order for formula evaluation
 *
 * @param graph - Dependency graph
 * @returns Ordered list of field names for evaluation
 *
 * @example
 * getTopologicalOrder(graph)
 * // { success: true, order: ['price', 'tax', 'total'] }
 */
export function getTopologicalOrder(
  graph: DependencyGraph,
): TopologicalOrderResult {
  const circularCheck = detectCircularDependencies(graph);
  if (circularCheck.hasCircular && circularCheck.cycle) {
    return {
      success: false,
      order: [],
      error: `Circular dependency detected: ${circularCheck.cycle.join(' -> ')}`,
    };
  }

  const inDegree = initializeInDegree(graph);
  const queue = findZeroInDegreeNodes(inDegree);
  const order = processQueue(queue, graph, inDegree);

  order.reverse();
  return { success: true, order };
}

function initializeInDegree(graph: DependencyGraph): Map<string, number> {
  const inDegree = new Map<string, number>();

  for (const node of graph.nodes) {
    inDegree.set(node, 0);
  }

  for (const deps of graph.edges.values()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
    }
  }

  return inDegree;
}

function findZeroInDegreeNodes(inDegree: Map<string, number>): string[] {
  const result: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      result.push(node);
    }
  }
  return result;
}

function processQueue(
  queue: string[],
  graph: DependencyGraph,
  inDegree: Map<string, number>,
): string[] {
  const order: string[] = [];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head]!;
    head++;
    order.push(node);

    const deps = graph.edges.get(node);
    if (deps) {
      for (const dep of deps) {
        const newDegree = (inDegree.get(dep) ?? 0) - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          queue.push(dep);
        }
      }
    }
  }

  return order;
}
