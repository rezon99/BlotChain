# BlotChain - Real-Time Cryptocurrency Liquidity & MEV Visualization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)](https://threejs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-EVM-yellow)](https://hardhat.org/)

**BlotChain** is an advanced interactive web platform designed for real-time visualization of cryptocurrency asset relationships, liquidity flows, and MEV (Maximal Extractable Value) threat intelligence. Built with support for **2D SVG**, **3D WebGL (Three.js)**, and **WebXR Virtual Reality (VR)**, BlotChain transforms complex market data and transaction dynamics into intuitive spatial network graphs.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Visualization Modes](#-visualization-modes)
- [Visual Encoding System](#-visual-encoding-system)
- [System Architecture](#-system-architecture)
- [Automation & Web3 Layer](#-automation--web3-layer)
- [Tech Stack](#-tech-stack)
- [Security & Environment Secrets Management](#-security--environment-secrets-management)
- [Installation & Setup](#-installation--setup)
- [Data Flow Pipeline](#-data-flow-pipeline)
- [Roadmap & Backlog](#-roadmap--backlog)
- [License](#-license)

---

## 🎯 Key Features

### 1. Multi-Dimensional Network Graphs
- **Interactive SVG & WebGL Canvases:** Render cryptocurrency nodes, exchanges, and liquidity channels dynamically.
- **Physics & Layout:** Force-directed node layout positioning with smooth particle flows indicating direction and volume of liquidity.
- **Node Manipulation:** Drag-and-drop nodes in 2D to custom positions, inspect connections, and lock node coordinates.

### 2. Real-Time Market Synchronisation
- **Market Data Feeds:** Continuous polling and synchronization of top market assets, price dynamics, market cap, and 24-hour volume metrics.
- **Historical Performance:** Detailed price history charts (1d, 7d, 30d, 1y) with interactive time-series modal views and mini sparklines.
- **Asset Comparison Mode:** Side-by-side asset metric comparison calculating percent differences across market cap, volume, and volatility.

### 3. MEV Shield & Analytics
- **Threat Detection:** Live monitoring of frontrunning, sandwich attacks, and arbitrage exploitation.
- **Risk Scoring:** Real-time MEV risk level metrics, transaction bundle simulation, and RPC protection status.

### 4. Interactive Dashboard Controls
- **Customizable Intervals:** Selectable polling intervals (15s, 30s, 60s) to balance freshness and API rate limits.
- **Performance Mode:** Toggle physics animations, node breathing effects, particle counts, and transparency effects for optimized rendering on low-power hardware.

---

## 🌌 Visualization Modes

BlotChain supports three immersive rendering engines:

| Mode | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **2D Mode** | SVG + React | Dynamic SVG paths, Bezier connection curves, interactive tooltips, node drag-and-drop, and asset filter categories. |
| **3D Mode** | Three.js + WebGL | Force-directed 3D point cloud and sphere clusters, OrbitControls, 3D particle motion along spatial splines, dynamic ambient lighting. |
| **VR Mode** | WebXR + Three.js | Fully immersive 3D spatial canvas for VR headsets (Meta Quest, WebXR devices), spatial hand controller raycasting, and 360-degree liquidity inspection. |

---

## 🎨 Visual Encoding System

BlotChain uses strict visual mappings to convey asset health and liquidity dynamics at a glance:

### Node Color Encoding
- 🟢 **Green (`#22c55e`):** Asset gaining > +5% (24h)
- 🔴 **Red (`#ef4444`):** Asset dropping > -5% (24h)
- 🟡 **Yellow (`#eab308`):** High volatility (swing > ±20%)
- ⚪ **Gray (`#6b7280`):** Stable / minimal change (within ±5%)

### Liquidity Flow Encoding
- 🔵 **Blue Line (`#3b82f6`):** Inflowing liquidity stream
- 🟠 **Orange Line (`#f97316`):** Outflowing liquidity stream
- ✨ **Animated Particles:** White spheres flowing along Bezier paths indicating direction and volume intensity. Line thickness scales proportionally to liquidity volume (up to 12px max thickness).

---

## 🏗️ System Architecture

```
BlotChain Root
├── src/                        # Frontend Application
│   ├── components/             # React UI & Canvas Components
│   │   ├── Dashboard.tsx       # Main 2D Dashboard container
│   │   ├── Dashboard3D.tsx     # Three.js 3D Viewport
│   │   ├── DashboardVR.tsx     # WebXR Virtual Reality Viewport
│   │   ├── Node.tsx            # Interactive 2D Node component
│   │   ├── Connection.tsx      # SVG liquidity connections & animated particles
│   │   ├── ChartModal.tsx      # Time-series asset performance modal
│   │   ├── ComparisonPanel.tsx # Side-by-side asset comparison view
│   │   ├── MEVShieldPanel.tsx  # MEV risk metrics panel
│   │   ├── SettingsPanel.tsx   # Dashboard performance & interval settings
│   │   └── Tooltip.tsx         # Hover inspection card
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useRealTimeData.ts  # Synchronizes market feeds & particle updates
│   │   └── useMEVShieldData.ts # Synchronizes MEV analytics state
│   ├── services/               # API Data Adapters
│   │   ├── coinGeckoApi.ts     # Public & Pro market API client
│   │   └── mevShieldApi.ts     # MEV threat simulation API client
│   ├── utils/                  # Data transformation & layout algorithms
│   │   ├── dataTransformer.ts  # Transforms API responses into Nodes & Connections
│   │   ├── dataSimulator.ts    # Particle progress simulation
│   │   └── mevAdapter.ts       # MEV event mapping
│   ├── App.tsx                 # Viewport mode router (2D / 3D / VR / Snapshot)
│   └── main.tsx                # Application entry point
│
├── automation/                 # Web3 & Automation Service Layer
│   ├── contract/               # Hardhat EVM Smart Contract project
│   │   ├── contracts/          # Solidity ERC-721 Snapshot contract
│   │   └── scripts/            # Deployment & minting scripts
│   ├── bot/                    # Automated Puppeteer Snapshot Bot
│   │   └── src/                # Captures dashboard snapshots & uploads to IPFS
│   └── shared/                 # Shared TypeScript interfaces & JSON schemas
│
└── scripts/                    # Headless render verification scripts (Python)
```

---

## 🤖 Automation & Web3 Layer

The `automation/` workspace operates independently of the frontend application to capture periodic state snapshots and record them on EVM blockchains:

1. **ERC-721 Contract (`automation/contract`):** `BlotChainSnapshot.sol` mints immutable NFTs containing metadata and IPFS CID hashes representing real-time dashboard snapshots.
2. **Headless Snapshot Bot (`automation/bot`):**
   - Launches a headless Chromium browser using Puppeteer in `snapshotMode=1`.
   - Captures high-resolution visual screenshots of the live 2D SVG canvas.
   - Uploads snapshot images and JSON metadata to IPFS via Decentralized Storage.
   - Executes smart contract calls to mint ERC-721 NFT snapshots.
   - Dispatches automated notifications and snapshots to Telegram channels via Telegram Bot API.

---

## 🛠️ Tech Stack

- **Frontend Core:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **3D & VR Engines:** Three.js, `@react-three/fiber`, `@react-three/drei`, WebXR
- **Smart Contracts & Blockchain:** Solidity 0.8.20, Hardhat, Ethers.js, ERC-721 (OpenZeppelin)
- **Automation & Bot:** Puppeteer, Node.js, Jest, IPFS / NFT.Storage API
- **Verification Scripts:** Python 3 (PIL/Pillow visual verification scripts)

---

## 🔒 Security & Environment Secrets Management

When publishing or open-sourcing this repository, strict security measures must be followed to prevent accidental exposure of API keys, private keys, and sensitive tokens.

### 🛡️ Critical Security Rules for Public Repositories

1. **NEVER Commit Private Keys or Live Secrets:**
   - **`OPERATOR_PRIVATE_KEY`:** Never hardcode EVM wallet private keys in code or config files (`hardhat.config.ts`, `.env`). Always use environment variables supplied at runtime or via secure secret managers (e.g., GitHub Secrets, Vault).
   - **`TELEGRAM_BOT_TOKEN` & `NFT_STORAGE_API_KEY`:** Must remain strictly private.

2. **Protecting & Hiding the CoinGecko API Key:**
   - In frontend applications built with Vite, environment variables prefixed with `VITE_` (e.g., `VITE_COINGECKO_API_KEY`) are bundled into client-side JavaScript code and can be extracted by end users.
   - **Client-Side Mode (Default):** For demo purposes, public repositories should rely on public endpoints (`https://api.coingecko.com/api/v3`) without requiring or exposing paid PRO keys. Demo keys (`x_cg_demo_api_key`) can be placed in local `.env.local` files which are excluded by `.gitignore`.
   - **Production Architecture (Recommended for Open Source):**
     - **API Proxy / Reverse Proxy:** Route requests through a backend server or Serverless Edge Function (e.g., Vercel Serverless Function, Cloudflare Worker, or Nginx).
     - The proxy injects the confidential API key header (`x-cg-pro-api-key` or `x-cg-demo-api-key`) server-side before forwarding the request to CoinGecko, making the key invisible to website visitors and public repository code.

3. **Environment Files Handling:**
   - `.env.example` contains **ONLY** placeholder variable definitions and mock values.
   - `.gitignore` is pre-configured to block `.env`, `.env.local`, `.env.production`, and `.env.development` from being tracked by Git.

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **pnpm** or **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/rezon99/BlotChain.git
cd BlotChain
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install automation layer dependencies
cd automation/shared && pnpm install
cd ../contract && pnpm install
cd ../bot && pnpm install
cd ../..
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Optional: CoinGecko API Configuration
VITE_COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
VITE_COINGECKO_API_KEY=

# Automation Layer Configuration (Keep secret in production)
RPC_URL=https://rpc.sepolia.org
OPERATOR_PRIVATE_KEY=your_private_key_here
NFT_STORAGE_API_KEY=your_nft_storage_key
CONTRACT_ADDRESS=your_deployed_contract_address
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🔄 Data Flow Pipeline

```
┌─────────────────────────┐     ┌──────────────────────────┐
│  CoinGecko Market API   │     │  MEV Threat Intelligence │
└───────────┬─────────────┘     └────────────┬─────────────┘
            │                                │
            ▼                                ▼
┌──────────────────────────────────────────────────────────┐
│      Services Layer (coinGeckoApi.ts / mevShieldApi.ts)  │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Data Transformers & Physics Engine            │
│       (dataTransformer.ts / collisionDetection.ts)       │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                 React Context / State Hooks               │
│               (useRealTimeData / useMEVShieldData)       │
└──────────┬────────────────────┬──────────────────┬───────┘
           │                    │                  │
           ▼                    ▼                  ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐
  │ 2D SVG Renderer │  │ 3D Three.js     │  │ WebXR VR      │
  │ (Dashboard.tsx) │  │ (Dashboard3D)   │  │ (DashboardVR) │
  └─────────────────┘  └─────────────────┘  └───────────────┘
```

---

## 🚀 Roadmap & Backlog

- [x] Multi-mode rendering (2D SVG, 3D WebGL, WebXR VR).
- [x] MEV Shield threat intelligence panel.
- [x] Web3 NFT snapshot automation layer via Hardhat and Puppeteer.
- [x] Time-series price history modal and sparklines.
- [ ] Cross-asset correlation coefficient heatmap computation.
- [ ] WebGL clustering for 500+ simultaneously rendered nodes.
- [ ] Serverless API Proxy for zero-exposure CoinGecko key management.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
