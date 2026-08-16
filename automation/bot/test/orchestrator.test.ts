import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ESM Mocks via jest.unstable_mockModule
const mockCaptureSnapshot = jest.fn<() => Promise<{ imageBuffer: Buffer; timestamp: string }>>();
const mockBuildAndUploadSnapshotMetadata = jest.fn<() => Promise<{
  tokenUri: string;
  imageCid: string;
  metadataCid: string;
  snapshotNumber: number;
  metadata: Record<string, unknown>;
}>>();

const mockMintSnapshot = jest.fn<() => Promise<{ wait: () => Promise<{ hash: string; logs: Array<{ topic: string }> }> }>>();
const mockMintPrice = jest.fn<() => Promise<bigint>>();
const mockParseLog = jest.fn<() => { name: string; args: { tokenId: bigint } } | null>();

jest.unstable_mockModule('../src/snapshot.js', () => ({
  captureSnapshot: mockCaptureSnapshot,
}));

jest.unstable_mockModule('../src/metadata.js', () => ({
  buildAndUploadSnapshotMetadata: mockBuildAndUploadSnapshotMetadata,
}));

class MockJsonRpcProvider {}
class MockWallet {
  address = '0x1234567890123456789012345678901234567890';
}

class MockContract {
  interface = {
    parseLog: mockParseLog,
  };
  mintSnapshot = mockMintSnapshot;
  mintPrice = mockMintPrice;
}

jest.unstable_mockModule('ethers', () => ({
  ethers: {
    JsonRpcProvider: MockJsonRpcProvider,
    Wallet: MockWallet,
    Contract: MockContract,
  },
}));

// Import orchestrator dynamically after setup of mocks
const {
  runOrchestrator,
  checkIdempotency,
  getBotFilePath,
  readMintLogContent,
} = await import('../src/orchestrator.js');

describe('orchestrator unit tests', () => {
  const mintLogPath = getBotFilePath('mint.log');
  const latestSnapshotPath = getBotFilePath('latest-snapshot.json');
  let originalEnv: Record<string, string | undefined>;
  let globalFetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '123456';
    process.env.PINATA_GATEWAY = 'gateway.pinata.cloud';
    process.env.CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // Reset mock functions
    mockCaptureSnapshot.mockReset();
    mockBuildAndUploadSnapshotMetadata.mockReset();
    mockMintSnapshot.mockReset();
    mockMintPrice.mockReset();
    mockParseLog.mockReset();

    // Setup global fetch mock
    globalFetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('api.telegram.org')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, statusText: 'OK' });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    // Clean up log and JSON files before each test
    if (fs.existsSync(mintLogPath)) fs.unlinkSync(mintLogPath);
    if (fs.existsSync(latestSnapshotPath)) fs.unlinkSync(latestSnapshotPath);
  });

  afterEach(() => {
    process.env = originalEnv;
    globalFetchSpy.mockRestore();
    if (fs.existsSync(mintLogPath)) fs.unlinkSync(mintLogPath);
    if (fs.existsSync(latestSnapshotPath)) fs.unlinkSync(latestSnapshotPath);
  });

  it('runs full end-to-end mint cycle successfully in correct order', async () => {
    const mockImageBuffer = Buffer.from('fake-image-bytes');
    const mockTimestamp = '2025-05-10T14:30:00.000Z';

    mockParseLog.mockReturnValue({
      name: 'SnapshotMinted',
      args: { tokenId: 7n },
    });

    mockMintPrice.mockResolvedValue(0n);

    const callOrder: string[] = [];

    mockCaptureSnapshot.mockImplementation(async () => {
      callOrder.push('captureSnapshot');
      return { imageBuffer: mockImageBuffer, timestamp: mockTimestamp };
    });

    mockBuildAndUploadSnapshotMetadata.mockImplementation(async () => {
      callOrder.push('buildAndUploadSnapshotMetadata');
      return {
        tokenUri: 'ipfs://QmMetadataCid123',
        imageCid: 'QmImageCid456',
        metadataCid: 'QmMetadataCid123',
        snapshotNumber: 7,
        metadata: { name: 'BlotChain Snapshot #7' },
      };
    });

    mockMintSnapshot.mockImplementation(async () => {
      callOrder.push('mintSnapshot');
      return {
        wait: async () => ({
          hash: '0xTxHash999',
          logs: [{ topic: '0x123' }],
        }),
      };
    });

    const result = await runOrchestrator({ snapshotUrl: 'http://localhost:5173' });

    expect(result).not.toBeNull();
    expect(result?.tokenId).toBe(7);
    expect(result?.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/QmImageCid456');
    expect(result?.metadataUri).toBe('ipfs://QmMetadataCid123');
    expect(result?.openSeaUrl).toBe('https://opensea.io/assets/matic/0x5FbDB2315678afecb367f032d93F642f64180aa3/7');

    // Verify order of calls
    expect(callOrder).toEqual(['captureSnapshot', 'buildAndUploadSnapshotMetadata', 'mintSnapshot']);

    // Verify latest-snapshot.json contents
    expect(fs.existsSync(latestSnapshotPath)).toBe(true);
    const latestJson = JSON.parse(fs.readFileSync(latestSnapshotPath, 'utf-8'));
    expect(latestJson.tokenId).toBe(7);
    expect(latestJson.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/QmImageCid456');

    // Verify mint.log contents
    const logText = readMintLogContent();
    expect(logText).toContain('STATUS: SUCCESS');
    expect(logText).toContain('Token ID: 7');
    expect(logText).toContain('Tx Hash: 0xTxHash999');

    // Verify Telegram call
    expect(globalFetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org/bottest-token/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Snapshot Minted Successfully'),
      })
    );
  });

  it('respects idempotency and skips execution if a successful mint occurred <25 mins ago', async () => {
    const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 mins ago
    const logContent = `[${recentTime}] STATUS: SUCCESS | Snapshot #: 1 | Image CID: Qm1 | Metadata CID: Qm2 | Token ID: 1 | Tx Hash: 0x1\n`;

    fs.mkdirSync(path.dirname(mintLogPath), { recursive: true });
    fs.writeFileSync(mintLogPath, logContent, 'utf-8');

    expect(checkIdempotency(25)).toBe(true);

    const result = await runOrchestrator();

    expect(result).toBeNull();
    expect(mockCaptureSnapshot).not.toHaveBeenCalled();
    expect(mockBuildAndUploadSnapshotMetadata).not.toHaveBeenCalled();
    expect(mockMintSnapshot).not.toHaveBeenCalled();
  });

  it('retries on failure with backoff and succeeds on retry', async () => {
    let attemptCount = 0;

    mockCaptureSnapshot.mockImplementation(async () => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Transient Network Error');
      }
      return {
        imageBuffer: Buffer.from('fake'),
        timestamp: new Date().toISOString(),
      };
    });

    mockBuildAndUploadSnapshotMetadata.mockResolvedValue({
      tokenUri: 'ipfs://QmMeta',
      imageCid: 'QmImg',
      metadataCid: 'QmMeta',
      snapshotNumber: 1,
      metadata: {},
    });

    mockMintSnapshot.mockResolvedValue({
      wait: async () => ({
        hash: '0xRetryTx',
        logs: [{ topic: '0x123' }],
      }),
    });

    mockParseLog.mockReturnValue({
      name: 'SnapshotMinted',
      args: { tokenId: 10n },
    });

    const result = await runOrchestrator({ retryDelays: [1, 1, 1], maxRetries: 3 });

    expect(attemptCount).toBe(2);
    expect(result).not.toBeNull();
    expect(result?.tokenId).toBe(10);

    const logText = readMintLogContent();
    expect(logText).toContain('STATUS: FAILURE | Attempt: 1/3 | Error: Transient Network Error');
    expect(logText).toContain('STATUS: SUCCESS');
  });

  it('logs final failure and sends Telegram notification when all retries fail', async () => {
    mockCaptureSnapshot.mockRejectedValue(new Error('Persistent Snapshot Failure'));

    await expect(runOrchestrator({ retryDelays: [1, 1, 1], maxRetries: 3 })).rejects.toThrow(
      'Orchestrator failed after 3 attempts: Persistent Snapshot Failure'
    );

    const logText = readMintLogContent();
    expect(logText).toContain('STATUS: FINAL_FAILURE | Exceeded 3 attempts | Error: Persistent Snapshot Failure');

    expect(globalFetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org/bottest-token/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Snapshot Mint Failed'),
      })
    );
  });
});
