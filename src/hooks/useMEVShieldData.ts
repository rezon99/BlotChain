import { useState, useEffect } from 'react';
import { IntentThreatPayload } from '../types/mevshield';
import { Node, Connection } from '../types';
import { mevShieldService } from '../services/mevShieldApi';
import { transformIntentPayload } from '../utils/mevAdapter';

export function useMEVShieldData(wsUrl?: string) {
  const [currentPayload, setCurrentPayload] = useState<IntentThreatPayload | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = mevShieldService.subscribe((payload) => {
      setCurrentPayload(payload);
      const transformed = transformIntentPayload(payload);
      setNodes(transformed.nodes);
      setConnections(transformed.connections);
      setLoading(false);
    });

    mevShieldService.connect(wsUrl);

    return () => {
      unsubscribe();
      mevShieldService.disconnect();
    };
  }, [wsUrl]);

  return {
    currentPayload,
    nodes,
    connections,
    loading
  };
}
