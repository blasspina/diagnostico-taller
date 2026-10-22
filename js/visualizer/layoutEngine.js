/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Hierarchical DAG Layout Engine for Nodal Graphs
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class LayoutEngine {
  constructor(options = {}) {
    this.nodeWidth = options.nodeWidth || 280;
    this.nodeHeight = options.nodeHeight || 130;
    this.horizontalGap = options.horizontalGap || 70;
    this.verticalGap = options.verticalGap || 110;
  }

  /**
   * Computes hierarchical coordinates (x, y) for all nodes and edges.
   * @param {Array} nodes
   * @returns {{ positions: Map<string, {x: number, y: number, width: number, height: number}>, edges: Array, bounds: {minX, minY, maxX, maxY, width, height} }}
   */
  computeLayout(nodes) {
    if (!nodes || nodes.length === 0) {
      return { positions: new Map(), edges: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 } };
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map();
    const childrenMap = new Map();
    const edges = [];

    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      childrenMap.set(n.id, []);
    });

    nodes.forEach(node => {
      if (Array.isArray(node.options)) {
        node.options.forEach(opt => {
          if (nodeMap.has(opt.targetNodeId)) {
            inDegree.set(opt.targetNodeId, (inDegree.get(opt.targetNodeId) || 0) + 1);
            childrenMap.get(node.id).push(opt.targetNodeId);
            edges.push({
              from: node.id,
              to: opt.targetNodeId,
              label: opt.label,
              badgeColor: opt.badgeColor || 'blue'
            });
          }
        });
      }
    });

    // Determine root nodes (inDegree === 0, or symptom nodes, or first node)
    let roots = nodes.filter(n => inDegree.get(n.id) === 0);
    if (roots.length === 0) {
      const symptom = nodes.find(n => n.category === 'symptom') || nodes[0];
      roots = [symptom];
    }

    // Assign level using BFS / longest path from roots
    const levels = new Map();
    const visited = new Set();
    const queue = roots.map(r => ({ id: r.id, level: 0 }));

    roots.forEach(r => levels.set(r.id, 0));

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      visited.add(id);

      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        const currentLvl = levels.get(childId) || 0;
        if (level + 1 > currentLvl) {
          levels.set(childId, level + 1);
        }
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Catch any disconnected nodes
    nodes.forEach(n => {
      if (!levels.has(n.id)) {
        levels.set(n.id, 0);
      }
    });

    // Group nodes by level
    const levelGroups = new Map();
    levels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(nodeId);
    });

    // Order nodes in each level based on parents to minimize edge crossings
    const maxLevel = Math.max(...levelGroups.keys(), 0);
    const positions = new Map();

    // Compute coordinates
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const group = levelGroups.get(lvl) || [];
      const count = group.length;
      const totalLevelWidth = count * this.nodeWidth + (count - 1) * this.horizontalGap;
      const startX = -totalLevelWidth / 2;
      const y = lvl * (this.nodeHeight + this.verticalGap) + 60;

      group.forEach((nodeId, idx) => {
        const x = startX + idx * (this.nodeWidth + this.horizontalGap);
        positions.set(nodeId, {
          x,
          y,
          width: this.nodeWidth,
          height: this.nodeHeight
        });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + this.nodeWidth);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + this.nodeHeight);
      });
    }

    // Add positions to edges
    const layoutEdges = edges.map(edge => {
      const fromPos = positions.get(edge.from);
      const toPos = positions.get(edge.to);
      return {
        ...edge,
        fromPos,
        toPos
      };
    });

    return {
      positions,
      edges: layoutEdges,
      bounds: {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 160,
        height: maxY - minY + 160
      }
    };
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.LayoutEngine = LayoutEngine;
