import { Node, Connection } from '../types';
import { CoinMarketData, ExchangeData } from '../services/coinGeckoApi';
import { calculateNodeSize, getNodeColor, generateParticles } from './visuals';
import { applyForceDirectedLayout } from './collisionDetection';

export interface ViewportConfig {
  width: number;
  height: number;
  padding: number;
}

export function getResponsiveViewport(width: number, height: number): ViewportConfig {
  const safeWidth = Math.max(320, Math.min(1920, Math.floor(width || 800)));
  const safeHeight = Math.max(320, Math.min(1400, Math.floor(height || 600)));
  const isMobile = safeWidth <= 640;
  const padding = isMobile ? 24 : 50;

  return {
    width: safeWidth,
    height: safeHeight,
    padding
  };
}

function generateConcentricPositions(
  count: number,
  viewport: ViewportConfig
): Array<{ x: number; y: number }> {
  if (count === 0) return [];

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const maxRadius = Math.max(70, Math.min(viewport.width, viewport.height) / 2 - viewport.padding);
  const ringGap = Math.max(40, Math.min(84, maxRadius / 3));
  const innerRadius = Math.max(50, ringGap * 0.9);
  const positions: Array<{ x: number; y: number }> = [];

  let ring = 0;
  let placed = 0;
  while (placed < count) {
    const radius = Math.min(maxRadius, innerRadius + ring * ringGap);
    const itemsInRing = ring === 0 ? 1 : Math.max(6, Math.floor((2 * Math.PI * radius) / Math.max(36, ringGap * 0.9)));

    for (let i = 0; i < itemsInRing && placed < count; i++) {
      const angle = (i / itemsInRing) * Math.PI * 2;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
      placed++;
    }
    ring++;
  }

  return positions;
}

export function adaptNodesToViewport(
  nodes: Node[],
  width: number,
  height: number
): Node[] {
  if (nodes.length === 0) return nodes;

  const viewport = getResponsiveViewport(width, height);
  const positions = generateConcentricPositions(nodes.length, viewport);

  const resized = nodes.map((node, index) => ({
    ...node,
    x: positions[index]?.x ?? viewport.width / 2,
    y: positions[index]?.y ?? viewport.height / 2,
    size: calculateNodeSize(node.liquidity, viewport.width, Boolean(node.isHub))
  }));

  return applyForceDirectedLayout(resized, viewport, {
    minDistance: viewport.width <= 640 ? 10 : 14,
    repulsionStrength: viewport.width <= 640 ? 1.1 : 0.9,
    centerAttraction: 0.025
  });
}

export function transformCoinDataToNodes(
  coinData: CoinMarketData[], 
  exchangeData: ExchangeData[] = [],
  viewport: ViewportConfig = getResponsiveViewport(800, 600)
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

  const positions = generateConcentricPositions(allData.length, viewport);

  const mappedNodes = allData.map((item, index) => {
    
    // Calculate liquidity based on market cap and volume with safety checks
    const marketCap = item.market_cap || 0;
    const totalVolume = item.total_volume || 0;
    const liquidity = item.type === 'coin' 
      ? marketCap + totalVolume
      : item.volume || 0;
    
    // Determine category
    const category = item.type === 'exchange' 
      ? 'CEX'
      : getCoinCategory(item.name || 'Unknown', item.symbol || '', item.market_cap_rank || 999);

    return {
      id: item.id || `unknown-${index}`,
      name: item.name || 'Unknown Asset',
      category,
      price: item.current_price || 0,
      liquidity,
      change24h: item.price_change_percentage_24h ?? 0,
      change7d: item.price_change_percentage_7d_in_currency ?? 0,
      x: positions[index]?.x ?? viewport.width / 2,
      y: positions[index]?.y ?? viewport.height / 2,
      size: calculateNodeSize(liquidity, viewport.width, false),
      color: getNodeColor(
        item.price_change_percentage_24h ?? 0,
        item.price_change_percentage_7d_in_currency ?? 0
      ),
      isSelected: false,
      lastUpdated: Date.now(),
      sparkline: item.type === 'coin' ? item.sparkline_in_7d?.price : undefined
    };
  });

  return applyForceDirectedLayout(mappedNodes, viewport, {
    minDistance: viewport.width <= 640 ? 10 : 14,
    repulsionStrength: viewport.width <= 640 ? 1.1 : 0.9,
    centerAttraction: 0.02
  });
}

function getDeterministicFloat(str1: string, str2: string = ''): number {
  const combined = str1 + '|' + str2;
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  const unsignedHash = (hash >>> 0);
  return (unsignedHash % 100000) / 100000;
}

export function generateConnectionsFromRealData(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const connectionSet = new Set<string>();

  const addConnection = (c: Connection) => {
    connections.push(c);
    connectionSet.add(`${c.source}-${c.target}`);
    connectionSet.add(`${c.target}-${c.source}`);
  };

  // Create connections based on market relationships
  const cexs = nodes.filter(n => n.category === 'CEX');
  const top10 = nodes.filter(n => n.category === 'Top 10');
  const amms = nodes.filter(n => n.category === 'AMM / DEX' || n.category === 'Protocols / Altcoins');

  // Connect centralized exchanges to Top 10 coins
  cexs.forEach(cex => {
    top10.slice(0, 3).forEach(coin => {
      // Deterministic 70% chance of connection
      if (getDeterministicFloat(cex.id, coin.id) > 0.3) {
        addConnection(createConnection(cex, coin));
      }
    });
  });

  // Connect AMMs/Protocols to Top 10 coins deterministically
  amms.forEach(amm => {
    if (top10.length > 0) {
      const idx = Math.floor(getDeterministicFloat(amm.id) * top10.length);
      const chosenTop10 = top10[idx];
      if (chosenTop10) {
        addConnection(createConnection(amm, chosenTop10));
      }
    }
  });

  // Add deterministic connections for network effect across categories
  const extraConnections: Connection[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const source = nodes[i];
      const target = nodes[j];

      // Ensure cross-category flows for diverse ecosystem mapping
      if (source.category === target.category) continue;

      const hashVal = getDeterministicFloat(source.id, target.id);
      if (hashVal > 0.88) { // select top ~12% deterministic node pairs
        if (!connectionSet.has(`${source.id}-${target.id}`)) {
          extraConnections.push(createConnection(source, target));
        }
      }
    }
  }
  
  // Sort extra connections deterministically and add top 12 to maintain perfect density
  extraConnections.sort((a, b) => b.flow - a.flow);
  connections.push(...extraConnections.slice(0, 12));

  return connections;
}

function createConnection(source: Node, target: Node): Connection {
  const hashFactor = getDeterministicFloat(source.id, target.id);
  const flow = Math.min(source.liquidity, target.liquidity) * (0.1 + hashFactor * 0.3);
  
  return {
    id: `${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    flow,
    direction: source.liquidity > target.liquidity ? 'out' : 'in',
    particles: generateParticles(Math.min(5, Math.max(1, Math.floor(flow / 50000000))))
  };
}

function getCoinCategory(name: string, symbol: string, rank: number): string {
  const name_lower = name.toLowerCase();
  const sym_lower = symbol.toLowerCase();
  
  // 1. Stablecoins
  const isStable = [
    'usdt', 'usdc', 'dai', 'fdusd', 'usde', 'usds', 'tusd', 'busd', 'ust', 'mim', 'frax'
  ].includes(sym_lower) || name_lower.includes('tether') || name_lower.includes('usd coin') || name_lower.includes('stablecoin') || name_lower.includes('dollar');

  if (isStable) {
    return 'Stablecoins';
  }

  // 2. Top 10
  if (rank <= 10) {
    return 'Top 10';
  }

  // 3. AMM / DEX
  const isAMM = name_lower.includes('uniswap') || name_lower.includes('curve') ||
                name_lower.includes('pancake') || name_lower.includes('sushi') ||
                name_lower.includes('balancer') || name_lower.includes('bancor') ||
                name_lower.includes('thorchain') || sym_lower === 'uni' || sym_lower === 'cake' || sym_lower === 'crv';
  if (isAMM) {
    return 'AMM / DEX';
  }

  // 4. Protocols / Altcoins
  return 'Protocols / Altcoins';
}
