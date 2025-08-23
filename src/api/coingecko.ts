import { Coin, MarketData } from '../types';

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

export const fetchCoins = async (): Promise<Coin[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/coins/list`);
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
    const response = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}`);
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
