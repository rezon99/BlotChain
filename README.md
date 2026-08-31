# BlotChain - Real-Time Cryptocurrency Liquidity & DeFi Visualization

## 📋 Project Overview

**BlotChain** is a modern web application for interactive, real-time visual exploration of cryptocurrency assets, DEX pools, and liquidity flow networks across 2D SVG, 3D WebGL, and WebXR VR viewports. The application leverages **CoinGecko API** and **GraphQL / The Graph Subgraphs** to render dynamic data topologies.

The application visualizes crypto assets as an interactive network graph:
- 🔵 **Nodes:** Cryptocurrency assets, AMM pools, and exchanges
- 📊 **Connections:** Liquidity flow vectors between assets
- ✨ **Particles:** Animated elements showing capital movement direction and volume velocity

---

## 🎯 Implemented Features

### 1. 🌐 **Multi-Viewport Visualizations**
- **2D SVG Canvas (`Dashboard.tsx`):** High-performance 2D SVG interactive canvas with adaptive force-directed topology and persistent drag node positioning.
- **3D WebGL Explorer (`Dashboard3D.tsx`):** Immersive Three.js 3D space with orbit controls (`OrbitControls`), glowing node spheres, directional particle flow lines, and LOD distance culling.
- **WebXR VR Space Mode (`DashboardVR.tsx`):** Virtual reality 360-degree cosmic environment set at eye level (y=1.6) with floating node spheres and interactive flow pipelines.
- **Decentraland SDK 7 Metaverse Scene (`decentraland-scene/`):** 100% procedural Decentraland ECS7 scene built without external GLB assets, featuring floating platform islands, connection bridges, billboards, and particle flow systems.

### 2. ⚡ **Real-Time Data & Resiliency**
- **CoinGecko REST API:** Automatic 30-second background polling with built-in HTTP 429 rate limit protection and instant fallback to a realistic local data simulator (`dataSimulator.ts`).
- **GraphQL / The Graph Service (`graphApi.ts`):** Direct integration with DeFi subgraphs (Uniswap V3, Aave V3, Curve) and Watchlist (WL) configuration for transforming GraphQL entities into graph visual models.
- **MEV Shield Threat Simulation (`mevShieldApi.ts`):** Real-time mempool MEV risk tracking and 1-click Proof-of-Protection NFT minting on Polygon Mainnet.

### 3. 🎨 **Visual Encoding**
- **Node Color Dynamics:**
  - 🟢 **Green:** Price gain (> +5%)
  - 🔴 **Red:** Price drop (> -5%)
  - 🟡 **Yellow:** High volatility (±20%)
  - ⚫ **Gray:** Stable price action (±5%)

- **Connection Color Coding:**
  - 🔵 **Blue:** Incoming liquidity flow
  - 🟠 **Orange:** Outgoing liquidity flow

### 4. 🎛️ **Interactive Interface & Accessibility**
- **Asset Comparison Panel (VS Mode):** Side-by-side comparative analysis of metrics for two selected assets in `ComparisonPanel.tsx`.
- **Category Filter:** Quick filtering across Top 10, DEX, CEX, Stablecoins, and Protocols.
- **Detailed Charts & Sparklines:** Modal price history charts (`ChartModal.tsx`) with timeframe selectors, keyboard navigation (`role="dialog"`), and ARIA attributes.
- **Snapshot Parameter (`?snapshotMode=1`):** Clean URL query flag designed for automated visual capture tools.

---

## 🏗️ Monorepo Architecture

```
BlotChain/
├── src/                      # Main React + Vite web application
│   ├── components/           # 2D SVG, 3D WebGL, and WebXR VR components
│   ├── services/             # API clients (CoinGecko, GraphQL, MEV Shield)
│   ├── hooks/                # Real-time state synchronization hooks
│   └── utils/                # Data transformers, collision physics, visuals
├── automation/               # Isolated automation & bot layer
│   ├── shared/               # Shared TypeScript types & contract configuration
│   ├── contract/             # Hardhat ERC-721 BlotChainSnapshot contract (Solidity ^0.8.24)
│   └── bot/                  # Playwright snapshot orchestrator, IPFS metadata & Telegram bot
└── decentraland-scene/       # Decentraland SDK 7 (ECS7) procedural 3D scene
```

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **3D & VR:** Three.js, OrbitControls, WebXR API
- **Smart Contracts:** Solidity ^0.8.24, Hardhat, EIP-2981 Royalties
- **Automation:** Playwright Chromium headless, Pinata IPFS SDK, Telegram Bot API

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** v18+
- **pnpm** (recommended) or npm

### Getting Started

```bash
# Clone repository
git clone https://github.com/riznykst/BlotChain.git
cd BlotChain

# Install workspace dependencies
pnpm install

# Start local development server
pnpm run dev

# Build production bundle
pnpm run build

# Run linter checks
pnpm run lint
```

---

## 🔮 Major Features Backlog & Architecture Proposals

For detailed information on proposed architecture solutions, integration guides, and future roadmap concepts, please see:
📄 **[PROPOSED_FEATURES.md](./PROPOSED_FEATURES.md)**

### Backlog Summary:
1. **🌐 CoinGecko API Health Diagnostic Tool:** Real-time health checks and 429 rate limit graceful fallback.
2. **🔗 Graph WL (Watchlist Subgraphs) Integration Guide:** Step-by-step instructions for adding custom subgraphs.
3. **📊 Live DeFi Data Matrix via GraphQL:** Accessible metrics across DEX, Lending, Yield Staking, and MEV sectors.
4. **🎨 3 Proposed Dashboard Concepts:**
   - *DeFi Protocol & Liquidity Flow Dashboard* (AMM to Lending flow vectors).
   - *MEV & Intent Threat Visualization Dashboard* (Mempool threat monitoring & 1-Click NFT protection).
   - *Multi-Chain Asset & Portfolio Intelligence Dashboard* (Cross-chain aggregation & yield metrics).

---

## 📄 License

This project is licensed under the MIT License.
