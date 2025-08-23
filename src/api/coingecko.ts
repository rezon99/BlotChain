import { Coin, MarketData } from '../types';

const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const API_BASE_URL = API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';

const addApiKeyToUrl = (url: string): string => {
  if (API_KEY) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}x_cg_pro_api_key=${API_KEY}`;
  }
  return url;
};

export const fetchCoins = async (): Promise<Coin[]> => {
  try {
    const url = addApiKeyToUrl(`${API_BASE_URL}/coins/list`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching coins: ${response.statusText}`);
    }
    const data: Coin[] = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchMarketData = async (coinIds: string[]): Promise<MarketData[]> => {
  if (coinIds.length === 0) {
    return [];
  }

  const ids = coinIds.join(',');
  try {
    const url = addApiKeyToUrl(`${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching market data: ${response.statusText}`);
    }
    const data: MarketData[] = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
