export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionTaken = 'ROUTED_PRIVATE_RPC' | 'EXECUTED_PUBLIC' | 'SIMULATED' | 'BLOCKED';

export interface RiskAssessment {
  riskScore: number; // 0.0 - 1.0
  threatLevel: ThreatLevel;
  detectedThreats: string[]; // e.g. ["SANDWICH_ATTACK", "FRONTRUNNING"]
  actionTaken: ActionTaken;
  estimatedMevLossUsd?: number;
}

export interface VisualizationNode {
  id: string;
  label: string;
  type: 'WALLET' | 'PRIVATE_ROUTER' | 'DEX_POOL' | 'MEV_BOT' | 'MEMPOOL';
  threatColor: string; // e.g. "#00FF66" or "#FF0055"
  isPulsing: boolean;
  x?: number;
  y?: number;
  z?: number;
  price?: number;
  liquidity?: number;
}

export interface VisualizationFlow {
  fromNodeId: string;
  toNodeId: string;
  volumeUsd: number;
  particleColor: string;
  particleSpeed: number;
}

export interface IntentThreatPayload {
  intentId: string;
  timestamp: number;
  userAddress: string;
  status: 'ANALYZING' | 'PROTECTED_AND_EXECUTED' | 'THREAT_DETECTED' | 'ROUTED';
  riskAssessment: RiskAssessment;
  visualization: {
    nodes: VisualizationNode[];
    flows: VisualizationFlow[];
  };
}
