import React from 'react';
import { Connection as ConnectionType, Node, Particle as ParticleType } from '../types';

interface ConnectionProps {
  connection: ConnectionType;
  nodes: Node[];
  isHighlighted: boolean;
}

const Particle: React.FC<{ 
  particle: ParticleType; 
  path: string; 
  color: string;
}> = ({ particle, path, color }) => {
  return (
    <circle
      r={particle.size}
      fill="white"
      opacity={0.8}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
      }}
    >
      <animateMotion
        dur="3s"
        repeatCount="indefinite"
        begin={`${particle.progress * 3}s`}
      >
        <mpath href={`#${path.replace('#', '')}`} />
      </animateMotion>
    </circle>
  );
};

export const Connection: React.FC<ConnectionProps> = ({ 
  connection, 
  nodes, 
  isHighlighted 
}) => {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  if (!sourceNode || !targetNode) return null;

  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Control points for Bézier curve
  const controlOffset = distance * 0.3;
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;
  const perpX = -dy / distance * controlOffset;
  const perpY = dx / distance * controlOffset;

  const pathId = `path-${connection.id}`;
  const pathData = `M ${sourceNode.x} ${sourceNode.y} Q ${midX + perpX} ${midY + perpY} ${targetNode.x} ${targetNode.y}`;
  
  const strokeWidth = Math.max(2, Math.min(12, connection.flow / 5000000));
  const color = connection.direction === 'in' ? '#3b82f6' : '#f97316';
  const opacity = isHighlighted ? 1 : 0.6;

  return (
    <g>
      {/* Connection path definition */}
      <defs>
        <path id={pathId.replace('#', '')} d={pathData} />
        <linearGradient id={`gradient-${connection.id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
        </linearGradient>
      </defs>
      
      {/* Main connection line */}
      <path
        d={pathData}
        stroke={`url(#gradient-${connection.id})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        opacity={opacity}
        style={{
          transition: 'all 0.8s ease-in-out',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}
      />
      
      {/* Pulsing effect for active connections */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth + 2}
        fill="none"
        strokeLinecap="round"
        opacity={0.2}
        style={{
          transition: 'all 0.8s ease-in-out'
        }}
      >
        <animate
          attributeName="opacity"
          values="0.2;0.5;0.2"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      
      {/* Moving particles */}
      {connection.particles.map(particle => (
        <Particle
          key={particle.id}
          particle={particle}
          path={`#${pathId.replace('#', '')}`}
          color={color}
        />
      ))}
      
      {/* Flow direction indicator */}
      <circle
        cx={targetNode.x}
        cy={targetNode.y}
        r="6"
        fill={color}
        opacity={opacity * 0.8}
        style={{
          transition: 'all 0.8s ease-in-out'
        }}
      />
    </g>
  );
};