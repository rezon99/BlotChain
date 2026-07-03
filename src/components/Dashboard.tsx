import React, { useState, useCallback, useMemo } from 'react';
import { Node as NodeType, TooltipData, AnimationSettings, DashboardMode } from '../types';
import { Node } from './Node';
import { Connection as ConnectionComponent } from './Connection';
import { Tooltip } from './Tooltip';
import { CascadeEffect } from './CascadeEffect';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SettingsPanel } from './SettingsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { LayoutGrid, Coins, Image as ImageIcon, Settings } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [mode, setMode] = useState<DashboardMode>('crypto');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(mode, refreshInterval);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>({
    enabled: true,
    particleSpeed: 1,
    breathingIntensity: 1
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const handleModeSwitch = useCallback((newMode: DashboardMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setSelectedNodes(new Set());
      setCategoryFilter('All');
    }
  }, [mode]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        if (newSet.size >= 2) {
          const arr = Array.from(newSet);
          return new Set([arr[1], nodeId]);
        }
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

    const connected = new Set(Array.from(selectedNodes));

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

  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (categoryFilter === 'All') return nodes;
    return nodes.filter(n => n.category === categoryFilter || n.isHub);
  }, [nodes, categoryFilter]);

  const filteredConnections = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    return connections.filter(c => filteredNodeIds.has(c.source) && filteredNodeIds.has(c.target));
  }, [connections, filteredNodes]);

  const selectedNodeData = useMemo(() => {
    return nodes.filter(n => selectedNodes.has(n.id));
  }, [nodes, selectedNodes]);

  if (loading && nodes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && nodes.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <LayoutGrid className="text-blue-500" size={28} />
              <h1 className="text-3xl font-bold text-white">
                BlotChain Dashboard
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              Live from CoinGecko • Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 backdrop-blur-md">
            <button
              onClick={() => handleModeSwitch('crypto')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Coins size={16} />
              CRYPTOCURRENCY
            </button>
            <button
              onClick={() => handleModeSwitch('nft')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'nft' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ImageIcon size={16} />
              NFT COLLECTIONS
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    categoryFilter === cat
                      ? mode === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-slate-700 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            
            {selectedNodes.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 rounded-lg transition-all text-sm font-bold"
              >
                CLEAR ({selectedNodes.size})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-screen max-w-full"
          style={{ minHeight: '600px' }}
        >
          {filteredConnections.map(connection => (
            <ConnectionComponent
              key={connection.id}
              connection={connection}
              nodes={filteredNodes}
              isHighlighted={
                selectedNodes.has(connection.source) || 
                selectedNodes.has(connection.target) ||
                selectedNodes.size === 0
              }
              animationSettings={animationSettings}
            />
          ))}
          
          {filteredNodes.map(node => (
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
              animationSettings={animationSettings}
            />
          ))}
          
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

        {loading && nodes.length > 0 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">
            UPDATING LIVE DATA...
          </div>
        )}
      </div>

      <Tooltip data={tooltip} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        animationSettings={animationSettings}
        setAnimationSettings={setAnimationSettings}
      />

      <ComparisonPanel
        selectedNodes={selectedNodeData}
        onClear={clearSelection}
      />

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

      <div className="absolute top-24 right-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-sm font-bold uppercase tracking-tighter">Live Status</span>
        </div>
        <div className="text-gray-500 text-[10px] mt-1 font-mono uppercase">
          {nodes.length} {mode === 'crypto' ? 'Assets' : 'Collections'} • {connections.length} Links
        </div>
      </div>
    </div>
  );
};