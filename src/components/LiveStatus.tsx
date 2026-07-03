import React from 'react';
import { DashboardMode } from '../types';

interface LiveStatusProps {
  nodeCount: number;
  connectionCount: number;
  mode: DashboardMode;
}

export const LiveStatus: React.FC<LiveStatusProps> = React.memo(({
  nodeCount,
  connectionCount,
  mode
}) => {
  return (
    <div className="absolute top-24 right-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-sm font-bold uppercase tracking-tighter">Live Status</span>
      </div>
      <div className="text-gray-500 text-[10px] mt-1 font-mono uppercase">
        {nodeCount} {mode === 'crypto' ? 'Assets' : 'Collections'} • {connectionCount} Links
      </div>
    </div>
  );
});

LiveStatus.displayName = 'LiveStatus';
