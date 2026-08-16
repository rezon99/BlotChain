import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { setupTelegramCommands } from './telegramCommands.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN environment variable is not set.');
  process.exit(1);
}

console.log('Starting BlotChain Telegram Bot in polling mode...');
const bot = new TelegramBot(token, { polling: true });

setupTelegramCommands(bot);

console.log('BlotChain Telegram Bot is listening for commands.');

process.on('SIGINT', () => {
  console.log('Stopping bot polling...');
  bot.stopPolling();
  process.exit(0);
});
