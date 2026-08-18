import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LiveStatusProps {
  nodeCount: number;
  connectionCount: number;
  className?: string;
}

export const LiveStatus: React.FC<LiveStatusProps> = React.memo(({
  nodeCount,
  connectionCount,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleStatus = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleStatus();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? "Expand live status details" : "Collapse live status details"}
      onClick={toggleStatus}
      onKeyDown={handleKeyDown}
      className={`${className ?? ""} bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg px-2 py-1.5 flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 z-20`}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
        {!isCollapsed && (
          <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Live Connection</span>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="w-px h-3 bg-slate-700" />
          <div className="text-gray-400 text-[10px] font-mono uppercase whitespace-nowrap">
            {nodeCount} Assets • {connectionCount} Links
          </div>
        </>
      )}

      <span className="text-gray-400 hover:text-white ml-0.5">
        {isCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </span>
    </div>
  );
});

LiveStatus.displayName = 'LiveStatus';
