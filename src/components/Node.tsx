import React, { useState, useEffect } from 'react';
import { Node as NodeType } from '../types';

interface NodeProps {
  node: NodeType;
  onSelect: (nodeId: string) => void;
  onHover: (node: NodeType, x: number, y: number) => void;
  onHoverEnd: () => void;
  isConnected: boolean;
}

export const Node: React.FC<NodeProps> = ({ 
  node, 
  onSelect, 
  onHover, 
  onHoverEnd, 
  isConnected 
}) => {
  const [scale, setScale] = useState(1);
  const [breatheScale, setBreatheScale] = useState(1);

  useEffect(() => {
    // Breathing animation
    const interval = setInterval(() => {
      setBreatheScale(0.97 + Math.sin(Date.now() * 0.001) * 0.03);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scale animation when node data changes
    if (Math.abs(node.change24h) > 15) {
      setScale(1.1);
      setTimeout(() => setScale(1), 300);
    }
  }, [node.lastUpdated]);

  const opacity = node.isSelected || isConnected ? 1 : 0.8;
  const glowIntensity = node.isSelected ? 15 : 0;

  return (
    <g
      style={{
        cursor: 'pointer',
        opacity: isConnected || node.isSelected ? 1 : 0.9,
        filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.3)) ${node.isSelected ? `drop-shadow(0 0 ${glowIntensity}px ${node.color})` : ''}`
      }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={(e) => {
        const rect = (e.target as SVGElement).getBoundingClientRect();
        onHover(node, rect.left + rect.width / 2, rect.top - 10);
      }}
      onMouseLeave={onHoverEnd}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={node.size * scale * breatheScale}
        fill={node.color}
        opacity={opacity}
        style={{
          transition: 'all 0.8s ease-in-out',
          strokeWidth: node.isSelected ? 3 : 0,
          stroke: node.isSelected ? '#ffffff' : 'none'
        }}
      />
      
      {/* Inner glow effect */}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.size * scale * breatheScale * 0.7}
        fill={node.color}
        opacity={0.3}
        style={{
          transition: 'all 0.8s ease-in-out'
        }}
      />
      
      {/* Node label */}
      <text
        x={node.x}
        y={node.y + node.size + 20}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="500"
        opacity={node.isSelected || isConnected ? 1 : 0.7}
        style={{
          transition: 'opacity 0.3s ease'
        }}
      >
        {node.name}
      </text>
      
      {/* Category label */}
      <text
        x={node.x}
        y={node.y + node.size + 35}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="10"
        opacity={node.isSelected || isConnected ? 0.8 : 0.5}
        style={{
          transition: 'opacity 0.3s ease'
        }}
      >
        {node.category}
      </text>
    </g>
  );
};