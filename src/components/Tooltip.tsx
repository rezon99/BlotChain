import React from 'react';
import { TooltipData } from '../types';

interface TooltipProps {
  data: TooltipData;
}

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  if (!data.visible) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? '#22c55e' : '#ef4444';
    return (
      <span style={{ color }}>{sign}{value.toFixed(2)}%</span>
    );
  };

  return (
    <div
      className="fixed pointer-events-none z-50 transform -translate-x-1/2"
      style={{
        left: data.x,
        top: data.y,
        transform: 'translateX(-50%) translateY(-100%)'
      }}
    >
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-2xl max-w-xs">
        <div className="text-white mb-2">
          <h3 className="font-semibold text-lg">{data.node.name}</h3>
          <p className="text-gray-400 text-sm">{data.node.category}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Liquidity:</span>
            <span className="text-white font-medium">
              {formatCurrency(data.node.liquidity)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">24h Change:</span>
            <span className="font-medium">
              {formatPercentage(data.node.change24h)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">7d Change:</span>
            <span className="font-medium">
              {formatPercentage(data.node.change7d)}
            </span>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: data.node.color }}
            />
            <span className="text-xs text-gray-400">
              {Math.abs(data.node.change24h) > 20 ? 'High Volatility' :
               data.node.change24h > 5 ? 'Growing' :
               data.node.change24h < -5 ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};