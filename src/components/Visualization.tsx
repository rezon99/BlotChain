import React, { useMemo } from 'react';
import { Node as NodeType, Connection as ConnectionType } from '../types';
import { Node } from './Node';
import { Connection as ConnectionComponent } from './Connection';
import { CascadeEffect } from './CascadeEffect';
import { useForceLayout } from '../hooks/useForceLayout';

interface VisualizationProps {
  nodes: NodeType[];
  connections: ConnectionType[];
  filteredNodeIds: Set<string>;
  selectedNodes: Set<string>;
  connectedNodeIds: string[];
  cascadeEffects: Array<{
    id: string;
    x: number;
    y: number;
    trigger: number;
  }>;
  onNodeSelect: (nodeId: string) => void;
  onNodeHover: (node: NodeType, x: number, y: number) => void;
  onNodeHoverEnd: () => void;
  onCascadeComplete: (id: string) => void;
}

export const Visualization: React.FC<VisualizationProps> = React.memo(({
  nodes,
  connections,
  filteredNodeIds,
  selectedNodes,
  connectedNodeIds,
  cascadeEffects,
  onNodeSelect,
  onNodeHover,
  onNodeHoverEnd,
  onCascadeComplete
}) => {
  // The physics simulation runs on all nodes for stability
  const nodePositions = useForceLayout(nodes, connections);

  const renderedNodes = useMemo(() => {
    return nodes
      .filter(node => filteredNodeIds.has(node.id))
      .map(node => ({
        ...node,
        x: nodePositions[node.id]?.x ?? node.x,
        y: nodePositions[node.id]?.y ?? node.y,
      }));
  }, [nodes, filteredNodeIds, nodePositions]);

  const renderedConnections = useMemo(() => {
    return connections.filter(conn =>
      filteredNodeIds.has(conn.source) && filteredNodeIds.has(conn.target)
    );
  }, [connections, filteredNodeIds]);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-screen max-w-full"
        style={{ minHeight: '600px' }}
      >
        {/* Connections */}
        {renderedConnections.map(connection => (
          <ConnectionComponent
            key={connection.id}
            connection={connection}
            nodes={nodes}
            isHighlighted={
              selectedNodes.has(connection.source) ||
              selectedNodes.has(connection.target) ||
              selectedNodes.size === 0
            }
          />
        ))}

        {/* Nodes */}
        {renderedNodes.map(node => (
          <Node
            key={node.id}
            node={node}
            onSelect={onNodeSelect}
            onHover={onNodeHover}
            onHoverEnd={onNodeHoverEnd}
            isConnected={
              connectedNodeIds.includes(node.id) ||
              selectedNodes.size === 0
            }
          />
        ))}

        {/* Cascade effects */}
        {cascadeEffects.map(effect => (
          <CascadeEffect
            key={effect.id}
            x={effect.x}
            y={effect.y}
            trigger={effect.trigger}
            onComplete={() => onCascadeComplete(effect.id)}
          />
        ))}
      </svg>
    </div>
  );
});

Visualization.displayName = 'Visualization';
