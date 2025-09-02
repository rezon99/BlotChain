const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const BASE_URL = import.meta.env.VITE_COINGECKO_BASE_URL;

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
  };
}

class CoinGeckoApiService {
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add API key to params
    params.x_cg_demo_api_key = API_KEY;
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
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
      sparkline: 'false',
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

  async getCoinHistory(coinId: string, days: number = 7): Promise<any> {
    return this.makeRequest(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: 'daily'
    });
  }
}

export const coinGeckoApi = new CoinGeckoApiService();
export type { CoinMarketData, ExchangeData, GlobalMarketData };