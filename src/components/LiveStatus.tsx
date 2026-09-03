import React from 'react';
import { DashboardMode } from '../types';

interface LiveStatusProps {
  nodeCount: number;
  connectionCount: number;
  mode: DashboardMode;
  className?: string;
}

export const LiveStatus: React.FC<LiveStatusProps> = React.memo(({
  nodeCount,
  connectionCount,
  mode,
  className
}) => {
  return (
    <div className={className ?? "absolute top-4 right-4 z-10 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg px-2.5 py-1.5 flex items-center gap-3"}>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-xs font-bold uppercase tracking-tighter whitespace-nowrap">Live</span>
      </div>
      <div className="w-px h-3 bg-slate-700" />
      <div className="text-gray-400 text-[10px] font-mono uppercase whitespace-nowrap">
        {nodeCount} {mode === 'crypto' ? 'Assets' : 'Collections'} • {connectionCount} Links
      </div>
    </div>
  );
});

LiveStatus.displayName = 'LiveStatus';
