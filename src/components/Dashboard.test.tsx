import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../hooks/useRealTimeData', () => ({
  useRealTimeData: vi.fn(),
}));

describe('Dashboard', () => {
  const mockNodes = [
    { id: 'bitcoin', name: 'Bitcoin', category: 'Layer 1', x: 100, y: 100, size: 20, color: 'red' },
    { id: 'ethereum', name: 'Ethereum', category: 'Layer 1', x: 200, y: 200, size: 20, color: 'blue' },
    { id: 'uniswap', name: 'Uniswap', category: 'DeFi', x: 300, y: 300, size: 20, color: 'pink' },
  ];

  const mockConnections = [];

  beforeEach(() => {
    (useRealTimeData as any).mockReturnValue({
      nodes: mockNodes,
      connections: mockConnections,
      loading: false,
      error: null,
      lastUpdate: new Date(),
      refetch: vi.fn(),
    });
  });

  it('filters nodes based on search query', () => {
    render(<Dashboard />);

    const searchInput = screen.getByPlaceholderText('Search assets...');
    fireEvent.change(searchInput, { target: { value: 'bit' } });

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  it('filters nodes based on category', () => {
    render(<Dashboard />);

    const defiButton = screen.getByRole('button', { name: 'DeFi' });
    fireEvent.click(defiButton);

    expect(screen.getByText('Uniswap')).toBeInTheDocument();
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
  });
});
