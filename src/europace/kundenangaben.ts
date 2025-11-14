import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { oauth2TokenManager } from './oauth';

export interface VorgangData {
  // Adjust these fields based on your Europace API documentation
  // These are common fields for Baufinanzierung applications
  kundenAngaben?: {
    vorname?: string;
    nachname?: string;
    email?: string;
  };
  finanzierungsBedarf?: {
    finanzierungszweck?: string;
  };
  // Add more fields as needed from your API docs
}

export interface VorgangResponse {
  vorgangsnummer: string;
  // Add other response fields from your API
}

export class KundenangabenClient {
  private client: AxiosInstance;

  constructor() {
    // Note: datenkontext (TEST_MODUS vs ECHT_GESCHAEFT) is specified in the payload,
    // not as a header. See importMetadaten.datenkontext in the request body.
    this.client = axios.create({
      baseURL: config.europace.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to inject OAuth2 token
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = await oauth2TokenManager.getAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;

        // Log the request for debugging
        logger.info('Sending request to Europace', {
          url: `${config.baseURL}${config.url}`,
          method: config.method,
          hasAuthHeader: !!config.headers.Authorization,
          authHeaderPrefix: config.headers.Authorization?.substring(0, 20) + '...',
        });

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Europace Kundenangaben API error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Create a new Vorgang (process) in Europace
   * Uses comprehensive payload structure from europaceMapper
   */
  async createVorgang(payload: any): Promise<VorgangResponse> {
    try {
      logger.info('Creating Vorgang in Europace');

      // Log COMPLETE payload for debugging
      logger.info('FULL Vorgang payload', JSON.stringify(payload, null, 2));

      // Log payload for debugging (only first level to avoid massive logs)
      const payloadSummary = {
        datenkontext: payload.importMetadaten?.datenkontext,
        externeVorgangsId: payload.importMetadaten?.externeVorgangsId,
        vorname: payload.kundenangaben?.haushalte?.[0]?.personen?.[0]?.personendaten?.vorname,
        nachname: payload.kundenangaben?.haushalte?.[0]?.personen?.[0]?.personendaten?.nachname,
        email: payload.kundenangaben?.haushalte?.[0]?.personen?.[0]?.personendaten?.email,
        kaufpreis: payload.kundenangaben?.finanzierungsbedarf?.kaufpreis,
        hasVorgangsname: 'vorgangsname' in payload,
        vorgangsname: payload.vorgangsname,
      };
      logger.info('Vorgang payload summary', payloadSummary);

      const traceId = `slack-upload-${Date.now()}`;
      const response = await this.client.post<VorgangResponse>(
        '/kundenangaben',
        payload,
        {
          headers: {
            'X-TraceId': traceId,
          },
        }
      );

      logger.info('Vorgang created successfully', {
        vorgangsnummer: response.data.vorgangsnummer,
        traceId,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create Vorgang', {
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
      throw new Error('Failed to create Vorgang in Europace');
    }
  }

  /**
   * Get Vorgang details by ID
   */
  async getVorgang(vorgangsnummer: string): Promise<VorgangResponse> {
    try {
      const response = await this.client.get<VorgangResponse>(
        `/v2/vorgaenge/${vorgangsnummer}`
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get Vorgang', {
        vorgangsnummer,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to get Vorgang from Europace');
    }
  }

  /**
   * Get complete Kundenangaben payload for a Vorgang
   */
  async getKundenangaben(vorgangsnummer: string): Promise<any> {
    try {
      logger.info('Fetching Kundenangaben from Europace', { vorgangsnummer });

      const response = await this.client.get(
        `/kundenangaben/vorgaenge/${vorgangsnummer}`
      );

      logger.info('Kundenangaben retrieved successfully', { vorgangsnummer });

      return response.data;
    } catch (error) {
      logger.error('Failed to get Kundenangaben', {
        vorgangsnummer,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
      throw new Error('Failed to get Kundenangaben from Europace');
    }
  }

  /**
   * Update Vorgang name
   * Must be called after Vorgang creation to set a custom name
   */
  async updateVorgangName(vorgangsnummer: string, vorgangsname: string): Promise<void> {
    try {
      logger.info('Updating Vorgang name', { vorgangsnummer, vorgangsname });

      // Use JSON Patch format (RFC 6902) as required by Europace API
      const patchPayload = [
        {
          op: 'add',
          path: '/vorgangsname',
          value: vorgangsname,
        },
      ];

      await this.client.patch(
        `/v2/vorgaenge/${vorgangsnummer}`,
        patchPayload,
        {
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
        }
      );

      logger.info('Vorgang name updated successfully', { vorgangsnummer, vorgangsname });
    } catch (error) {
      logger.error('Failed to update Vorgang name', {
        vorgangsnummer,
        vorgangsname,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
      // Don't throw - we don't want to fail the entire upload if name update fails
      logger.warn('Continuing despite Vorgang name update failure');
    }
  }
}
