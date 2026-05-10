import React, { useEffect, useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Node } from '../types';
import { coinGeckoApi } from '../services/coinGeckoApi';

interface SidebarProps {
  node: Node;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ node, onClose }) => {
  const [history, setHistory] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (node.category === 'Exchange') return;
      setLoading(true);
      try {
        const data = await coinGeckoApi.getCoinHistory(node.id, 7);
        setHistory(data.prices);
      } catch (error) {
        console.error('Failed to fetch price history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [node.id, node.category]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: val < 1 ? 4 : 2
    }).format(val);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2
    }).format(val);
  };

  const prices = history.map(p => p[1]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const sparklinePoints = prices.map((price, i) => {
    const x = (i / (prices.length - 1)) * 100;
    const y = 100 - ((price - minPrice) / priceRange) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: node.color }} />
          <h2 className="text-xl font-bold text-white truncate">{node.name}</h2>
          <span className="text-xs font-mono text-slate-500 uppercase">{node.symbol}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Price & Change */}
        <div className="space-y-1">
          <p className="text-sm text-slate-400 font-medium">Current Price</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-bold text-white">
              {node.currentPrice > 0 ? formatCurrency(node.currentPrice) : 'N/A'}
            </h3>
            <div className={`flex items-center text-sm font-semibold ${node.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {node.change24h >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {Math.abs(node.change24h).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <Activity size={14} /> 7D Price Action
            </p>
            {node.category !== 'Exchange' && (
              <span className="text-xs text-slate-500">Last 7 days</span>
            )}
          </div>

          <div className="h-24 w-full bg-slate-800/30 rounded-lg p-2 border border-slate-800/50 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length > 0 ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <polyline
                  points={sparklinePoints}
                  fill="none"
                  stroke={node.change7d >= 0 ? '#22c55e' : '#ef4444'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 italic">
                {node.category === 'Exchange' ? 'History unavailable for exchanges' : 'No history data'}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Market Cap</p>
            <p className="text-lg font-semibold text-slate-200">
              {node.marketCap > 0 ? `$${formatCompact(node.marketCap)}` : 'N/A'}
            </p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">24h Volume</p>
            <p className="text-lg font-semibold text-slate-200">
              {node.totalVolume > 0 ? `$${formatCompact(node.totalVolume)}` : 'N/A'}
            </p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Category</p>
            <p className="text-lg font-semibold text-slate-200">{node.category}</p>
          </div>
        </div>

        {/* Links */}
        <div className="pt-4 border-t border-slate-800">
          <a
            href={`https://www.coingecko.com/en/${node.category === 'Exchange' ? 'exchanges' : 'coins'}/${node.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/20"
          >
            View on CoinGecko <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};