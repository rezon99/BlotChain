import React from 'react';
import { DashboardMode } from '../types';

interface LegendProps {
  mode: DashboardMode;
}

export const Legend: React.FC<LegendProps> = React.memo(({ mode }) => {
  return (
    <div className="absolute bottom-6 left-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">Legend</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-300">Growing ({mode === 'crypto' ? '+5%' : 'Bullish'})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-300">Declining ({mode === 'crypto' ? '-5%' : 'Bearish'})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-300">High Volatility (±20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-300">{mode === 'crypto' ? 'Stable' : 'Hub / Chain'}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-gray-300 text-sm">{mode === 'crypto' ? 'Liquidity Inflow' : 'Collection Flow'}</span>
        </div>
      </div>
    </div>
  );
});

Legend.displayName = 'Legend';
