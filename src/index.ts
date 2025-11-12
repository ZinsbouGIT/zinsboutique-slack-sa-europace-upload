import { SlackBot } from './slack/bot';
import { logger } from './utils/logger';
import { config } from './utils/config';

async function main() {
  try {
    logger.info('Starting Europace Upload Bot', {
      nodeEnv: config.app.nodeEnv,
      channelId: config.slack.channelId,
    });

    const bot = new SlackBot();
    await bot.start();

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      await bot.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    logger.info('Bot is ready and listening for file uploads');
  } catch (error) {
    logger.error('Failed to start bot', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main();
