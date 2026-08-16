import fs from 'fs';
import path from 'path';
import { PinataSDK } from 'pinata';

/**
 * Note: In production with higher volume, snapshot counting should move from
 * a local JSON counter file to a small KV store or database (e.g. Redis, DynamoDB, PostgreSQL).
 */
const COUNTER_FILE_PATH = path.join(process.cwd(), 'automation/bot/snapshot-counter.json');

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

export interface GlobalMarketData {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export interface OpenSeaAttribute {
  trait_type: string;
  value: string | number;
}

export interface OpenSeaMetadata {
  name: string;
  description: string;
  image: string;
  attributes: OpenSeaAttribute[];
}

// 30s-TTL Cache for CoinGecko API calls
class CoinGeckoServerService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const baseUrl = process.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
    const apiKey = process.env.VITE_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;

    const normalizedUrlStr = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
    const url = new URL(normalizedUrlStr);

    const isPro = baseUrl.includes('pro-api.coingecko.com');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (apiKey) {
      if (isPro) {
        params.x_cg_pro_api_key = apiKey;
        headers['x-cg-pro-api-key'] = apiKey;
      } else {
        params.x_cg_demo_api_key = apiKey;
        headers['x-cg-demo-api-key'] = apiKey;
      }
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    const response = await fetch(url.toString(), { headers });

    if (response.status === 429) {
      if (cached) return cached.data as T;
      throw new Error('CoinGecko API rate limit exceeded.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}${
          errorData.error ? ` - ${errorData.error}` : ''
        }`
      );
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  }

  async getTopCoins(limit: number = 3): Promise<CoinMarketData[]> {
    return this.makeRequest<CoinMarketData[]>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'false',
    });
  }

  async getGlobalMarketData(): Promise<GlobalMarketData> {
    return this.makeRequest<GlobalMarketData>('/global');
  }
}

export const coinGeckoServerApi = new CoinGeckoServerService();

export function getNextSnapshotNumber(): number {
  let counterPath = COUNTER_FILE_PATH;
  // If running from automation/bot directly or root
  if (!fs.existsSync(counterPath) && fs.existsSync(path.join(process.cwd(), 'snapshot-counter.json'))) {
    counterPath = path.join(process.cwd(), 'snapshot-counter.json');
  }

  let count = 0;
  if (fs.existsSync(counterPath)) {
    try {
      const raw = fs.readFileSync(counterPath, 'utf-8');
      const data = JSON.parse(raw);
      count = typeof data.count === 'number' ? data.count : 0;
    } catch {
      count = 0;
    }
  }

  count += 1;
  const dir = path.dirname(counterPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(counterPath, JSON.stringify({ count }, null, 2), 'utf-8');
  return count;
}

export function formatTotalMarketCapUSD(numUSD?: number): string {
  if (numUSD === undefined || numUSD === null || isNaN(numUSD)) {
    return 'N/A';
  }
  if (numUSD >= 1e12) {
    return `$${(numUSD / 1e12).toFixed(2)}T`;
  }
  if (numUSD >= 1e9) {
    return `$${(numUSD / 1e9).toFixed(2)}B`;
  }
  if (numUSD >= 1e6) {
    return `$${(numUSD / 1e6).toFixed(2)}M`;
  }
  return `$${numUSD.toLocaleString()}`;
}

export function determineMarketTrend(changePercentage24h?: number): 'Bullish' | 'Bearish' | 'Neutral' {
  if (changePercentage24h === undefined || changePercentage24h === null || isNaN(changePercentage24h)) {
    return 'Neutral';
  }
  if (changePercentage24h > 0.1) return 'Bullish';
  if (changePercentage24h < -0.1) return 'Bearish';
  return 'Neutral';
}

export function formatUtcDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export async function buildAndUploadSnapshotMetadata(imageBuffer: Buffer): Promise<{
  tokenUri: string;
  imageCid: string;
  metadataCid: string;
  metadata: OpenSeaMetadata;
  snapshotNumber: number;
}> {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataGateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

  if (!pinataJwt) {
    throw new Error('PINATA_JWT environment variable is missing.');
  }

  const pinata = new PinataSDK({
    pinataJwt,
    pinataGateway,
  });

  // 1. Fetch real market data from CoinGecko
  const [globalData, topCoins] = await Promise.all([
    coinGeckoServerApi.getGlobalMarketData().catch(() => null),
    coinGeckoServerApi.getTopCoins(3).catch(() => []),
  ]);

  const totalCapUSD = globalData?.data?.total_market_cap?.usd;
  const formattedCap = formatTotalMarketCapUSD(totalCapUSD);
  const trendPercent = globalData?.data?.market_cap_change_percentage_24h_usd;
  const marketTrend = determineMarketTrend(trendPercent);

  // 2. Upload image Buffer to Pinata using public file upload
  const arrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer;
  const file = new File([arrayBuffer], 'snapshot.png', { type: 'image/png' });
  const imageUploadResult = await pinata.upload.public.file(file);
  const imageCid = imageUploadResult.cid;

  // 3. Increment snapshot counter and construct metadata
  const snapshotNumber = getNextSnapshotNumber();
  const nowUtc = formatUtcDateTime();

  const attributes: OpenSeaAttribute[] = [
    { trait_type: 'Total Market Cap', value: formattedCap },
    { trait_type: 'Market Trend', value: marketTrend },
  ];

  topCoins.slice(0, 3).forEach((coin, idx) => {
    attributes.push({
      trait_type: `Top Coin #${idx + 1}`,
      value: `${coin.name} (${coin.symbol.toUpperCase()})`,
    });
  });

  const metadata: OpenSeaMetadata = {
    name: `BlotChain Snapshot #${snapshotNumber} — ${nowUtc}`,
    description: 'A live snapshot of cryptocurrency liquidity flows captured from the BlotChain dashboard.',
    image: `ipfs://${imageCid}`,
    attributes,
  };

  // 4. Upload metadata JSON to Pinata
  const jsonUploadResult = await pinata.upload.public.json(metadata);
  const metadataCid = jsonUploadResult.cid;
  const tokenUri = `ipfs://${metadataCid}`;

  return {
    tokenUri,
    imageCid,
    metadataCid,
    metadata,
    snapshotNumber,
  };
}
