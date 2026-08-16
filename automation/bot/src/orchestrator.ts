import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import contractConfig from '@blotchain/automation-shared/contract-config.json' with { type: 'json' };
import { captureSnapshot, SnapshotResult } from './snapshot.js';
import { buildAndUploadSnapshotMetadata } from './metadata.js';

dotenv.config();

export interface LatestSnapshotData {
  tokenId: number;
  imageUrl: string;
  metadataUri: string;
  mintPrice: string;
  timestamp: string;
  openSeaUrl: string;
}

export interface OrchestratorOptions {
  snapshotUrl?: string;
  retryDelays?: number[];
  maxRetries?: number;
}

/**
 * Resolves file paths relative to `automation/bot` directory regardless of whether process.cwd()
 * is at the project root or inside `automation/bot`.
 */
export function getBotFilePath(filename: string): string {
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
      if (pkg.name === '@blotchain/automation-bot') {
        return path.join(process.cwd(), filename);
      }
    } catch {
      // Fallback
    }
  }
  return path.join(process.cwd(), 'automation/bot', filename);
}

export function appendMintLog(message: string): void {
  const logFilePath = getBotFilePath('mint.log');
  const dir = path.dirname(logFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(logFilePath, `${message}\n`, 'utf-8');
}

export function readMintLogContent(): string {
  const logFilePath = getBotFilePath('mint.log');
  if (!fs.existsSync(logFilePath)) {
    return '';
  }
  try {
    return fs.readFileSync(logFilePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Checks if a successful mint occurred within the last 25 minutes.
 */
export function checkIdempotency(windowMinutes: number = 25): boolean {
  const logContent = readMintLogContent();
  if (!logContent) {
    return false;
  }

  const lines = logContent.split('\n');
  // Look for log entries with STATUS: SUCCESS
  let lastSuccessTime: number | null = null;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.includes('STATUS: SUCCESS')) {
      const match = line.match(/^\[(.*?)\]/);
      if (match && match[1]) {
        const timestamp = new Date(match[1]).getTime();
        if (!isNaN(timestamp)) {
          lastSuccessTime = timestamp;
          break;
        }
      }
    }
  }

  if (!lastSuccessTime) {
    return false;
  }

  const diffMs = Date.now() - lastSuccessTime;
  const windowMs = windowMinutes * 60 * 1000;
  return diffMs < windowMs;
}

/**
 * Writes the latest successful snapshot details to latest-snapshot.json
 */
export function writeLatestSnapshotJson(data: LatestSnapshotData): void {
  const filePath = getBotFilePath('latest-snapshot.json');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Sends a Telegram notification message if bot token and chat ID are configured.
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      console.warn(`Telegram API error: ${response.status} ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`Failed to send Telegram message: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Helper to sleep for a given number of milliseconds.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a single mint cycle step-by-step:
 * 1. Capture snapshot
 * 2. Upload image and metadata to Pinata / IPFS
 * 3. Connect to Polygon via ethers.js and call mintSnapshot() on contract
 * 4. Wait for receipt and parse tokenId from SnapshotMinted event
 * 5. Update mint.log and latest-snapshot.json
 * 6. Send Telegram notification
 */
export async function executeSingleMintAttempt(snapshotUrl?: string): Promise<LatestSnapshotData> {
  const nowUtc = new Date().toISOString();
  appendMintLog(`[${nowUtc}] STEP: Starting snapshot capture...`);

  // Step 1: Capture snapshot
  const targetUrl = snapshotUrl || process.env.DASHBOARD_SNAPSHOT_URL;
  const snapshotResult: SnapshotResult = await captureSnapshot(targetUrl);
  appendMintLog(`[${snapshotResult.timestamp}] STEP: Snapshot captured successfully.`);

  // Step 2: Build & Upload metadata
  appendMintLog(`[${new Date().toISOString()}] STEP: Uploading snapshot image and metadata to Pinata...`);
  const metaResult = await buildAndUploadSnapshotMetadata(snapshotResult.imageBuffer);
  appendMintLog(
    `[${new Date().toISOString()}] STEP: Metadata uploaded. Snapshot #${metaResult.snapshotNumber} | Image CID: ${metaResult.imageCid} | Metadata CID: ${metaResult.metadataCid}`
  );

  // Step 3: Connect to Polygon via ethers.js
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const privateKey =
    process.env.OPERATOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  const contractAddress = process.env.CONTRACT_ADDRESS || contractConfig.address;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, contractConfig.abi, wallet);

  appendMintLog(`[${new Date().toISOString()}] STEP: Executing mintSnapshot on-chain for operator ${wallet.address}...`);

  // Step 4: Mint on-chain
  const tx = await contract.mintSnapshot(wallet.address, metaResult.tokenUri);
  const receipt = await tx.wait();

  // Step 5: Extract tokenId from SnapshotMinted event
  let tokenId = 0;
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && (parsed.name === 'SnapshotMinted' || parsed.name === 'Transfer')) {
          const id = parsed.args.tokenId ?? parsed.args[0];
          if (id !== undefined) {
            tokenId = Number(id);
            break;
          }
        }
      } catch {
        // Ignore unparseable logs
      }
    }
  }

  let mintPriceStr = '0';
  try {
    const price = await contract.mintPrice();
    mintPriceStr = price.toString();
  } catch {
    mintPriceStr = '0';
  }

  const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
  const cleanGateway = gateway.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const imageUrl = `https://${cleanGateway}/ipfs/${metaResult.imageCid}`;
  const openSeaUrl = `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;

  const latestData: LatestSnapshotData = {
    tokenId,
    imageUrl,
    metadataUri: metaResult.tokenUri,
    mintPrice: mintPriceStr,
    timestamp: snapshotResult.timestamp,
    openSeaUrl,
  };

  // Step 6: Log success to mint.log
  const successLogMsg = `[${latestData.timestamp}] STATUS: SUCCESS | Snapshot #: ${metaResult.snapshotNumber} | Image CID: ${metaResult.imageCid} | Metadata CID: ${metaResult.metadataCid} | Token ID: ${tokenId} | Tx Hash: ${receipt.hash}`;
  appendMintLog(successLogMsg);

  // Step 7: Write to latest-snapshot.json
  writeLatestSnapshotJson(latestData);

  // Step 8: Send Telegram success notification
  const telegramSuccessMsg = `✅ <b>Snapshot Minted Successfully!</b>\n\nToken ID: <code>${tokenId}</code>\nSnapshot #: <code>${metaResult.snapshotNumber}</code>\nOpenSea: <a href="${openSeaUrl}">${openSeaUrl}</a>`;
  await sendTelegramNotification(telegramSuccessMsg);

  return latestData;
}

/**
 * Main orchestrator entry point.
 * Checks idempotency guard, and runs the mint cycle with up to 3 retries (2s, 4s, 8s backoff).
 */
export async function runOrchestrator(options: OrchestratorOptions = {}): Promise<LatestSnapshotData | null> {
  const { snapshotUrl, retryDelays = [2000, 4000, 8000], maxRetries = 3 } = options;

  appendMintLog(`[${new Date().toISOString()}] ORCHESTRATOR: Checking idempotency guard...`);

  // Idempotency check: Skip if run within last 25 minutes
  if (checkIdempotency(25)) {
    const skipMsg = `[${new Date().toISOString()}] ORCHESTRATOR: Idempotency check triggered. Successful mint occurred within the last 25 minutes. Skipping cycle.`;
    console.log(skipMsg);
    appendMintLog(skipMsg);
    return null;
  }

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      appendMintLog(`[${new Date().toISOString()}] ORCHESTRATOR: Attempt ${attempt}/${maxRetries} starting...`);
      const result = await executeSingleMintAttempt(snapshotUrl);
      appendMintLog(`[${new Date().toISOString()}] ORCHESTRATOR: Attempt ${attempt} completed successfully.`);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const failLogMsg = `[${new Date().toISOString()}] STATUS: FAILURE | Attempt: ${attempt}/${maxRetries} | Error: ${lastError.message}`;
      console.error(failLogMsg);
      appendMintLog(failLogMsg);

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1] ?? 2000;
        appendMintLog(`[${new Date().toISOString()}] ORCHESTRATOR: Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  // Final failure after max retries
  const finalErrorMsg = lastError ? lastError.message : 'Unknown error across all retry attempts';
  const finalFailLog = `[${new Date().toISOString()}] STATUS: FINAL_FAILURE | Exceeded ${maxRetries} attempts | Error: ${finalErrorMsg}`;
  appendMintLog(finalFailLog);

  const telegramFailMsg = `❌ <b>Snapshot Mint Failed!</b>\n\nAll ${maxRetries} retry attempts failed.\nError: <code>${finalErrorMsg}</code>`;
  await sendTelegramNotification(telegramFailMsg);

  throw new Error(`Orchestrator failed after ${maxRetries} attempts: ${finalErrorMsg}`);
}
