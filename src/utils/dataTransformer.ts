import { Node, Connection } from '../types';
import { CoinMarketData, ExchangeData, NFTMarketData } from '../services/coinGeckoApi';
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
  const isPortrait = safeHeight > safeWidth;
  const padding = isMobile ? (isPortrait ? 72 : 52) : 60;

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
      ? 'Exchange'
      : getCoinCategory(item.name || 'Unknown', item.market_cap_rank || 999);

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
      sparkline: item.sparkline_in_7d?.price
    };
  });

  return applyForceDirectedLayout(mappedNodes, viewport, {
    minDistance: viewport.width <= 640 ? 10 : 14,
    repulsionStrength: viewport.width <= 640 ? 1.1 : 0.9,
    centerAttraction: 0.02
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

export function transformNFTDataToNodes(
  nftData: NFTMarketData[],
  viewport: ViewportConfig = getResponsiveViewport(800, 600)
): Node[] {
  const nodes: Node[] = [];
  const platforms = Array.from(new Set(nftData.map(nft => nft.asset_platform_id)));

  // Create platform hub nodes
  const platformHubs: Record<string, Node> = {};
  const hubPositions = generateConcentricPositions(Math.max(platforms.length, 1), {
    ...viewport,
    padding: viewport.padding + 20
  });
  platforms.forEach((platform, index) => {
    const hubNode: Node = {
      id: `hub-${platform}`,
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      category: 'Blockchain',
      price: 0,
      liquidity: 0,
      change24h: 0,
      change7d: 0,
      x: hubPositions[index]?.x ?? viewport.width / 2,
      y: hubPositions[index]?.y ?? viewport.height / 2,
      size: calculateNodeSize(0, viewport.width, true),
      color: '#3b82f6',
      isSelected: false,
      lastUpdated: Date.now(),
      isHub: true
    };
    platformHubs[platform] = hubNode;
    nodes.push(hubNode);
  });

  // Create NFT collection nodes
  nftData.forEach((nft) => {
    const hub = platformHubs[nft.asset_platform_id];
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.max(55, Math.min(140, Math.min(viewport.width, viewport.height) * 0.18));

    nodes.push({
      id: nft.id,
      name: nft.name,
      category: nft.asset_platform_id,
      price: nft.floor_price.usd,
      liquidity: nft.market_cap.usd,
      change24h: nft.floor_price_in_usd_24h_percentage_change,
      change7d: 0, // Not available in simple market data
      x: hub.x + Math.cos(angle) * distance,
      y: hub.y + Math.sin(angle) * distance,
      size: calculateNodeSize(nft.market_cap.usd, viewport.width, false),
      color: getNodeColor(nft.floor_price_in_usd_24h_percentage_change, 0),
      isSelected: false,
      lastUpdated: Date.now(),
      volume24h: nft.volume_24h.usd,
      image: nft.image.small
    });
  });

  return applyForceDirectedLayout(nodes, viewport, {
    minDistance: viewport.width <= 640 ? 10 : 14,
    repulsionStrength: viewport.width <= 640 ? 1.15 : 0.9,
    centerAttraction: 0.02
  });
}

export function generateNFTConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const hubs = nodes.filter(n => n.isHub);
  const collections = nodes.filter(n => !n.isHub);

  collections.forEach(collection => {
    const hub = hubs.find(h => h.id === `hub-${collection.category}`);
    if (hub) {
      connections.push({
        id: `${hub.id}-${collection.id}`,
        source: hub.id,
        target: collection.id,
        flow: collection.volume24h || 0,
        direction: 'out',
        particles: generateParticles(Math.min(5, Math.max(1, Math.floor((collection.volume24h || 0) / 100000))))
      });
    }
  });

  return connections;
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
