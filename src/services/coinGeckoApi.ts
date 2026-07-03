const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const BASE_URL = import.meta.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  circulating_supply: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface ExchangeData {
  id: string;
  name: string;
  trade_volume_24h_btc: number;
  trust_score: number;
  trust_score_rank: number;
}

interface GlobalMarketData {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface NFTMarketData {
  id: string;
  contract_address: string;
  asset_platform_id: string;
  name: string;
  symbol: string;
  image: {
    small: string;
  };
  floor_price: {
    native_currency: number;
    usd: number;
  };
  market_cap: {
    native_currency: number;
    usd: number;
  };
  volume_24h: {
    native_currency: number;
    usd: number;
  };
  floor_price_in_usd_24h_percentage_change: number;
}

class CoinGeckoApiService {
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!BASE_URL) {
      throw new Error('CoinGecko API base URL is not configured. Please check your environment variables.');
    }

    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add API key to params if available
    if (API_KEY) {
      params.x_cg_demo_api_key = API_KEY;
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        throw new Error('CoinGecko API rate limit exceeded. Please try again later or use an API key.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to CoinGecko API. Please check your internet connection.');
      }
      console.error('CoinGecko API Error:', error);
      throw error;
    }
  }

  async getTopCoins(limit: number = 20): Promise<CoinMarketData[]> {
    return this.makeRequest<CoinMarketData[]>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'true',
      price_change_percentage: '24h,7d'
    });
  }

  async getExchanges(limit: number = 10): Promise<ExchangeData[]> {
    return this.makeRequest<ExchangeData[]>('/exchanges', {
      per_page: limit.toString(),
      page: '1'
    });
  }

  async getGlobalMarketData(): Promise<GlobalMarketData> {
    return this.makeRequest<GlobalMarketData>('/global');
  }

  async getCoinHistory(coinId: string, days: number = 7): Promise<MarketChartData> {
    return this.makeRequest<MarketChartData>(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: 'daily'
    });
  }

  async getNFTMarkets(limit: number = 20): Promise<NFTMarketData[]> {
    return this.makeRequest<NFTMarketData[]>('/nfts/markets', {
      order: 'market_cap_usd_desc',
      per_page: limit.toString(),
      page: '1'
    });
  }
}

export const coinGeckoApi = new CoinGeckoApiService();
export type { CoinMarketData, ExchangeData, GlobalMarketData, NFTMarketData };