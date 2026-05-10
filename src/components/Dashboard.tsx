import React, { useState, useCallback, useMemo } from 'react';
import { Node as NodeType, TooltipData } from '../types';
import { Node } from './Node';
import { Connection as ConnectionComponent } from './Connection';
import { Tooltip } from './Tooltip';
import { CascadeEffect } from './CascadeEffect';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
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

  const connectedNodeIds = useMemo(() => {
    if (selectedNodes.size === 0) return [];

    const connected = new Set(selectedNodes);
    connections.forEach(conn => {
      if (selectedNodes.has(conn.source)) {
        connected.add(conn.target);
      }
      if (selectedNodes.has(conn.target)) {
        connected.add(conn.source);
      }
    });
    return Array.from(connected);
  }, [selectedNodes, connections]);

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
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Real-time Cryptocurrency Liquidity Dashboard
            </h1>
            <p className="text-gray-400">
              Live data from CoinGecko API • Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Selection ({selectedNodes.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <div className="relative">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-screen max-w-full"
          style={{ minHeight: '600px' }}
        >
          {/* Connections */}
          {connections.map(connection => (
            <ConnectionComponent
              key={connection.id}
              connection={connection}
              nodes={nodes}
              isHighlighted={
                selectedNodes.has(connection.source) || 
                selectedNodes.has(connection.target) ||
                selectedNodes.size === 0
              }
            />
          ))}
          
          {/* Nodes */}
          {nodes.map(node => (
            <Node
              key={node.id}
              node={node}
              onSelect={handleNodeSelect}
              onHover={handleNodeHover}
              onHoverEnd={handleNodeHoverEnd}
              isConnected={
                connectedNodeIds.includes(node.id) || 
                selectedNodes.size === 0
              }
            />
          ))}
          
          {/* Cascade effects */}
          {cascadeEffects.map(effect => (
            <CascadeEffect
              key={effect.id}
              x={effect.x}
              y={effect.y}
              trigger={effect.trigger}
              onComplete={() => handleCascadeComplete(effect.id)}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      <Tooltip data={tooltip} />

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
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

      {/* Status indicator */}
      <div className="absolute top-6 right-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-sm">Live Data</span>
        </div>
        <div className="text-gray-400 text-xs mt-1">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
        <div className="text-gray-500 text-xs">
          {nodes.length} assets • {connections.length} connections
        </div>
      </div>
    </div>
  );
};