import { useState, useEffect, useRef } from 'react';
import { Node, Connection } from '../types';

interface Position {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const useForceLayout = (nodes: Node[], connections: Connection[]) => {
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
  const positionsRef = useRef<Record<string, Position>>({});

  // Initialize positions if nodes change
  useEffect(() => {
    const newPositions: Record<string, Position> = { ...positionsRef.current };
    nodes.forEach(node => {
      if (!newPositions[node.id]) {
        newPositions[node.id] = {
          x: node.x,
          y: node.y,
          vx: 0,
          vy: 0
        };
      }
    });
    positionsRef.current = newPositions;
  }, [nodes]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePhysics = () => {
      const currentPositions = positionsRef.current;
      const nodeIds = Object.keys(currentPositions);

      if (nodeIds.length === 0) return;

      const repulsionStrength = 3000;
      const attractionToCenter = 0.015;
      const linkStrength = 0.04;
      const friction = 0.85;
      const centerX = 400;
      const centerY = 300;

      // Map nodes for size/radius access
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // 1. Repulsion and Collision detection
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const idA = nodeIds[i];
          const idB = nodeIds[j];
          const posA = currentPositions[idA];
          const posB = currentPositions[idB];
          const nodeA = nodeMap.get(idA);
          const nodeB = nodeMap.get(idB);

          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distanceSq = dx * dx + dy * dy + 0.01;
          const distance = Math.sqrt(distanceSq);

          // Repulsion force
          const force = repulsionStrength / distanceSq;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          posA.vx += fx;
          posA.vy += fy;
          posB.vx -= fx;
          posB.vy -= fy;

          // Collision detection
          if (nodeA && nodeB) {
            const minDistance = (nodeA.size / 2) + (nodeB.size / 2) + 10;
            if (distance < minDistance) {
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;

              // Move apart proportional to overlap
              const moveX = nx * overlap * 0.5;
              const moveY = ny * overlap * 0.5;

              posA.x += moveX;
              posA.y += moveY;
              posB.x -= moveX;
              posB.y -= moveY;

              // Dampen velocities upon collision
              posA.vx *= 0.8;
              posA.vy *= 0.8;
              posB.vx *= 0.8;
              posB.vy *= 0.8;
            }
          }
        }
      }

      // 2. Attraction to center
      nodeIds.forEach(id => {
        const pos = currentPositions[id];
        pos.vx += (centerX - pos.x) * attractionToCenter;
        pos.vy += (centerY - pos.y) * attractionToCenter;
      });

      // 3. Link attraction
      connections.forEach(conn => {
        const posA = currentPositions[conn.source];
        const posB = currentPositions[conn.target];
        if (posA && posB) {
          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const targetDist = 150;
          const force = (distance - targetDist) * linkStrength;

          const fx = (dx / (distance || 1)) * force;
          const fy = (dy / (distance || 1)) * force;

          posA.vx += fx;
          posA.vy += fy;
          posB.vx -= fx;
          posB.vy -= fy;
        }
      });

      // 4. Apply velocity and friction
      const nextPositions: Record<string, { x: number, y: number }> = {};
      nodeIds.forEach(id => {
        const pos = currentPositions[id];
        pos.vx *= friction;
        pos.vy *= friction;
        pos.x += pos.vx;
        pos.y += pos.vy;

        // Keep within bounds
        pos.x = Math.max(50, Math.min(750, pos.x));
        pos.y = Math.max(50, Math.min(550, pos.y));

        nextPositions[id] = { x: pos.x, y: pos.y };
      });

      setPositions(nextPositions);
      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [connections]);

  return positions;
};
