# BlotChain - Real-Time Cryptocurrency Liquidity & DeFi Visualization

## 📋 Project Description

**BlotChain** is a modern web application for interactive, real-time visual exploration of cryptocurrency assets, DEX pools, and liquidity flow networks across 2D SVG, 3D WebGL, and WebXR VR viewports. The application leverages **CoinGecko API** and **GraphQL / The Graph Subgraphs** to render dynamic data topologies.

---

## 🔍 Answers to Key Architecture & Integration Questions

### 1. 🌐 CoinGecko API Health & Status Check
CoinGecko API integration is handled in `src/services/coinGeckoApi.ts` and `src/hooks/useRealTimeData.ts`:
- **Supported Endpoints:** `/ping`, `/coins/markets`, `/exchanges`, `/global`, `/coins/{id}/market_chart`.
- **429 Rate Limit Graceful Fallback:** When rate limits are reached (HTTP 429) or network outages occur, the app seamlessly falls back to mock simulation generators (`generateMockNodes` & `generateMockConnections`), ensuring zero UI crashes.
- **Automated Diagnostic Tool:** You can run real-time API health diagnostics using:
  ```bash
  python3 /home/jules/self_created_tools/check_coingecko.py
  ```

---

### 2. 🔗 How to Add Graph WL (Watchlist Subgraphs) to the Project
The GraphQL client service is implemented in `src/services/graphApi.ts` for querying **The Graph (Subgraphs)** or custom GraphQL gateways (Goldsky / Decentralized Network).

#### Steps to add a new subgraph to Watchlist (WL):
1. **Register Subgraph in Watchlist:**
   Add your target subgraph URL to `DEFAULT_SUBGRAPH_WL` or dynamically call `graphApiService.addWatchlistSubgraph()`:
   ```typescript
   import { graphApiService } from './services/graphApi';

   graphApiService.addWatchlistSubgraph({
     id: 'uniswap-v3-polygon',
     name: 'Uniswap V3 Polygon Subgraph',
     endpointUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
     category: 'Uniswap',
     enabled: true
   });
   ```

2. **Query & Map Subgraph Entities:**
   Fetch liquidity entities (`pools`, `reserves`, `swaps`) via `graphApiService.query()` and transform them into BlotChain `Node` and `Connection` structures:
   ```typescript
   const { nodes, connections } = await graphApiService.getDeFiGraphNodesAndConnections();
   ```

---

### 3. 📊 Online DeFi Data Accessible via GraphQL

Using GraphQL subgraphs (The Graph, Goldsky, Envoy), live on-chain data can be queried across several DeFi sectors:

| DeFi Sector | Subgraphs / Sources | Accessible Live Data |
|---|---|---|
| **DEX / AMM Pools** | Uniswap V2/V3, Curve, Balancer, Sushiswap | • Total Value Locked (TVL) per pool & token<br>• 24h trading volume & fee earnings<br>• Live Swap events (tokenIn, tokenOut, amounts, sender)<br>• Concentrated liquidity tick distributions |
| **Lending / Borrowing** | Aave V3, Compound, Spark Protocol | • Total deposits (`totalATokenSupply`) & variable/stable debt<br>• Supply APY (`liquidityRate`) & Borrow APY (`variableBorrowRate`)<br>• Available liquidity & protocol utilization rates<br>• Real-time liquidation events & health factors |
| **Yield & Staking** | Lido, RocketPool, Yearn, Convex | • Staking yields & validator performance<br>• Vault TVL & strategy asset allocations<br>• Voting incentives (Gauges & Rewards) |
| **Cross-Chain / MEV** | Hop, Stargate, Flashbots | • Bridge volumes & cross-chain transfers<br>• Mempool arbitrage events & sandwich attack vectors |

---

### 4. 🎨 3 Proposed Dashboard Types

#### 🌊 Type 1: DeFi Protocol & Liquidity Flow Dashboard
- **Concept:** Visualizes capital flow vectors between AMMs (Uniswap/Curve) and Lending protocols (Aave/Compound).
- **Key Elements:**
  - **Nodes:** AMM pools and Lending reserves.
  - **Connections:** Particle flow speeds and sizes indicate active swap velocity, flash loans, and liquidity migration.
  - **Use Case:** Assessing liquidity depth and discovering yield farming routes.

#### 🛡️ Type 2: MEV & Intent Threat Visualization Dashboard
- **Concept:** Real-time mempool safety monitoring and visualization of MEV attack vectors (sandwiching, frontrunning, slippage exploits).
- **Key Elements:**
  - **Nodes:** Real-time user intents and pending transactions.
  - **Connections:** Risk indicators with pulsing red threat rings.
  - **Integration:** 1-Click "Proof-of-Protection" NFT minting on Polygon Mainnet.
  - **Use Case:** Protecting trader execution and auditing intent safety.

#### 🌐 Type 3: Multi-Chain Asset & Portfolio Intelligence Dashboard
- **Concept:** Multi-chain portfolio aggregation across EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Solana).
- **Key Elements:**
  - **Nodes:** User wallet holdings, CEX accounts, and DEX positions.
  - **Connections:** Bridge transfers and cross-chain routes.
  - **Watchlist (WL):** Custom asset lists and yield farming metrics.
  - **Use Case:** Holistically tracking portfolio health, yield APYs, and asset concentration risk.

---

## 🏗️ Architecture Overview

```
src/
├── components/              # React UI Components (2D, 3D WebGL, VR)
│   ├── Dashboard.tsx       # 2D SVG canvas viewport
│   ├── Dashboard3D.tsx     # 3D WebGL interactive canvas (Three.js)
│   ├── DashboardVR.tsx     # WebXR VR Space Mode
│   ├── Node.tsx            # Node component
│   ├── Connection.tsx      # Connection path component
│   └── ComparisonPanel.tsx # Side-by-side asset comparison
├── services/               # API & GraphQL Services
│   ├── coinGeckoApi.ts    # CoinGecko REST client with mock fallback
│   ├── graphApi.ts        # GraphQL / The Graph subgraph service
│   └── mevShieldApi.ts    # MEV threat simulation service
├── App.tsx                # Main App entrypoint
└── main.tsx               # Web entrypoint
```

## 📦 Installation & Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build production bundle
pnpm run build
```

## 📄 License

MIT
