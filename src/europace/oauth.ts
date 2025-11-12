import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

class OAuth2TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Get a valid access token (cached or fetch new one)
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      logger.debug('Using cached access token');
      return this.accessToken;
    }

    // Fetch a new token
    logger.info('Fetching new OAuth2 access token from Europace');
    return await this.fetchNewToken();
  }

  /**
   * Fetch a new access token using client credentials flow
   */
  private async fetchNewToken(): Promise<string> {
    try {
      const response = await axios.post<TokenResponse>(
        config.europace.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(
              `${config.europace.clientId}:${config.europace.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry 60 seconds before actual expiry to avoid edge cases
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      logger.info('Successfully obtained OAuth2 access token', {
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      });

      return this.accessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Failed to obtain OAuth2 access token', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        logger.error('Failed to obtain OAuth2 access token', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error('Failed to obtain OAuth2 access token');
    }
  }

  /**
   * Clear the cached token (useful for testing or error recovery)
   */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    logger.debug('Cleared cached OAuth2 token');
  }
}

// Singleton instance
export const oauth2TokenManager = new OAuth2TokenManager();
