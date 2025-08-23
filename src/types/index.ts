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

export interface Coin {
  id: string;
  symbol: string;
  name:string;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}