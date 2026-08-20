import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Node as NodeType, TooltipData, AnimationSettings } from '../types';
import { Node } from './Node';
import { Connection as ConnectionComponent } from './Connection';
import { Tooltip } from './Tooltip';
import { CascadeEffect } from './CascadeEffect';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SettingsPanel } from './SettingsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { Header } from './Header';
import { Legend } from './Legend';
import { LiveStatus } from './LiveStatus';
import { ChartModal } from './ChartModal';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { adaptNodesToViewport, getResponsiveViewport } from '../utils/dataTransformer';

interface DashboardProps {
  viewMode?: '2d' | '3d' | 'vr';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr') => void;
  snapshotMode?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  viewMode = '2d',
  onViewModeSwitch,
  snapshotMode = false
}) => {
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('blotchain_refresh_interval');
    return saved ? parseInt(saved, 10) : 30000;
  });

  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(refreshInterval, 20);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeChartNode, setActiveChartNode] = useState<NodeType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  const [manualPositions, setManualPositions] = useState<Record<string, { x: number, y: number }>>(() => {
    try {
      const saved = localStorage.getItem('blotchain_positions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      // Handle untrusted/corrupted JSON gracefully to prevent application crash
      console.warn('Failed to parse blotchain_positions from localStorage:', e);
      localStorage.removeItem('blotchain_positions');
      return {};
    }
  });
  const manualPositionsRef = useRef(manualPositions);
  manualPositionsRef.current = manualPositions;

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(() => {
    const defaultSettings: AnimationSettings = {
      enabled: true,
      particleSpeed: 1,
      breathingIntensity: 1
    };
    try {
      const saved = localStorage.getItem('blotchain_animation_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
      // Handle untrusted/corrupted JSON gracefully to prevent application crash
      console.warn('Failed to parse blotchain_animation_settings from localStorage:', e);
      localStorage.removeItem('blotchain_animation_settings');
      return defaultSettings;
    }
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  const viewport = useMemo(() => getResponsiveViewport(viewportSize.width, viewportSize.height), [viewportSize]);

  // Persist refreshInterval when it changes
  React.useEffect(() => {
    localStorage.setItem('blotchain_refresh_interval', refreshInterval.toString());
  }, [refreshInterval]);

  // Persist animationSettings when they change
  React.useEffect(() => {
    localStorage.setItem('blotchain_animation_settings', JSON.stringify(animationSettings));
  }, [animationSettings]);

  React.useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;

    const updateViewport = () => {
      const rect = target.getBoundingClientRect();
      setViewportSize({
        width: Math.max(320, Math.floor(rect.width || 800)),
        height: Math.max(360, Math.floor(rect.height || 600))
      });
    };

    updateViewport();

    const observer = new ResizeObserver(updateViewport);
    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Find position of the node (taking manual positions into account)
      const nodeX = manualPositions[nodeId]?.x ?? node.x;
      const nodeY = manualPositions[nodeId]?.y ?? node.y;

      // Add cascade effect at clicked coordinates
      const effectId = `cascade-${nodeId}-${Date.now()}`;
      setCascadeEffects(prev => [
        ...prev,
        {
          id: effectId,
          x: nodeX,
          y: nodeY,
          trigger: Date.now()
        }
      ]);

      if (!node.isHub && !snapshotMode) {
        setActiveChartNode(node);
      }
    }
  }, [nodes, manualPositions, snapshotMode]);

  const toggleComparison = useCallback((nodeId: string) => {
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

  const getSVGCoords = (e: React.MouseEvent | MouseEvent, svgElement: SVGSVGElement) => {
    const CTM = svgElement.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleDragStart = useCallback((nodeId: string, e: React.MouseEvent, nodeX: number, nodeY: number) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;

    const coords = getSVGCoords(e, svg);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: coords.x - nodeX,
      y: coords.y - nodeY
    });
    e.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNodeId) return;

    const svg = e.currentTarget.closest('svg');
    if (!svg) return;

    const coords = getSVGCoords(e, svg);

    // O(1) node lookup from filteredNodesMap instead of O(N) nodes.find
    const nodeSize = filteredNodesMap.get(draggingNodeId)?.size ?? 20;

    const labelSafetyMarginX = 35;
    const minX = Math.max(viewport.padding, labelSafetyMarginX) + nodeSize;
    const maxX = viewport.width - Math.max(viewport.padding, labelSafetyMarginX) - nodeSize;
    const minY = viewport.padding + nodeSize;
    const maxY = viewport.height - viewport.padding - nodeSize - 40; // 40px safety for labels

    const clampedX = Math.max(minX, Math.min(maxX, coords.x - dragOffset.x));
    const clampedY = Math.max(minY, Math.min(maxY, coords.y - dragOffset.y));

    const newPos = {
      x: clampedX,
      y: clampedY
    };

    setManualPositions(prev => ({
      ...prev,
      [draggingNodeId]: newPos
    }));
  }, [draggingNodeId, dragOffset, filteredNodesMap, viewport]);

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      // Persist manual node positions to localStorage on drag end to eliminate storage I/O thrashing during mousemove
      localStorage.setItem('blotchain_positions', JSON.stringify(manualPositionsRef.current));
      setDraggingNodeId(null);
    }
  }, [draggingNodeId]);

  const resetLayout = useCallback(() => {
    setManualPositions({});
    localStorage.removeItem('blotchain_positions');
  }, []);

  const exportToJson = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      nodes,
      connections,
      manualPositions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blotchain-export-crypto-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, connections, manualPositions]);

  const exportToPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const viewBoxWidth = Math.max(1, Math.round(svg.viewBox.baseVal.width || viewport.width));
    const viewBoxHeight = Math.max(1, Math.round(svg.viewBox.baseVal.height || viewport.height));
    canvas.width = viewBoxWidth * 2;
    canvas.height = viewBoxHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `blotchain-snapshot-crypto-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  }, [viewport]);

  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  // Memoize force-directed viewport adaptation separately so manual node dragging
  // updates manualPositions without re-executing 40 iterations of force layout physics.
  const adaptedNodes = useMemo(() => {
    const baseNodes = categoryFilter === 'All'
      ? nodes
      : nodes.filter(n => n.category === categoryFilter || n.isHub);

    return adaptNodesToViewport(baseNodes, viewport.width, viewport.height);
  }, [nodes, categoryFilter, viewport]);

  const filteredNodes = useMemo(() => {
    return adaptedNodes.map(node => {
      const manual = manualPositions[node.id];
      if (manual) {
        const labelSafetyMarginX = 35;
        const minX = Math.max(viewport.padding, labelSafetyMarginX) + node.size;
        const maxX = viewport.width - Math.max(viewport.padding, labelSafetyMarginX) - node.size;
        const minY = viewport.padding + node.size;
        const maxY = viewport.height - viewport.padding - node.size - 40; // leave 40px for labels at bottom

        return {
          ...node,
          x: Math.max(minX, Math.min(maxX, manual.x)),
          y: Math.max(minY, Math.min(maxY, manual.y))
        };
      }
      return node;
    });
  }, [adaptedNodes, manualPositions, viewport]);

  const filteredNodesMap = useMemo(() => {
    return new Map<string, NodeType>(filteredNodes.map(node => [node.id, node]));
  }, [filteredNodes]);

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
    <div className="h-screen h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
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

      <Header
        lastUpdate={lastUpdate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedCount={selectedNodes.size}
        onClearSelection={clearSelection}
        viewMode={viewMode}
        onViewModeSwitch={onViewModeSwitch}
      />

      <div
        ref={viewportRef}
        className="relative flex-1 min-h-0 px-2 pb-2 sm:px-4 sm:pb-4"
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          className="w-full h-full max-w-full rounded-lg"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {filteredConnections.map(connection => {
            const sourceNode = filteredNodesMap.get(connection.source);
            const targetNode = filteredNodesMap.get(connection.target);
            if (!sourceNode || !targetNode) return null;
            return (
              <ConnectionComponent
                key={connection.id}
                connection={connection}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isHighlighted={
                  selectedNodes.has(connection.source) ||
                  selectedNodes.has(connection.target) ||
                  selectedNodes.size === 0
                }
                animationSettings={animationSettings}
                isDragging={draggingNodeId === connection.source || draggingNodeId === connection.target}
              />
            );
          })}
          
          {filteredNodes.map(node => (
            <Node
              key={node.id}
              node={node}
              onSelect={handleNodeSelect}
              onDragStart={(e) => handleDragStart(node.id, e, node.x, node.y)}
              onHover={handleNodeHover}
              onHoverEnd={handleNodeHoverEnd}
              isConnected={
                connectedNodeIds.includes(node.id) || 
                selectedNodes.size === 0
              }
              animationSettings={animationSettings}
              isDragging={draggingNodeId === node.id}
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse z-20">
            UPDATING LIVE DATA...
          </div>
        )}

        {/* Floating Controls Overlays */}
        <LiveStatus
          nodeCount={nodes.length}
          connectionCount={connections.length}
          className="absolute top-4 right-4 z-10"
        />

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-32px)]">
          <Legend
            className="bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-full"
          />
          {/* Category Filter positioned vertically below the Legend panel */}
          <div className="flex flex-col bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden max-w-full">
            <div
              className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            >
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Categories</span>
              <span className="text-gray-400">
                {isFilterCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            </div>
            {!isFilterCollapsed && (
              <div className="flex items-center gap-1 sm:gap-2 p-1.5 border-t border-gray-800 overflow-x-auto max-w-full">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-md transition-all whitespace-nowrap font-medium ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <Tooltip data={tooltip} />

      {!snapshotMode && (
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval}
          animationSettings={animationSettings}
          setAnimationSettings={setAnimationSettings}
          onResetLayout={resetLayout}
          onExportJson={exportToJson}
          onExportPng={exportToPng}
        />
      )}

      {!snapshotMode && (
        <ComparisonPanel
          selectedNodes={selectedNodeData}
          onClear={clearSelection}
        />
      )}

      {!snapshotMode && (
        <ChartModal
          node={activeChartNode}
          onClose={() => setActiveChartNode(null)}
          onAddToComparison={toggleComparison}
        />
      )}
    </div>
  );
};