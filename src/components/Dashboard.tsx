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
import { Header } from './Header';
import { Legend } from './Legend';
import { LiveStatus } from './LiveStatus';
import { ChartModal } from './ChartModal';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
  const [mode, setMode] = useState<DashboardMode>('crypto');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(mode, refreshInterval);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeChartNode, setActiveChartNode] = useState<NodeType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const [manualPositions, setManualPositions] = useState<Record<string, { x: number, y: number }>>(() => {
    const saved = localStorage.getItem('blotchain_positions');
    return saved ? JSON.parse(saved) : {};
  });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
    const node = nodes.find(n => n.id === nodeId);
    if (node && !node.isHub) {
      setActiveChartNode(node);
    }
  }, [nodes]);

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
    const newPos = {
      x: coords.x - dragOffset.x,
      y: coords.y - dragOffset.y
    };

    setManualPositions(prev => {
      const updated = {
        ...prev,
        [draggingNodeId]: newPos
      };
      localStorage.setItem('blotchain_positions', JSON.stringify(updated));
      return updated;
    });
  }, [draggingNodeId, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  const resetLayout = useCallback(() => {
    setManualPositions({});
    localStorage.removeItem('blotchain_positions');
  }, []);

  const exportToJson = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      mode,
      nodes,
      connections,
      manualPositions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blotchain-export-${mode}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mode, nodes, connections, manualPositions]);

  const exportToPng = useCallback(() => {
    const svg = document.querySelector('svg[viewBox="0 0 800 600"]') as SVGSVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1600; // High res
    canvas.height = 1200;
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
      ctx.drawImage(img, 0, 0, 1600, 1200);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `blotchain-snapshot-${mode}-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  }, [mode]);

  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    const baseNodes = categoryFilter === 'All'
      ? nodes
      : nodes.filter(n => n.category === categoryFilter || n.isHub);

    return baseNodes.map(node => ({
      ...node,
      ...(manualPositions[node.id] || {})
    }));
  }, [nodes, categoryFilter, manualPositions]);

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

      <Header
        lastUpdate={lastUpdate}
        mode={mode}
        onModeSwitch={handleModeSwitch}
        categories={categories}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedCount={selectedNodes.size}
        onClearSelection={clearSelection}
      />

      <div className="relative">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-screen max-w-full"
          style={{ minHeight: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
              isDragging={draggingNodeId === connection.source || draggingNodeId === connection.target}
            />
          ))}
          
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
        onResetLayout={resetLayout}
        onExportJson={exportToJson}
        onExportPng={exportToPng}
      />

      <ComparisonPanel
        selectedNodes={selectedNodeData}
        onClear={clearSelection}
      />

      <Legend mode={mode} />

      <LiveStatus
        nodeCount={nodes.length}
        connectionCount={connections.length}
        mode={mode}
      />

      <ChartModal
        node={activeChartNode}
        onClose={() => setActiveChartNode(null)}
        onAddToComparison={toggleComparison}
      />
    </div>
  );
};