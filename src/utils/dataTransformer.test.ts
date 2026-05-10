import { describe, it, expect } from 'vitest';
import { transformCoinDataToNodes } from './dataTransformer';
import { CoinMarketData, ExchangeData } from '../services/coinGeckoApi';

describe('dataTransformer', () => {
  describe('transformCoinDataToNodes', () => {
    it('should correctly transform coin data into nodes', () => {
      const mockCoinData: CoinMarketData[] = [{
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000,
        market_cap_rank: 1,
        price_change_percentage_24h: 5.5,
        price_change_percentage_7d_in_currency: 10,
        total_volume: 50000000,
        circulating_supply: 19000000
      }];

      const nodes = transformCoinDataToNodes(mockCoinData);

      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        category: 'Layer 1',
        currentPrice: 50000,
        change24h: 5.5,
        color: '#22c55e' // Green for growth
      });
    });

    it('should correctly transform exchange data into nodes', () => {
      const mockExchangeData: ExchangeData[] = [{
        id: 'binance',
        name: 'Binance',
        trade_volume_24h_btc: 1000,
        trust_score: 10,
        trust_score_rank: 1
      }];

      const nodes = transformCoinDataToNodes([], mockExchangeData);

      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({
        id: 'binance',
        name: 'Binance',
        category: 'Exchange',
        totalVolume: 1000 * 50000
      });
    });

    it('should assign correct colors based on price changes', () => {
      const createCoin = (change: number): CoinMarketData => ({
        id: `coin-${change}`,
        symbol: 'sym',
        name: 'Name',
        current_price: 1,
        market_cap: 1000,
        market_cap_rank: 100,
        price_change_percentage_24h: change,
        price_change_percentage_7d_in_currency: 0,
        total_volume: 100,
        circulating_supply: 100
      });

      const greenNode = transformCoinDataToNodes([createCoin(5)])[0];
      const redNode = transformCoinDataToNodes([createCoin(-5)])[0];
      const grayNode = transformCoinDataToNodes([createCoin(0)])[0];
      const yellowNode = transformCoinDataToNodes([createCoin(25)])[0];

      expect(greenNode.color).toBe('#22c55e');
      expect(redNode.color).toBe('#ef4444');
      expect(grayNode.color).toBe('#6b7280');
      expect(yellowNode.color).toBe('#eab308');
    });
  });
});
