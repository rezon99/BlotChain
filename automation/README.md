# BlotChain Automation Layer

This directory contains the background services and automation logic for the BlotChain platform. This layer is entirely independent and does not affect the build, deployment, or execution of the main Vite dashboard app.

## Package Structure

1. **`shared/`** — Shared TypeScript types (reusing types from `src/types/index.ts`) and definitions for metadata schemas.
2. **`contract/`** — Hardhat project for compiling, testing, and deploying the ERC-721 contract that represents dashboard snapshots as NFTs (`BlotChainSnapshot.sol`).
3. **`bot/`** — Orchestrator, snapshot logic, and interactive Telegram bot service.
   - Uses Puppeteer to take headless snapshots of the dashboard (`snapshot.ts`).
   - Mints NFTs via the contract client (`contractClient.ts` and `cronOrchestrator.ts`).
   - Provides interactive Telegram commands via `telegramBot.ts` and `telegramCommands.ts`.

## Telegram Bot Service (`bot/src/telegramBot.ts`)

The Telegram Bot service runs in **polling mode** to listen for interactive commands from authorized chat users.

### Interactive Commands
- `/mint` — Triggers immediate snapshot capture, IPFS metadata preparation, and NFT minting outside the 30-minute cron schedule. Returns the tokenId and OpenSea URL.
- `/burn <tokenId>` — Calls `burn(tokenId)` on the contract using the operator wallet. Reverts gracefully if the token is not burnable or not owned.
- `/status` — Displays current NFT total supply, operator wallet MATIC balance, and timestamp of the last successful mint.
- `/balance` — Displays current operator wallet MATIC balance.

### Execution Environment Note
The interactive bot service runs in long-lived polling mode. It **requires a persistent process host that stays alive** (such as a small VPS, Railway, Render background worker, or a Fly.io free tier instance).

> **Important:** GitHub Actions workflows are NOT suitable for running the Telegram polling listener service because GitHub Actions runners terminate after job completion and do not remain alive to listen for incoming Telegram polling updates. GitHub Actions should only be used for scheduled cron jobs or CI workflows.

## Configuration

Ensure the environment variables listed in the root `.env.example` are set (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RPC_URL`, `OPERATOR_PRIVATE_KEY`, `CONTRACT_ADDRESS`) before running the automation bot.
