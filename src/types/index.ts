export interface Node {
  id: string;
  name: string;
  category: string;
  liquidity: number;
  change24h: number;
  change7d: number;
  x: number;
  y: number;
  size: number;
  color: string;
  isSelected: boolean;
  lastUpdated: number;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  flow: number;
  direction: 'in' | 'out';
  particles: Particle[];
}

export interface Particle {
  id: string;
  progress: number;
  speed: number;
  size: number;
}

export interface TooltipData {
  node: Node;
  x: number;
  y: number;
  visible: boolean;
}