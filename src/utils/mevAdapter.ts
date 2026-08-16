import { Node, Connection } from '../types';
import { IntentThreatPayload, VisualizationNode, VisualizationFlow } from '../types/mevshield';

/**
 * Transforms a MEVShield IntentThreatPayload into BlotChain Node and Connection models.
 */
export function transformIntentPayload(
  payload: IntentThreatPayload,
  width = 800,
  height = 600
): { nodes: Node[]; connections: Connection[] } {
  const { nodes: visNodes, flows: visFlows } = payload.visualization;

  const nodes: Node[] = visNodes.map((vNode: VisualizationNode, index: number) => {
    // Distribute node positions dynamically across width to avoid label clustering
    const totalNodes = visNodes.length;
    const paddingX = 140;
    const stepX = (width - paddingX * 2) / Math.max(1, totalNodes - 1);

    // Spread horizontal position, with slight vertical offset variance
    const defaultX = paddingX + index * stepX;
    const defaultY = height / 2 + (index % 2 === 0 ? -30 : 30);

    return {
      id: vNode.id,
      name: vNode.label,
      category: vNode.type,
      price: vNode.price ?? (vNode.type === 'WALLET' ? 0 : 1850.50),
      liquidity: vNode.liquidity ?? (vNode.type === 'DEX_POOL' ? 5000000 : 100000),
      change24h: payload.riskAssessment.riskScore > 0.5 ? -payload.riskAssessment.riskScore * 10 : payload.riskAssessment.riskScore * 5,
      change7d: 2.5,
      x: vNode.x ?? defaultX,
      y: vNode.y ?? defaultY,
      size: vNode.type === 'WALLET' ? 28 : vNode.type === 'DEX_POOL' ? 36 : 24,
      color: vNode.threatColor,
      isSelected: false,
      lastUpdated: payload.timestamp,
      isHub: vNode.type === 'PRIVATE_ROUTER' || vNode.type === 'DEX_POOL',
      volume24h: visFlows.reduce((sum, f) => f.fromNodeId === vNode.id || f.toNodeId === vNode.id ? sum + f.volumeUsd : sum, 0),
      // Custom MEVShield properties passed to Node for visualization rendering
      threatColor: vNode.threatColor,
      isPulsing: vNode.isPulsing,
      nodeType: vNode.type,
      riskScore: payload.riskAssessment.riskScore,
      threatLevel: payload.riskAssessment.threatLevel,
      detectedThreats: payload.riskAssessment.detectedThreats,
      actionTaken: payload.riskAssessment.actionTaken
    } as Node & {
      threatColor?: string;
      isPulsing?: boolean;
      nodeType?: string;
      riskScore?: number;
      threatLevel?: string;
      detectedThreats?: string[];
      actionTaken?: string;
    };
  });

  const connections: Connection[] = visFlows.map((flow: VisualizationFlow, idx: number) => ({
    id: `conn_${flow.fromNodeId}_${flow.toNodeId}_${idx}`,
    source: flow.fromNodeId,
    target: flow.toNodeId,
    flow: flow.volumeUsd,
    direction: 'out',
    particles: Array.from({ length: 3 }, (_, i) => ({
      id: `p_${idx}_${i}`,
      progress: (i * 0.33) % 1.0,
      speed: flow.particleSpeed * 0.005,
      size: 3,
      color: flow.particleColor
    }))
  }));

  return { nodes, connections };
}
