import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import EventEmitter from 'events';

// Mocks
const mockRunMintPipeline = jest.fn<() => Promise<any>>();
const mockReadMintLog = jest.fn<() => any>();
const mockBurnSnapshotToken = jest.fn<(tokenId: string | number) => Promise<any>>();
const mockGetTotalSupply = jest.fn<() => Promise<number>>();
const mockGetOperatorBalance = jest.fn<() => Promise<string>>();

jest.unstable_mockModule('../src/cronOrchestrator.js', () => ({
  runMintPipeline: mockRunMintPipeline,
  readMintLog: mockReadMintLog,
}));

jest.unstable_mockModule('../src/contractClient.js', () => ({
  burnSnapshotToken: mockBurnSnapshotToken,
  getTotalSupply: mockGetTotalSupply,
  getOperatorBalance: mockGetOperatorBalance,
  getContractAddress: () => '0x5FbDB2315678afecb367f032d93F642f64180aa3',
}));

const { setupTelegramCommands } = await import('../src/telegramCommands.js');

class MockTelegramBot extends EventEmitter {
  sendMessage = jest.fn<any>();
}

describe('Telegram Commands', () => {
  let bot: MockTelegramBot;
  const ALLOWED_CHAT_ID = '123456789';
  const UNAUTHORIZED_CHAT_ID = '987654321';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TELEGRAM_CHAT_ID = ALLOWED_CHAT_ID;
    bot = new MockTelegramBot();
    setupTelegramCommands(bot as any);
  });

  describe('Authorization checks', () => {
    it('should reject unauthorized chat ID with "Unauthorized" and call no contract functions', async () => {
      const msg = {
        chat: { id: UNAUTHORIZED_CHAT_ID },
        text: '/mint',
      };

      bot.emit('message', msg);

      // Wait brief microtask queue
      await new Promise((r) => setTimeout(r, 50));

      expect(bot.sendMessage).toHaveBeenCalledWith(UNAUTHORIZED_CHAT_ID, 'Unauthorized');
      expect(mockRunMintPipeline).not.toHaveBeenCalled();
      expect(mockBurnSnapshotToken).not.toHaveBeenCalled();
      expect(mockGetTotalSupply).not.toHaveBeenCalled();
      expect(mockGetOperatorBalance).not.toHaveBeenCalled();
    });
  });

  describe('/mint command', () => {
    it('should trigger mint pipeline and send success message with tokenId and OpenSea link', async () => {
      mockRunMintPipeline.mockResolvedValueOnce({
        tokenId: 42,
        openSeaUrl: 'https://opensea.io/assets/matic/0x5FbDB2315678afecb367f032d93F642f64180aa3/42',
        timestamp: '2026-08-16T10:00:00.000Z',
      });

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/mint',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(mockRunMintPipeline).toHaveBeenCalled();
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('Token ID: 42')
      );
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('https://opensea.io/assets/matic/')
      );
    });

    it('should reply with error message if mint pipeline fails', async () => {
      mockRunMintPipeline.mockRejectedValueOnce(new Error('RPC network connection error'));

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/mint',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('❌ Mint Failed: RPC network connection error')
      );
    });
  });

  describe('/burn command', () => {
    it('should call burnSnapshotToken with specified tokenId and return success txHash', async () => {
      mockBurnSnapshotToken.mockResolvedValueOnce({
        success: true,
        txHash: '0xabc123',
      });

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/burn 42',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(mockBurnSnapshotToken).toHaveBeenCalledWith('42');
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('🔥 Token 42 burned successfully! Tx Hash: 0xabc123')
      );
    });

    it('should handle revert reason when burn fails (e.g. publicMint or unauthorized)', async () => {
      mockBurnSnapshotToken.mockResolvedValueOnce({
        success: false,
        error: 'ERC721IncorrectOwner: caller is not token owner or approved',
      });

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/burn 99',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(mockBurnSnapshotToken).toHaveBeenCalledWith('99');
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('❌ Burn Failed: ERC721IncorrectOwner')
      );
    });
  });

  describe('/status command', () => {
    it('should reply with total supply, operator balance, and last mint timestamp', async () => {
      mockGetTotalSupply.mockResolvedValueOnce(15);
      mockGetOperatorBalance.mockResolvedValueOnce('2.5');
      mockReadMintLog.mockReturnValueOnce({
        lastMintTimestamp: '2026-08-16T12:00:00.000Z',
        lastTokenId: 15,
        lastOpenSeaUrl: '',
        history: [],
      });

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/status',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(mockGetTotalSupply).toHaveBeenCalled();
      expect(mockGetOperatorBalance).toHaveBeenCalled();
      expect(mockReadMintLog).toHaveBeenCalled();
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        expect.stringContaining('Total NFT Supply: 15\nOperator Balance: 2.5 MATIC\nLast Successful Mint: 2026-08-16T12:00:00.000Z')
      );
    });
  });

  describe('/balance command', () => {
    it('should reply with operator wallet MATIC balance', async () => {
      mockGetOperatorBalance.mockResolvedValueOnce('5.75');

      const msg = {
        chat: { id: ALLOWED_CHAT_ID },
        text: '/balance',
      };

      bot.emit('message', msg);
      await new Promise((r) => setTimeout(r, 50));

      expect(mockGetOperatorBalance).toHaveBeenCalled();
      expect(bot.sendMessage).toHaveBeenLastCalledWith(
        ALLOWED_CHAT_ID,
        '💰 Operator Wallet Balance: 5.75 MATIC'
      );
    });
  });
});
