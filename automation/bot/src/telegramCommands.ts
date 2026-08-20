import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { runMintPipeline, readMintLog } from './cronOrchestrator.js';
import { burnSnapshotToken, getTotalSupply, getOperatorBalance } from './contractClient.js';

dotenv.config();

export function setupTelegramCommands(bot: TelegramBot): void {
  const allowedChatId = process.env.TELEGRAM_CHAT_ID;

  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim() || '';

    // Ignore messages that are not commands
    if (!text.startsWith('/')) {
      return;
    }

    // Security check: reject any incoming message from non-matching chat ID
    if (!allowedChatId || chatId !== allowedChatId.trim()) {
      await bot.sendMessage(msg.chat.id, 'Unauthorized');
      return;
    }

    const commandParts = text.split(' ');
    const command = commandParts[0].toLowerCase();
    const args = commandParts.slice(1);

    switch (command) {
      case '/mint': {
        await bot.sendMessage(msg.chat.id, '⏳ Starting snapshot capture and NFT minting pipeline...');
        try {
          const result = await runMintPipeline();
          await bot.sendMessage(
            msg.chat.id,
            `✅ Snapshot Minted Successfully!\n\nToken ID: ${result.tokenId}\nOpenSea: ${result.openSeaUrl}`
          );
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred during minting pipeline';
          await bot.sendMessage(msg.chat.id, `❌ Mint Failed: ${errorMsg}`);
        }
        break;
      }

      case '/burn': {
        const tokenId = args[0];
        if (!tokenId) {
          await bot.sendMessage(msg.chat.id, 'Usage: /burn <tokenId>');
          return;
        }

        // Security check: Validate that tokenId is a non-negative integer to prevent unexpected contract inputs or injection
        if (!/^\d+$/.test(tokenId)) {
          await bot.sendMessage(msg.chat.id, '❌ Invalid tokenId. Must be a valid non-negative integer.');
          return;
        }

        await bot.sendMessage(msg.chat.id, `⏳ Attempting to burn token ${tokenId}...`);
        const res = await burnSnapshotToken(tokenId);
        if (res.success) {
          await bot.sendMessage(msg.chat.id, `🔥 Token ${tokenId} burned successfully! Tx Hash: ${res.txHash}`);
        } else {
          await bot.sendMessage(
            msg.chat.id,
            `❌ Burn Failed: ${res.error || 'Contract reverted during burn execution. Check if token was a publicMint purchase or not owned by operator.'}`
          );
        }
        break;
      }

      case '/status': {
        try {
          const [totalSupply, balance, mintLog] = await Promise.all([
            getTotalSupply(),
            getOperatorBalance(),
            readMintLog()
          ]);

          const lastMintTime = mintLog.lastMintTimestamp || 'Never';
          await bot.sendMessage(
            msg.chat.id,
            `📊 BlotChain Bot Status:\n\nTotal NFT Supply: ${totalSupply}\nOperator Balance: ${balance} MATIC\nLast Successful Mint: ${lastMintTime}`
          );
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await bot.sendMessage(msg.chat.id, `❌ Failed to fetch status: ${errorMsg}`);
        }
        break;
      }

      case '/balance': {
        try {
          const balance = await getOperatorBalance();
          await bot.sendMessage(msg.chat.id, `💰 Operator Wallet Balance: ${balance} MATIC`);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await bot.sendMessage(msg.chat.id, `❌ Failed to fetch balance: ${errorMsg}`);
        }
        break;
      }

      default: {
        // Unknown command
        break;
      }
    }
  });
}
