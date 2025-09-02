import { Node, Connection } from '../types';
import { CoinMarketData, ExchangeData } from '../services/coinGeckoApi';

export function transformCoinDataToNodes(
  coinData: CoinMarketData[], 
  exchangeData: ExchangeData[] = []
): Node[] {
  const allData = [
    ...coinData.map(coin => ({
      ...coin,
      type: 'coin' as const,
      volume: coin.total_volume
    })),
    ...exchangeData.map(exchange => ({
      id: exchange.id,
      name: exchange.name,
      symbol: exchange.id,
      current_price: 0,
      market_cap: exchange.trade_volume_24h_btc * 50000, // Approximate USD value
      market_cap_rank: exchange.trust_score_rank,
      price_change_percentage_24h: (exchange.trust_score - 5) * 2, // Simulate change
      price_change_percentage_7d_in_currency: (exchange.trust_score - 5) * 4,
      total_volume: exchange.trade_volume_24h_btc * 50000,
      circulating_supply: 0,
      type: 'exchange' as const,
      volume: exchange.trade_volume_24h_btc * 50000
    }))
  ];

  return allData.map((item, index) => {
    const angle = (index * 2 * Math.PI) / allData.length;
    const radius = 180 + (index % 3) * 80; // Varied radius for visual appeal
    
    // Calculate liquidity based on market cap and volume
    const liquidity = item.type === 'coin' 
      ? item.market_cap + item.total_volume 
      : item.volume;
    
    // Determine category
    const category = item.type === 'exchange' 
      ? 'Exchange'
      : getCoinCategory(item.name, item.market_cap_rank);

    return {
      id: item.id,
      name: item.name,
      category,
      liquidity,
      change24h: item.price_change_percentage_24h || 0,
      change7d: item.price_change_percentage_7d_in_currency || 0,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      size: calculateNodeSize(liquidity),
      color: getNodeColor(
        item.price_change_percentage_24h || 0, 
        item.price_change_percentage_7d_in_currency || 0
      ),
      isSelected: false,
      lastUpdated: Date.now()
    };
  });
}

export function generateConnectionsFromRealData(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  
  // Create connections based on market relationships
  const exchanges = nodes.filter(n => n.category === 'Exchange');
  const layer1Coins = nodes.filter(n => n.category === 'Layer 1');
  const defiProjects = nodes.filter(n => n.category === 'DeFi');
  
  // Connect exchanges to major coins
  exchanges.forEach(exchange => {
    layer1Coins.slice(0, 3).forEach(coin => {
      if (Math.random() > 0.3) { // 70% chance of connection
        connections.push(createConnection(exchange, coin));
      }
    });
  });
  
  // Connect DeFi projects to Layer 1
  defiProjects.forEach(defi => {
    const randomLayer1 = layer1Coins[Math.floor(Math.random() * layer1Coins.length)];
    if (randomLayer1) {
      connections.push(createConnection(defi, randomLayer1));
    }
  });
  
  // Add some random connections for network effect
  for (let i = 0; i < Math.min(10, nodes.length); i++) {
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    
    if (source.id !== target.id && !connections.find(c => 
      (c.source === source.id && c.target === target.id) ||
      (c.source === target.id && c.target === source.id)
    )) {
      connections.push(createConnection(source, target));
    }
  }
  
  return connections;
}

function createConnection(source: Node, target: Node): Connection {
  const flow = Math.min(source.liquidity, target.liquidity) * (0.1 + Math.random() * 0.3);
  
  return {
    id: `${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    flow,
    direction: source.liquidity > target.liquidity ? 'out' : 'in',
    particles: generateParticles(Math.min(5, Math.max(1, Math.floor(flow / 50000000))))
  };
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}`,
    progress: Math.random(),
    speed: 0.008 + Math.random() * 0.015,
    size: 3 + Math.random() * 3
  }));
}

function calculateNodeSize(liquidity: number): number {
  // Logarithmic scaling for better visual distribution
  const minSize = 25;
  const maxSize = 100;
  const logLiquidity = Math.log10(Math.max(1, liquidity));
  const normalizedSize = (logLiquidity - 6) / (12 - 6); // Normalize between 1M and 1T
  
  return Math.max(minSize, Math.min(maxSize, minSize + normalizedSize * (maxSize - minSize)));
}

function getCoinCategory(name: string, rank: number): string {
  const name_lower = name.toLowerCase();
  
  if (name_lower.includes('bitcoin') || name_lower.includes('ethereum')) {
    return 'Layer 1';
  }
  if (name_lower.includes('binance') || name_lower.includes('coinbase')) {
    return 'Exchange';
  }
  if (name_lower.includes('uniswap') || name_lower.includes('sushiswap') || 
      name_lower.includes('pancake') || name_lower.includes('curve')) {
    return 'DeFi';
  }
  if (name_lower.includes('polygon') || name_lower.includes('arbitrum') || 
      name_lower.includes('optimism')) {
    return 'Layer 2';
  }
  if (name_lower.includes('chainlink') || name_lower.includes('oracle')) {
    return 'Oracle';
  }
  if (rank <= 10) {
    return 'Layer 1';
  }
  if (rank <= 50) {
    return 'DeFi';
  }
  
  return 'Altcoin';
}

function getNodeColor(change24h: number, change7d: number): string {
  if (Math.abs(change24h) > 15 || Math.abs(change7d) > 30) {
    return '#eab308'; // Yellow for high volatility
  }
  if (change24h > 3) {
    return '#22c55e'; // Green for growth
  }
  if (change24h < -3) {
    return '#ef4444'; // Red for decline
  }
  return '#6b7280'; // Gray for stable
}