import { App, LogLevel } from '@slack/bolt';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { handleFileUpload } from './handlers';

export class SlackBot {
  private app: App;

  constructor() {
    this.app = new App({
      token: config.slack.botToken,
      signingSecret: config.slack.signingSecret,
      logLevel: config.app.logLevel === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
    });

    this.setupEventHandlers();
    this.setupHealthCheck();
  }

  private setupEventHandlers(): void {
    // Listen for file_shared events in the specific channel
    this.app.event('file_shared', async ({ event, client }) => {
      try {
        logger.info('File shared event received', { fileId: event.file_id });

        // Get file info
        const result = await client.files.info({
          file: event.file_id,
        });

        logger.info('File info received', {
          fileId: event.file_id,
          hasFile: !!result.file,
          fileName: result.file?.name,
          mimetype: result.file?.mimetype,
          channels: result.file?.channels
        });

        if (!result.file) {
          logger.error('File info not found', { fileId: event.file_id });
          return;
        }

        const file = result.file;

        // Note: file.channels may be empty even when shared in a channel
        // We rely on Slack's event routing to ensure we only get events from monitored channels
        logger.info('File is a PDF, processing...', {
          fileId: event.file_id,
          fileName: file.name,
          channels: file.channels,
        });

        // Check if file is a PDF
        if (file.mimetype !== 'application/pdf') {
          logger.info('File is not a PDF, ignoring', {
            fileId: event.file_id,
            mimetype: file.mimetype,
          });

          // Optionally reply to user
          await client.chat.postMessage({
            channel: config.slack.channelId,
            text: `⚠️ Only PDF files are supported. Received: ${file.mimetype}`,
            thread_ts: event.file_id, // Reply in thread if possible
          });
          return;
        }

        // Handle the PDF upload
        await handleFileUpload(file, client);
      } catch (error) {
        logger.error('Error handling file_shared event', {
          error: error instanceof Error ? error.message : String(error),
          event,
        });
      }
    });

    // Listen for app mentions (for debugging/help)
    this.app.event('app_mention', async ({ event, client }) => {
      try {
        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.ts,
          text: '👋 Hi! I automatically upload Selbstauskunft PDFs to Europace. Just upload a PDF to the monitored channel and I\'ll process it!',
        });
      } catch (error) {
        logger.error('Error handling app_mention', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  private setupHealthCheck(): void {
    // Add health check endpoint for Docker
    // Access the Express app through receiver
    try {
      const receiver = (this.app as any).receiver;
      const router = receiver?.router || receiver?.app;

      if (router && typeof router.get === 'function') {
        router.get('/health', (req: any, res: any) => {
          res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'europace-upload-bot',
          });
        });
        logger.info('Health check endpoint configured at /health');
      } else {
        logger.warn('Could not set up health check endpoint');
      }
    } catch (error) {
      logger.warn('Health check setup failed, continuing without it', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async start(): Promise<void> {
    try {
      await this.app.start(config.app.port);
      logger.info('Slack bot is running!', {
        port: config.app.port,
        channelId: config.slack.channelId,
      });
    } catch (error) {
      logger.error('Failed to start Slack bot', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.app.stop();
      logger.info('Slack bot stopped');
    } catch (error) {
      logger.error('Error stopping Slack bot', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public getApp(): App {
    return this.app;
  }
}
