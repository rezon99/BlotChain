import { Node } from '../types';

interface LayoutBounds {
  width: number;
  height: number;
  padding: number;
}

interface ForceLayoutOptions {
  iterations?: number;
  repulsionStrength?: number;
  centerAttraction?: number;
  minDistance?: number;
}

export function applyForceDirectedLayout(
  nodes: Node[],
  bounds: LayoutBounds,
  options: ForceLayoutOptions = {}
): Node[] {
  if (nodes.length <= 1) return nodes;

  const {
    iterations = 40,
    repulsionStrength = 0.9,
    centerAttraction = 0.03,
    minDistance = 12
  } = options;

  const positioned = nodes.map(node => ({ ...node }));
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  for (let step = 0; step < iterations; step++) {
    const forces = positioned.map(() => ({ x: 0, y: 0 }));

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const desired = a.size + b.size + minDistance;

        if (distance < desired) {
          const overlap = desired - distance;
          const nx = dx / distance;
          const ny = dy / distance;
          const push = overlap * repulsionStrength;

          forces[i].x -= nx * push;
          forces[i].y -= ny * push;
          forces[j].x += nx * push;
          forces[j].y += ny * push;
        }
      }

      const node = positioned[i];
      forces[i].x += (centerX - node.x) * centerAttraction;
      forces[i].y += (centerY - node.y) * centerAttraction;
    }

    for (let i = 0; i < positioned.length; i++) {
      const node = positioned[i];
      node.x += forces[i].x;
      node.y += forces[i].y;

      const minX = bounds.padding + node.size;
      const maxX = bounds.width - bounds.padding - node.size;
      const minY = bounds.padding + node.size;
      const maxY = bounds.height - bounds.padding - node.size;

      node.x = Math.max(minX, Math.min(maxX, node.x));
      node.y = Math.max(minY, Math.min(maxY, node.y));
    }
  }

  return positioned;
}
