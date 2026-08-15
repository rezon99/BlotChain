import { IntentThreatPayload } from '../types/mevshield';

export class MEVShieldService {
  private ws: WebSocket | null = null;
  private listeners: ((payload: IntentThreatPayload) => void)[] = [];
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  public connect(url?: string): void {
    if (url) {
      try {
        this.ws = new WebSocket(url);
        this.ws.onmessage = (event) => {
          try {
            const data: IntentThreatPayload = JSON.parse(event.data);
            this.notify(data);
          } catch (e) {
            console.error('Error parsing MEVShield WS message', e);
          }
        };
      } catch (e) {
        console.warn('Failed to connect to MEVShield WebSocket, falling back to mock simulation.', e);
        this.startMockSimulation();
      }
    } else {
      this.startMockSimulation();
    }
  }

  public subscribe(listener: (payload: IntentThreatPayload) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(payload: IntentThreatPayload): void {
    this.listeners.forEach((listener) => listener(payload));
  }

  public startMockSimulation(): void {
    if (this.simulationInterval) return;

    const mockPayloads: IntentThreatPayload[] = [
      {
        intentId: 'intent_0x9f8a1b2c3d4e5f6g7h8i9j0k',
        timestamp: Math.floor(Date.now() / 1000),
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
        status: 'PROTECTED_AND_EXECUTED',
        riskAssessment: {
          riskScore: 0.85,
          threatLevel: 'CRITICAL',
          detectedThreats: ['SANDWICH_ATTACK'],
          actionTaken: 'ROUTED_PRIVATE_RPC',
          estimatedMevLossUsd: 1250.0
        },
        visualization: {
          nodes: [
            {
              id: 'node_user',
              label: 'User Wallet (0x1234...)',
              type: 'WALLET',
              threatColor: '#00FF66',
              isPulsing: false,
              x: 200,
              y: 300
            },
            {
              id: 'node_router',
              label: 'MEVShield Private RPC',
              type: 'PRIVATE_ROUTER',
              threatColor: '#00E5FF',
              isPulsing: false,
              x: 400,
              y: 300
            },
            {
              id: 'node_pool',
              label: 'Uniswap V3 ETH/USDC',
              type: 'DEX_POOL',
              threatColor: '#FF0055',
              isPulsing: true,
              x: 600,
              y: 300
            }
          ],
          flows: [
            {
              fromNodeId: 'node_user',
              toNodeId: 'node_router',
              volumeUsd: 10000,
              particleColor: '#00FF66',
              particleSpeed: 1.5
            },
            {
              fromNodeId: 'node_router',
              toNodeId: 'node_pool',
              volumeUsd: 10000,
              particleColor: '#FF0055',
              particleSpeed: 3.0
            }
          ]
        }
      },
      {
        intentId: 'intent_0xa1b2c3d4e5f6789012345678',
        timestamp: Math.floor(Date.now() / 1000),
        userAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        status: 'PROTECTED_AND_EXECUTED',
        riskAssessment: {
          riskScore: 0.2,
          threatLevel: 'LOW',
          detectedThreats: [],
          actionTaken: 'EXECUTED_PUBLIC',
          estimatedMevLossUsd: 0.0
        },
        visualization: {
          nodes: [
            {
              id: 'node_user',
              label: 'User Wallet (0x71C7...)',
              type: 'WALLET',
              threatColor: '#00FF66',
              isPulsing: false,
              x: 200,
              y: 300
            },
            {
              id: 'node_pool',
              label: 'Curve 3pool',
              type: 'DEX_POOL',
              threatColor: '#00FF66',
              isPulsing: false,
              x: 600,
              y: 300
            }
          ],
          flows: [
            {
              fromNodeId: 'node_user',
              toNodeId: 'node_pool',
              volumeUsd: 50000,
              particleColor: '#00FF66',
              particleSpeed: 1.0
            }
          ]
        }
      }
    ];

    let index = 0;
    this.notify(mockPayloads[0]);

    this.simulationInterval = setInterval(() => {
      index = (index + 1) % mockPayloads.length;
      const payload = {
        ...mockPayloads[index],
        timestamp: Math.floor(Date.now() / 1000)
      };
      this.notify(payload);
    }, 10000);
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const mevShieldService = new MEVShieldService();
