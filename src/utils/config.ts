import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file and override system environment variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  // Force override system environment variables with .env values
  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key];
  });
}

export interface Config {
  slack: {
    botToken: string;
    signingSecret: string;
    channelId: string;
  };
  europace: {
    apiUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    testMode: boolean;
  };
  app: {
    nodeEnv: string;
    logLevel: string;
    port: number;
  };
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config: Config = {
  slack: {
    botToken: getEnvVar('SLACK_BOT_TOKEN'),
    signingSecret: getEnvVar('SLACK_SIGNING_SECRET'),
    channelId: getEnvVar('SLACK_CHANNEL_ID'),
  },
  europace: {
    apiUrl: getEnvVar('EUROPACE_API_URL'),
    tokenUrl: getEnvVar('EUROPACE_TOKEN_URL'),
    clientId: getEnvVar('EUROPACE_CLIENT_ID'),
    clientSecret: getEnvVar('EUROPACE_CLIENT_SECRET'),
    testMode: getEnvVar('EUROPACE_TEST_MODE', false) === 'true',
  },
  app: {
    nodeEnv: getEnvVar('NODE_ENV', false) || 'development',
    logLevel: getEnvVar('LOG_LEVEL', false) || 'info',
    port: parseInt(getEnvVar('PORT', false) || '3000', 10),
  },
};
