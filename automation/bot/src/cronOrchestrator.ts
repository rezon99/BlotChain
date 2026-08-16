import fs from 'fs';
import path from 'path';
import { captureSnapshot } from './snapshot.js';
import { mintSnapshotOnChain, getContractAddress } from './contractClient.js';

export interface MintResult {
  tokenId: number;
  openSeaUrl: string;
  timestamp: string;
  ipfsHash?: string;
}

const LOG_FILE_PATH = path.join(process.cwd(), 'bot-mint-log.json');

export interface MintLogData {
  lastMintTimestamp: string;
  lastTokenId: number;
  lastOpenSeaUrl: string;
  history: Array<{
    tokenId: number;
    timestamp: string;
    openSeaUrl: string;
    ipfsHash?: string;
  }>;
}

export function readMintLog(): MintLogData {
  if (!fs.existsSync(LOG_FILE_PATH)) {
    return {
      lastMintTimestamp: 'Never',
      lastTokenId: 0,
      lastOpenSeaUrl: '',
      history: []
    };
  }
  try {
    const raw = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      lastMintTimestamp: 'Never',
      lastTokenId: 0,
      lastOpenSeaUrl: '',
      history: []
    };
  }
}

export function writeMintLog(result: MintResult): void {
  const logData = readMintLog();
  logData.lastMintTimestamp = result.timestamp;
  logData.lastTokenId = result.tokenId;
  logData.lastOpenSeaUrl = result.openSeaUrl;
  logData.history.push({
    tokenId: result.tokenId,
    timestamp: result.timestamp,
    openSeaUrl: result.openSeaUrl,
    ipfsHash: result.ipfsHash
  });

  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logData, null, 2), 'utf-8');
}

export async function runMintPipeline(): Promise<MintResult> {
  const snapshot = await captureSnapshot();

  // Simulated metadata IPFS upload or mock IPFS hash
  const ipfsHash = 'ipfs://Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const metadataUri = `${ipfsHash}/metadata.json`;

  const tokenId = await mintSnapshotOnChain(metadataUri);
  const contractAddress = getContractAddress();
  const openSeaUrl = `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;

  const result: MintResult = {
    tokenId,
    openSeaUrl,
    timestamp: snapshot.timestamp,
    ipfsHash
  };

  writeMintLog(result);

  return result;
}
