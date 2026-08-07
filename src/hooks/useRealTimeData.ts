import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Connection, DashboardMode } from '../types';
import { coinGeckoApi } from '../services/coinGeckoApi';
import {
  transformCoinDataToNodes,
  generateConnectionsFromRealData,
  transformNFTDataToNodes,
  generateNFTConnections
} from '../utils/dataTransformer';

export function useRealTimeData(
  mode: DashboardMode = 'crypto',
  refreshInterval: number = 30000,
  limit: number = 15
) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const activeFetchId = useRef(0);

  const fetchData = useCallback(async () => {
    const fetchId = ++activeFetchId.current;
    try {
      setLoading(true);
      setError(null);
      
      let newNodes: Node[] = [];
      let newConnections: Connection[] = [];

      if (mode === 'crypto') {
        const [coinsData, exchangesData] = await Promise.all([
          coinGeckoApi.getTopCoins(limit),
          coinGeckoApi.getExchanges(Math.max(5, Math.floor(limit / 3)))
        ]);
        if (fetchId !== activeFetchId.current) return;
        newNodes = transformCoinDataToNodes(coinsData, exchangesData);
        newConnections = generateConnectionsFromRealData(newNodes);
      } else {
        const nftData = await coinGeckoApi.getNFTMarkets(limit);
        if (fetchId !== activeFetchId.current) return;
        newNodes = transformNFTDataToNodes(nftData);
        newConnections = generateNFTConnections(newNodes);
      }

      if (fetchId !== activeFetchId.current) return;

      setNodes(newNodes);
      setConnections(newConnections);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      if (fetchId !== activeFetchId.current) return;
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, [mode, limit]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update data based on refresh interval
  useEffect(() => {
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    nodes,
    connections,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
}
