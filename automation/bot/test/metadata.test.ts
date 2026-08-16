import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ESM Mocks via jest.unstable_mockModule
const mockFilePublicUpload = jest.fn<() => Promise<{ cid: string }>>();
const mockJsonPublicUpload = jest.fn<() => Promise<{ cid: string }>>();

jest.unstable_mockModule('pinata', () => ({
  PinataSDK: jest.fn().mockImplementation(() => ({
    upload: {
      public: {
        file: mockFilePublicUpload,
        json: mockJsonPublicUpload,
      },
    },
  })),
}));

const {
  formatTotalMarketCapUSD,
  determineMarketTrend,
  getNextSnapshotNumber,
  formatUtcDateTime,
  buildAndUploadSnapshotMetadata,
  coinGeckoServerApi,
} = await import('../src/metadata.js');

describe('metadata module unit tests', () => {
  const counterFilePath = path.join(process.cwd(), 'automation/bot/snapshot-counter.json');
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.PINATA_JWT = 'test-jwt';
    process.env.PINATA_GATEWAY = 'gateway.pinata.cloud';

    // Reset mocks
    mockFilePublicUpload.mockReset();
    mockJsonPublicUpload.mockReset();

    mockFilePublicUpload.mockResolvedValue({ cid: 'QmImageTestCid123' });
    mockJsonPublicUpload.mockResolvedValue({ cid: 'QmMetadataTestCid456' });

    // Clean up counter file if present
    if (fs.existsSync(counterFilePath)) {
      fs.unlinkSync(counterFilePath);
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    if (fs.existsSync(counterFilePath)) {
      fs.unlinkSync(counterFilePath);
    }
  });

  describe('utility functions', () => {
    it('formatTotalMarketCapUSD formats numbers correctly', () => {
      expect(formatTotalMarketCapUSD(2.5e12)).toBe('$2.50T');
      expect(formatTotalMarketCapUSD(1.23e9)).toBe('$1.23B');
      expect(formatTotalMarketCapUSD(450e6)).toBe('$450.00M');
      expect(formatTotalMarketCapUSD(1000)).toBe('$1,000');
      expect(formatTotalMarketCapUSD(undefined)).toBe('N/A');
    });

    it('determineMarketTrend categorizes change percentages correctly', () => {
      expect(determineMarketTrend(2.5)).toBe('Bullish');
      expect(determineMarketTrend(-1.5)).toBe('Bearish');
      expect(determineMarketTrend(0.05)).toBe('Neutral');
      expect(determineMarketTrend(-0.05)).toBe('Neutral');
      expect(determineMarketTrend(undefined)).toBe('Neutral');
    });

    it('formatUtcDateTime returns UTC string formatted as YYYY-MM-DD HH:mm:ss UTC', () => {
      const fixedDate = new Date('2025-05-10T14:30:15Z');
      expect(formatUtcDateTime(fixedDate)).toBe('2025-05-10 14:30:15 UTC');
    });

    it('getNextSnapshotNumber increments counter properly across calls', () => {
      expect(getNextSnapshotNumber()).toBe(1);
      expect(getNextSnapshotNumber()).toBe(2);
      expect(getNextSnapshotNumber()).toBe(3);

      const raw = fs.readFileSync(counterFilePath, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.count).toBe(3);
    });
  });

  describe('buildAndUploadSnapshotMetadata', () => {
    it('fetches market data, uploads image and JSON to Pinata, and constructs OpenSea metadata', async () => {
      const mockGlobalData = {
        data: {
          total_market_cap: { usd: 2_650_000_000_000 },
          total_volume: { usd: 100_000_000_000 },
          market_cap_percentage: { btc: 55, eth: 15 },
          market_cap_change_percentage_24h_usd: 3.4,
          updated_at: 1700000000,
        },
      };

      const mockTopCoins = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 95000,
          market_cap: 1_800_000_000_000,
          market_cap_rank: 1,
          price_change_percentage_24h: 2.1,
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3500,
          market_cap: 420_000_000_000,
          market_cap_rank: 2,
          price_change_percentage_24h: 4.5,
        },
        {
          id: 'tether',
          symbol: 'usdt',
          name: 'Tether',
          current_price: 1,
          market_cap: 120_000_000_000,
          market_cap_rank: 3,
          price_change_percentage_24h: 0.01,
        },
      ];

      jest.spyOn(coinGeckoServerApi, 'getGlobalMarketData').mockResolvedValue(mockGlobalData);
      jest.spyOn(coinGeckoServerApi, 'getTopCoins').mockResolvedValue(mockTopCoins);

      const dummyBuffer = Buffer.from('fake-png-data');
      const result = await buildAndUploadSnapshotMetadata(dummyBuffer);

      expect(result.snapshotNumber).toBe(1);
      expect(result.imageCid).toBe('QmImageTestCid123');
      expect(result.metadataCid).toBe('QmMetadataTestCid456');
      expect(result.tokenUri).toBe('ipfs://QmMetadataTestCid456');

      expect(mockFilePublicUpload).toHaveBeenCalledTimes(1);
      expect(mockJsonPublicUpload).toHaveBeenCalledTimes(1);

      const metadata = result.metadata;
      expect(metadata.name).toMatch(/^BlotChain Snapshot #1 — \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/);
      expect(metadata.description).toBe(
        'A live snapshot of cryptocurrency liquidity flows captured from the BlotChain dashboard.'
      );
      expect(metadata.image).toBe('ipfs://QmImageTestCid123');

      expect(metadata.attributes).toEqual([
        { trait_type: 'Total Market Cap', value: '$2.65T' },
        { trait_type: 'Market Trend', value: 'Bullish' },
        { trait_type: 'Top Coin #1', value: 'Bitcoin (BTC)' },
        { trait_type: 'Top Coin #2', value: 'Ethereum (ETH)' },
        { trait_type: 'Top Coin #3', value: 'Tether (USDT)' },
      ]);
    });

    it('throws error if PINATA_JWT is missing', async () => {
      delete process.env.PINATA_JWT;
      const dummyBuffer = Buffer.from('fake');

      await expect(buildAndUploadSnapshotMetadata(dummyBuffer)).rejects.toThrow(
        'PINATA_JWT environment variable is missing.'
      );
    });
  });
});
