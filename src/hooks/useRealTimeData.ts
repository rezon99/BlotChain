import { useState, useEffect, useCallback } from 'react';
import { Node, Connection } from '../types';
import { coinGeckoApi } from '../services/coinGeckoApi';
import { transformCoinDataToNodes, generateConnectionsFromRealData } from '../utils/dataTransformer';
import { updateParticles } from '../utils/dataSimulator';

export function useRealTimeData(refreshInterval: number = 30000) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch top coins and exchanges in parallel
      const [coinsData, exchangesData] = await Promise.all([
        coinGeckoApi.getTopCoins(15),
        coinGeckoApi.getExchanges(5)
      ]);

      // Transform data to our node format
      const newNodes = transformCoinDataToNodes(coinsData, exchangesData);
      const newConnections = generateConnectionsFromRealData(newNodes);

      setNodes(newNodes);
      setConnections(newConnections);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update data based on refresh interval
  useEffect(() => {
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Update particles more frequently for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(currentConnections => updateParticles(currentConnections));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    nodes,
    connections,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
}