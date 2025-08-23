import React, { useState, useEffect, useCallback } from 'react';
import { Node as NodeType, Connection, TooltipData, MarketData } from '../types';
import { Node } from './Node';
import { Connection as ConnectionComponent } from './Connection';
import { Tooltip } from './Tooltip';
import { CascadeEffect } from './CascadeEffect';
import { fetchMarketData } from '../api/coingecko';

// Helper function to generate connections - simplified logic
const generateConnections = (nodes: NodeType[]): Connection[] => {
    const connections: Connection[] = [];
    if (nodes.length < 2) return connections;

    // A simple ring topology for visualization
    for (let i = 0; i < nodes.length; i++) {
        const sourceNode = nodes[i];
        const targetNode = nodes[(i + 1) % nodes.length];
        
        connections.push({
            id: `${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            flow: Math.random() * 1000 + 500, // Random flow value
            direction: Math.random() > 0.5 ? 'in' : 'out',
            particles: Array.from({ length: 10 }, () => ({ // Add some particles
                id: `p-${Math.random()}`,
                progress: Math.random() * 100,
                speed: Math.random() * 0.2 + 0.1,
                size: Math.random() * 2 + 1,
            })),
        });
    }
    // Add some random cross-connections
    for (let i = 0; i < nodes.length / 2; i++) {
        const sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
        const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (sourceNode.id !== targetNode.id && !connections.find(c => c.id === `${sourceNode.id}-${targetNode.id}` || c.id === `${targetNode.id}-${sourceNode.id}`)) {
            connections.push({
                id: `${sourceNode.id}-${targetNode.id}`,
                source: sourceNode.id,
                target: targetNode.id,
                flow: Math.random() * 1000 + 500,
                direction: Math.random() > 0.5 ? 'in' : 'out',
                particles: Array.from({ length: 10 }, () => ({
                    id: `p-${Math.random()}`,
                    progress: Math.random() * 100,
                    speed: Math.random() * 0.2 + 0.1,
                    size: Math.random() * 2 + 1,
                })),
            });
        }
    }
    return connections;
};

// Helper function to map API data to our Node type
const mapMarketDataToNodes = (marketData: MarketData[]): NodeType[] => {
    return marketData.map(data => {
        const size = 15 + Math.log(data.market_cap || 1) / 2.5;
        
        return {
            id: data.id,
            name: data.name,
            category: data.symbol.toUpperCase(),
            liquidity: data.total_volume,
            change24h: data.price_change_percentage_24h || 0,
            change7d: 0, // This data is not in the /markets endpoint
            x: Math.random() * 750 + 25,
            y: Math.random() * 550 + 25,
            size: size,
            color: 'bg-gray-500', // Color is determined inside the Node component
            isSelected: false,
            lastUpdated: new Date(data.last_updated).getTime(),
        };
    });
};

// Hardcoded list of popular coins for the visualization
const coinIds = ['bitcoin', 'ethereum', 'ripple', 'cardano', 'solana', 'polkadot', 'dogecoin', 'shiba-inu', 'chainlink', 'uniswap', 'avalanche-2', 'litecoin'];

export const Dashboard: React.FC = () => {
    const [nodes, setNodes] = useState<NodeType[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
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
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const marketData = await fetchMarketData(coinIds);
            if (marketData && marketData.length > 0) {
                const newNodes = mapMarketDataToNodes(marketData);
                setNodes(newNodes);
                const newConnections = generateConnections(newNodes);
                setConnections(newConnections);
                setLastUpdateTime(new Date().toLocaleTimeString());
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Periodic data update
    useEffect(() => {
        const interval = setInterval(async () => {
            const marketData = await fetchMarketData(coinIds);
            if (marketData && marketData.length > 0) {
                setNodes(currentNodes => {
                    const updatedNodes = currentNodes.map(node => {
                        const newData = marketData.find(d => d.id === node.id);
                        if (newData && node) {
                            if (Math.abs((newData.price_change_percentage_24h || 0) - node.change24h) > 0.5) {
                                setCascadeEffects(prev => [...prev, {
                                    id: `cascade-${Date.now()}-${node.id}`,
                                    x: node.x,
                                    y: node.y,
                                    trigger: Date.now()
                                }]);
                            }
                            return {
                                ...node,
                                liquidity: newData.total_volume,
                                change24h: newData.price_change_percentage_24h || 0,
                                lastUpdated: new Date(newData.last_updated).getTime(),
                            };
                        }
                        return node;
                    });
                    return updatedNodes;
                });
                setLastUpdateTime(new Date().toLocaleTimeString());
            }
        }, 60000); // Update every 60 seconds to be respectful of public API rate limits

        return () => clearInterval(interval);
    }, []);

    // Particle animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setConnections(currentConnections =>
                currentConnections.map(conn => ({
                    ...conn,
                    particles: conn.particles.map(p => ({
                        ...p,
                        progress: (p.progress + p.speed) % 100,
                    })),
                }))
            );
        }, 50);
        return () => clearInterval(interval);
    }, []);

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
        setTooltip({ node, x, y, visible: true });
    }, []);

    const handleNodeHoverEnd = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNodes(new Set());
    }, []);

    const getConnectedNodeIds = (nodeIds: string[]): string[] => {
        const connected = new Set(nodeIds);
        connections.forEach(conn => {
            if (nodeIds.includes(conn.source)) connected.add(conn.target);
            if (nodeIds.includes(conn.target)) connected.add(conn.source);
        });
        return Array.from(connected);
    };

    const connectedNodeIds = selectedNodes.size > 0 ? getConnectedNodeIds(Array.from(selectedNodes)) : [];

    const handleCascadeComplete = useCallback((effectId: string) => {
        setCascadeEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <h1 className="text-3xl font-bold text-white animate-pulse">Loading Market Data...</h1>
            </div>
        );
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
                            Cryptocurrency Liquidity Dashboard
                        </h1>
                        <p className="text-gray-400">
                            Real-time visualization of liquidity flows and market dynamics
                        </p>
                    </div>

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
                    Last update: {lastUpdateTime}
                </div>
            </div>
        </div>
    );
};