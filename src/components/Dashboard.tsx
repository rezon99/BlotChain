import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Node as NodeType, TooltipData } from '../types';
import { Visualization } from './Visualization';
import { Tooltip } from './Tooltip';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedSidebarNodeId, setSelectedSidebarNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipData>({
    node: {} as NodeType,
    x: 0,
    y: 0,
    visible: false
  });
  const [cascadeEffects, setCascadeEffects] = useState<Array<{
    id: string;
    x: number;
    y: number;
    trigger: number;
  }>>([]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
    setSelectedSidebarNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  const handleNodeHover = useCallback((node: NodeType, x: number, y: number) => {
    setTooltip({
      node,
      x,
      y,
      visible: true
    });
  }, []);

  const handleNodeHoverEnd = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(nodes.map(node => node.category))).sort();
  }, [nodes]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          node.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(node.category);
      if (matchesSearch && matchesCategory) {
        ids.add(node.id);
      }
    });
    return ids;
  }, [nodes, searchQuery, selectedCategories]);

  const getConnectedNodeIds = (nodeIds: string[]): string[] => {
    const connected = new Set(nodeIds);
    connections.forEach(conn => {
      if (nodeIds.includes(conn.source)) {
        connected.add(conn.target);
      }
      if (nodeIds.includes(conn.target)) {
        connected.add(conn.source);
      }
    });
    return Array.from(connected);
  };

  const connectedNodeIds = selectedNodes.size > 0 ? 
    getConnectedNodeIds(Array.from(selectedNodes)) : [];

  const handleCascadeComplete = useCallback((effectId: string) => {
    setCascadeEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  // Show loading spinner while fetching initial data
  if (loading && nodes.length === 0) {
    return <LoadingSpinner />;
  }

  // Show error display if there's an error and no data
  if (error && nodes.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-30 p-6 space-y-6 pointer-events-none">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 pointer-events-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Real-time Cryptocurrency Liquidity Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p>Live data from CoinGecko API</p>
              </div>
              <span className="hidden md:inline text-slate-700">•</span>
              <p>Last update: {lastUpdate.toLocaleTimeString()}</p>
              <span className="hidden md:inline text-slate-700">|</span>
              <p className="text-blue-400/80 font-medium">
                {filteredNodeIds.size} of {nodes.length} assets
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {error && (
              <div className="text-yellow-400 text-sm">
                ⚠ API Error (using cached data)
              </div>
            )}
            
            {loading && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Updating...
              </div>
            )}
            
            {selectedNodes.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Clear Selection ({selectedNodes.size})
              </button>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
          <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter size={16} />
            <span className="text-sm font-medium whitespace-nowrap">Categories:</span>
          </div>
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  selectedCategories.has(category)
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                    : 'bg-slate-800/40 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                {category}
              </button>
            ))}
            {selectedCategories.size > 0 && (
              <button
                onClick={() => setSelectedCategories(new Set())}
                className="px-3 py-1 text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <Visualization
        nodes={nodes}
        connections={connections}
        filteredNodeIds={filteredNodeIds}
        selectedNodes={selectedNodes}
        connectedNodeIds={connectedNodeIds}
        cascadeEffects={cascadeEffects}
        onNodeSelect={handleNodeSelect}
        onNodeHover={handleNodeHover}
        onNodeHoverEnd={handleNodeHoverEnd}
        onCascadeComplete={handleCascadeComplete}
      />

      {/* Tooltip */}
      <Tooltip data={tooltip} />

      {/* Sidebar */}
      {(() => {
        const selectedNode = nodes.find(n => n.id === selectedSidebarNodeId);
        return selectedNode ? (
          <Sidebar
            node={selectedNode}
            onClose={() => setSelectedSidebarNodeId(null)}
          />
        ) : null;
      })()}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 z-20">
        <h3 className="text-white font-semibold mb-3">Legend</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-300">Growing (+5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-300">Declining (-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-300">High Volatility (±20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-gray-300">Stable (±5%)</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-gray-300 text-sm">Liquidity Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500" />
            <span className="text-gray-300 text-sm">Liquidity Outflow</span>
          </div>
        </div>
      </div>
    </div>
  );
};