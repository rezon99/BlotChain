# BlotChain Automation Layer

This directory contains the background services and automation logic for the BlotChain platform. This layer is entirely independent and does not affect the build, deployment, or execution of the main Vite dashboard app.

## Package Structure

1. **`shared/`** — Shared TypeScript types (reusing types from `src/types/index.ts`) and definitions for metadata schemas.
2. **`contract/`** — Hardhat project for compiling, testing, and deploying the ERC-721 contract that represents dashboard snapshots as NFTs.
3. **`bot/`** — Orchestrator + snapshot logic. Uses Puppeteer to take headless snapshots of the dashboard, uploads assets/metadata to IPFS, mints NFTs via the deployed contract, and updates/notifies via Telegram.

## Configuration

Ensure the environment variables listed in the root `.env.example` are set before running the automation script.
