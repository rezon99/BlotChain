# BlotChain - Real-Time Cryptocurrency Liquidity Visualization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38bdf8)](https://tailwindcss.com/)

**BlotChain** is an advanced interactive web application designed for real-time visualization of cryptocurrency asset relationships, market dynamics, and liquidity flows. Featuring multi-dimensional rendering across **2D SVG**, **3D WebGL (Three.js)**, and **WebXR Virtual Reality (VR)**, BlotChain transforms complex market feeds into an intuitive spatial network canvas.

---

## 📋 Table of Contents

- [Current Implementation Highlights](#-current-implementation-highlights)
- [Visualization Modes](#-visualization-modes)
- [Visual Encoding System](#-visual-encoding-system)
- [System Architecture](#-system-architecture)
- [Data Flow Pipeline](#-data-flow-pipeline)
- [Tech Stack](#-tech-stack)
- [Security & Environment Secrets Management](#-security--environment-secrets-management)
- [Installation & Setup](#-installation--setup)
- [Product Roadmap & Backlog](#-product-roadmap--backlog)
- [License](#-license)

---

## ✨ Current Implementation Highlights

### 1. Multi-Dimensional Network Graphs
- **Fullscreen Immersive Canvas:** Supports smooth switching across 2D SVG, 3D WebGL (Three.js), and WebXR VR viewports.
- **Organic Spiral Layout:** Calculates organic logarithmic spiral layouts for initial node positioning, preventing spatial clutter and maximizing visibility.
- **Interactive Drag-and-Drop:** Drag nodes in 2D to custom positions with coordinate locking to freeze specific assets while the physics layout runs.
- **Informative Hover Cards:** Hover or select any node to open detailed asset tooltips displaying live prices, 24h trends, volume, and market cap.

### 2. Live CoinGecko Market Data Integration
- **Real-Time Data Sync:** Synchronizes with CoinGecko market API to fetch live prices, 24h percentage changes, market capitalization, and daily trading volume.
- **Interactive Price History Modal:** View historical performance charts across multiple timeframes (`1d`, `7d`, `30d`, `1y`) with detailed asset metrics.
- **Mini Sparklines:** Inline trend sparklines rendered dynamically inside hover tooltips and asset selection panels.
- **Asset Comparison Mode:** Side-by-side metric evaluation comparing price changes, volume intensity, and market cap differences across selected cryptocurrencies.

### 3. Real-Time Liquidity Flow Demonstration
- **Directed Bezier Curves:** Liquidity connections rendered as smooth Bezier splines connecting source and target asset nodes.
- **Animated Particle Streams:** Dynamic particle flows along connection paths indicating the direction of capital movement.
- **Dynamic Encoding:** Connection line thickness and particle animation speeds scale dynamically according to 24h trading volume and price momentum (up to 12px max stroke width).
- **Capital Inflow & Outflow Visuals:** Visual distinction between incoming and outgoing capital streams for every monitored asset.

### 4. Interactive Dashboard Controls
- **Collapsible Navigation & Filters:** Navigation header and filter controls are collapsed by default to maximize uninhibited graph visibility.
- **Customizable Polling Intervals:** Switch between `15s`, `30s`, or `60s` market data refresh intervals to balance freshness with API rate limits.
- **Performance Mode:** Energy-saving toggle that optimizes frame rate, reduces particle counts, and disables resource-heavy effects on lower-power devices.

---

## 🌌 Visualization Modes

BlotChain provides three dedicated rendering viewports:

| Viewport Mode | Engine | Key Capabilities |
| :--- | :--- | :--- |
| **2D Mode** | SVG + React | Dynamic SVG paths, Bezier curves, interactive drag-and-drop node locking, hover tooltips, and category filtering. |
| **3D Mode** | Three.js + WebGL | Spatial point cloud and sphere clusters, OrbitControls navigation, 3D animated particle streams along spatial splines. |
| **VR Mode** | WebXR + Three.js | Fully spatial canvas for VR headsets (Meta Quest, WebXR devices), 360-degree interactive liquidity inspection. |

---

## 🎨 Visual Encoding System

BlotChain uses strict visual mappings to convey asset performance and capital movement:

### Node Color & Volatility Encoding
- 🟢 **Green (`#22c55e`):** Asset price gain > +5% (24h)
- 🔴 **Red (`#ef4444`):** Asset price drop > -5% (24h)
- 🟡 **Yellow (`#eab308`):** High volatility (swing > ±20%)
- ⚪ **Gray (`#6b7280`):** Stable / minimal change (within ±5%)

### Liquidity Flow Encoding
- 🔵 **Blue Line (`#3b82f6`):** Inflowing liquidity stream
- 🟠 **Orange Line (`#f97316`):** Outflowing liquidity stream
- ✨ **Animated Particles:** Glowing particles moving along Bezier paths indicating direction and flow intensity. Line stroke thickness scales dynamically with trading volume (1px to 12px).

---

## 🏗️ System Architecture

The project structure cleanly separates UI components, custom hooks, data services, and mathematical utilities:

```
BlotChain Root
├── scripts/                    # Verification and test render scripts
│   ├── test_render.py          # Python visual verification script
│   ├── verify_3d.py            # Python 3D canvas verification script
│   └── verify_vr.py            # Python WebXR canvas verification script
│
├── src/                        # Frontend Application Source
│   ├── components/             # React UI & Viewport Components
│   │   ├── CascadeEffect.tsx   # Visual particle/flow cascade overlay
│   │   ├── ChartModal.tsx      # Time-series price history modal (1d, 7d, 30d, 1y)
│   │   ├── ComparisonPanel.tsx # Side-by-side asset comparison view
│   │   ├── Connection.tsx      # SVG liquidity curves & animated particles
│   │   ├── Dashboard.tsx       # Main 2D SVG graph canvas container
│   │   ├── Dashboard3D.tsx     # Three.js 3D WebGL spatial view
│   │   ├── DashboardVR.tsx     # WebXR Virtual Reality canvas engine
│   │   ├── DetailedChart.tsx   # Detailed chart component for asset analysis
│   │   ├── ErrorDisplay.tsx    # User notification & error display banner
│   │   ├── Header.tsx          # Collapsible main navigation header bar
│   │   ├── Legend.tsx          # Graph visual encoding legend panel
│   │   ├── LiveStatus.tsx      # Real-time API sync indicator & statistics
│   │   ├── LoadingSpinner.tsx  # Initial loading indicator
│   │   ├── Node.tsx            # Interactive 2D graph node with drag & drop
│   │   ├── SettingsPanel.tsx   # Polling interval & Performance Mode controls
│   │   ├── Sparkline.tsx       # SVG mini sparkline trend chart
│   │   └── Tooltip.tsx         # Hover inspection card for asset metrics
│   ├── hooks/                  # Custom React Hooks
│   │   └── useRealTimeData.ts  # Synchronizes CoinGecko feeds & particle state
│   ├── services/               # API Integration Services
│   │   └── coinGeckoApi.ts     # CoinGecko REST client with caching & fallback
│   ├── types/                  # TypeScript Type Definitions
│   │   └── index.ts            # Node, Connection, Market, & UI state interfaces
│   ├── utils/                  # Data Algorithms & Physics Utilities
│   │   ├── collisionDetection.ts # Node collision resolution & force layout
│   │   ├── dataSimulator.ts    # Particle animation & simulated flow physics
│   │   ├── dataTransformer.ts  # Maps CoinGecko API data to spiral graph layouts
│   │   └── visuals.ts          # Color mapping & visual encoding helpers
│   ├── App.tsx                 # Viewport mode router (2D / 3D / VR / Snapshot)
│   ├── index.css               # Global Tailwind CSS styles
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts           # Vite environment declaration
│
├── .env.example                # Template for environment variables
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and script definitions
├── tailwind.config.js          # Tailwind CSS styling configuration
├── tsconfig.json               # TypeScript project configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🔄 Data Flow Pipeline

```
┌──────────────────────────────────────────────────────────┐
│              CoinGecko Live Market API                   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│       Services Layer (src/services/coinGeckoApi.ts)      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│            Data Transformer & Physics Engine             │
│    (dataTransformer.ts, dataSimulator.ts, collision)     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│           State Manager Hook (useRealTimeData)           │
└────────────┬───────────────────────┬─────────────────────┘
             │                       │                     │
             ▼                       ▼                     ▼
  ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐
  │ 2D SVG Canvas      │  │ 3D Three.js WebGL │  │ WebXR VR Canvas  │
  │ (Dashboard.tsx)    │  │ (Dashboard3D.tsx) │  │ (DashboardVR.tsx)│
  └────────────────────┘  └───────────────────┘  └──────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend Core:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **3D & VR Engines:** Three.js, WebGL, WebXR Device API
- **State & Data Handling:** Custom React Hooks (`useRealTimeData`), CoinGecko REST API integration
- **Styling & Icons:** Tailwind CSS, Lucide Icons
- **Verification & Testing:** Python 3 (PIL/Pillow visual verification scripts)

---

## 🔒 Security & Environment Secrets Management

1. **Client-Side API Key Protection:**
   - In Vite applications, environment variables prefixed with `VITE_` are exposed in client bundle code.
   - For open-source usage, BlotChain connects by default to CoinGecko's public endpoint (`https://api.coingecko.com/api/v3`) without exposing private API keys.
2. **Local Environment Variables:**
   - Optional demo keys (`x_cg_demo_api_key`) should be defined in a `.env.local` file (ignored by `.git`).
   - `.env.example` provides template configurations without sensitive secrets.

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm** or **bun** / **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/rezon99/BlotChain.git
cd BlotChain
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
VITE_COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
VITE_COINGECKO_API_KEY=
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` (or the port indicated in your console) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🚀 Product Roadmap & Backlog

The following features represent planned enhancements and future architecture milestones:

### 1. MEV Shield & On-Chain Threat Analytics
- **Live Threat Monitoring:** Detection and real-time visualization of sandwich attacks, frontrunning, and arbitrage exploitation.
- **Risk Scoring & Protection:** Dynamic MEV risk metrics, transaction bundle simulation, and private RPC protection status indicators.

### 2. Web3 NFT State Snapshot & Automation Layer
- **Automated Snapshot Bot:** Headless Puppeteer bot for capturing high-resolution dashboard canvas snapshots in `snapshotMode=1`.
- **On-Chain Persistence:** Solidity ERC-721 smart contract (`BlotChainSnapshot.sol`) for minting visual state snapshots as NFTs.
- **Decentralized Storage & Alerts:** Metadata and image pinning to IPFS/NFT.Storage, accompanied by automated Telegram channel alerts.

### 3. Asset Analytics & WebGL Scaling
- **Return Correlation Matrix:** Cross-asset return correlation heatmap computation across multiple time windows.
- **High-Scale Spatial Rendering:** Optimization of the 3D WebGL rendering pipeline to support fluid visualization of 500+ simultaneous crypto assets.
- **Serverless API Proxy:** Production Edge Proxy integration to completely insulate API keys from client-side network inspection.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
