import { Node, Connection } from '../types';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface UniswapToken {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  derivedETH?: string;
}

export interface UniswapPool {
  id: string;
  token0: UniswapToken;
  token1: UniswapToken;
  feeTier: string;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  token0Price: string;
  token1Price: string;
}

export interface AaveReserve {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  liquidityRate: string;
  variableBorrowRate: string;
  totalATokenSupply: string;
  totalCurrentVariableDebt: string;
  availableLiquidity: string;
}

export interface SubgraphWLConfig {
  id: string;
  name: string;
  endpointUrl: string;
  category: 'Uniswap' | 'Aave' | 'Curve' | 'Custom';
  enabled: boolean;
}

export const DEFAULT_SUBGRAPH_WL: SubgraphWLConfig[] = [
  {
    id: 'uniswap-v3-mainnet',
    name: 'Uniswap V3 Mainnet Subgraph',
    endpointUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    category: 'Uniswap',
    enabled: true
  },
  {
    id: 'aave-v3-mainnet',
    name: 'Aave V3 Mainnet Subgraph',
    endpointUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    category: 'Aave',
    enabled: true
  },
  {
    id: 'curve-mainnet',
    name: 'Curve Pools Subgraph',
    endpointUrl: 'https://api.thegraph.com/subgraphs/name/convex-community/volume-mainnet',
    category: 'Curve',
    enabled: true
  }
];

class GraphApiService {
  private watchlist: SubgraphWLConfig[] = [...DEFAULT_SUBGRAPH_WL];

  /**
   * Executes a raw GraphQL query against any subgraph endpoint URL
   */
  async query<T>(endpointUrl: string, queryStr: string, variables: Record<string, unknown> = {}): Promise<T> {
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: queryStr,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL query failed with status ${response.status}: ${response.statusText}`);
      }

      const json: GraphQLResponse<T> = await response.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`);
      }

      if (!json.data) {
        throw new Error('GraphQL returned no data');
      }

      return json.data;
    } catch (error) {
      console.warn(`[GraphApiService] Error querying ${endpointUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get Uniswap v3 top pools by TVL
   */
  async getUniswapTopPools(limit: number = 10, endpointUrl = DEFAULT_SUBGRAPH_WL[0].endpointUrl): Promise<UniswapPool[]> {
    const queryStr = `
      query GetTopPools($limit: Int!) {
        pools(first: $limit, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          feeTier
          liquidity
          totalValueLockedUSD
          volumeUSD
          token0Price
          token1Price
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
      }
    `;

    try {
      const data = await this.query<{ pools: UniswapPool[] }>(endpointUrl, queryStr, { limit });
      return data.pools;
    } catch (error) {
      console.warn('Falling back to mock Uniswap subgraph pools:', error);
      return this.getMockUniswapPools(limit);
    }
  }

  /**
   * Get Aave v3 reserves (lending/borrowing pools)
   */
  async getAaveReserves(limit: number = 10, endpointUrl = DEFAULT_SUBGRAPH_WL[1].endpointUrl): Promise<AaveReserve[]> {
    const queryStr = `
      query GetReserves($limit: Int!) {
        reserves(first: $limit, orderBy: totalATokenSupply, orderDirection: desc) {
          id
          symbol
          name
          decimals
          liquidityRate
          variableBorrowRate
          totalATokenSupply
          totalCurrentVariableDebt
          availableLiquidity
        }
      }
    `;

    try {
      const data = await this.query<{ reserves: AaveReserve[] }>(endpointUrl, queryStr, { limit });
      return data.reserves;
    } catch (error) {
      console.warn('Falling back to mock Aave subgraph reserves:', error);
      return this.getMockAaveReserves(limit);
    }
  }

  /**
   * Transforms GraphQL DeFi pool/reserve data into BlotChain Node and Connection models
   */
  async getDeFiGraphNodesAndConnections(): Promise<{ nodes: Node[]; connections: Connection[] }> {
    const pools = await this.getUniswapTopPools(10);
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    // Map top pool tokens into BlotChain nodes
    pools.forEach((pool, index) => {
      const tvl = parseFloat(pool.totalValueLockedUSD) || 1000000;
      const angle = (index / pools.length) * 2 * Math.PI;
      const radius = 250;

      const node: Node = {
        id: `uniswap-pool-${pool.id.slice(0, 8)}`,
        name: `${pool.token0.symbol}/${pool.token1.symbol}`,
        category: 'AMM / DEX',
        price: parseFloat(pool.token0Price) || 1.0,
        liquidity: tvl,
        change24h: Math.sin(index) * 3.5,
        change7d: Math.cos(index) * 5.2,
        x: Math.round(400 + radius * Math.cos(angle)),
        y: Math.round(300 + radius * Math.sin(angle)),
        size: Math.min(65, Math.max(28, Math.sqrt(tvl / 1000000) * 4)),
        color: '#10B981', // emerald theme for DEX
        isSelected: false,
        lastUpdated: Date.now(),
        volume24h: parseFloat(pool.volumeUSD) || 500000,
        sparkline: [tvl * 0.95, tvl * 0.98, tvl, tvl * 1.02, tvl * 1.01]
      };
      nodes.push(node);
    });

    // Generate flow connections between related DEX pools
    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        id: `graphql-flow-${nodes[i].id}-${nodes[i + 1].id}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        flow: Math.round((nodes[i].liquidity + nodes[i + 1].liquidity) / 20000),
        direction: 'out',
        particles: []
      });
    }

    return { nodes, connections };
  }

  /**
   * Manage Watchlist (WL) subgraphs
   */
  getWatchlist(): SubgraphWLConfig[] {
    return this.watchlist;
  }

  addWatchlistSubgraph(config: SubgraphWLConfig): void {
    this.watchlist.push(config);
  }

  private getMockUniswapPools(limit: number): UniswapPool[] {
    return [
      {
        id: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        feeTier: '500',
        liquidity: '185000000',
        totalValueLockedUSD: '240000000',
        volumeUSD: '150000000',
        token0Price: '0.0003',
        token1Price: '3200',
        token0: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
        token1: { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: '6' }
      },
      {
        id: '0xcbc350c016b41357649c1447f54845d69670609a',
        feeTier: '3000',
        liquidity: '95000000',
        totalValueLockedUSD: '110000000',
        volumeUSD: '45000000',
        token0Price: '0.052',
        token1Price: '19.2',
        token0: { id: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: '8' },
        token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' }
      }
    ].slice(0, limit);
  }

  private getMockAaveReserves(limit: number): AaveReserve[] {
    return [
      {
        id: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        symbol: 'AAVE',
        name: 'Aave Token',
        decimals: 18,
        liquidityRate: '0.035',
        variableBorrowRate: '0.062',
        totalATokenSupply: '450000000',
        totalCurrentVariableDebt: '120000000',
        availableLiquidity: '330000000'
      }
    ].slice(0, limit);
  }
}

export const graphApiService = new GraphApiService();
