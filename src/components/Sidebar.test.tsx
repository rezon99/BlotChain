import { render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { Node } from '../types';
import { coinGeckoApi } from '../services/coinGeckoApi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/coinGeckoApi', () => ({
  coinGeckoApi: {
    getCoinHistory: vi.fn(),
  },
}));

describe('Sidebar', () => {
  const mockHistory = {
    prices: Array.from({ length: 7 }, (_, i) => [i, 50000 + i * 100]),
  };

  const mockNode: Node = {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'Layer 1',
    liquidity: 1000000,
    marketCap: 800000,
    totalVolume: 200000,
    currentPrice: 50000,
    change24h: 2.5,
    change7d: 5.0,
    x: 0,
    y: 0,
    size: 50,
    color: 'green',
    isSelected: true,
    lastUpdated: Date.now(),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (coinGeckoApi.getCoinHistory as any).mockResolvedValue(mockHistory);
  });

  it('renders node information correctly', async () => {
    render(<Sidebar node={mockNode} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('2.50%')).toBeInTheDocument();
    expect(screen.getByText('$800K')).toBeInTheDocument();
    expect(screen.getByText('$200K')).toBeInTheDocument();
  });

  it('fetches and displays price history for coins', async () => {
    (coinGeckoApi.getCoinHistory as any).mockResolvedValueOnce({
      prices: [[123, 49000], [124, 50000]],
    });

    render(<Sidebar node={mockNode} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(coinGeckoApi.getCoinHistory).toHaveBeenCalledWith('bitcoin', 7);
    });
  });

  it('shows "History unavailable" for exchanges', () => {
    const exchangeNode = { ...mockNode, category: 'Exchange' };
    render(<Sidebar node={exchangeNode} onClose={mockOnClose} />);

    expect(screen.getByText('History unavailable for exchanges')).toBeInTheDocument();
    expect(coinGeckoApi.getCoinHistory).not.toHaveBeenCalled();
  });
});
