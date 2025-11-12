import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { oauth2TokenManager } from './oauth';

export interface DocumentUploadResponse {
  id: string; // V2 API returns "id" not "dokumentId"
}

export class UnterlagenClient {
  private client: AxiosInstance;

  constructor() {
    const headers: any = {
      'Accept': 'application/json',
    };

    // Add TEST_MODUS header if in test mode
    if (config.europace.testMode) {
      headers['X-Europace-Vorgang'] = 'TEST_MODUS';
      logger.info('Unterlagen API running in TEST_MODUS');
    } else {
      headers['X-Europace-Vorgang'] = 'ECHT_GESCHAEFT';
      logger.warn('Unterlagen API running in ECHT_GESCHAEFT mode');
    }

    this.client = axios.create({
      baseURL: 'https://api.europace2.de', // Unterlagen API base URL
      timeout: 60000, // Longer timeout for file uploads
      headers,
    });

    // Add request interceptor to inject OAuth2 token
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = await oauth2TokenManager.getAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
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
        logger.error('Europace Unterlagen API error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Upload a document (Selbstauskunft) to a Vorgang
   * @param vorgangsnummer - The Vorgang ID to upload to
   * @param fileBuffer - PDF file as Buffer
   * @param fileName - Name of the file
   */
  async uploadDocument(
    vorgangsnummer: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<DocumentUploadResponse> {
    try {
      logger.info('Uploading document to Europace', {
        vorgangsnummer,
        fileName,
        fileSize: fileBuffer.length,
      });

      // Create form data for multipart upload (V2 API)
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/pdf',
      });

      // Add V2 API required metadata
      formData.append('caseId', vorgangsnummer); // Required: Vorgang ID
      // category is optional - omitting for now to avoid validation errors
      formData.append('displayName', fileName); // Optional: Frontend filename

      // V2 Dokumente API endpoint
      const response = await this.client.post<DocumentUploadResponse>(
        `/v2/dokumente`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      logger.info('Document uploaded successfully', {
        vorgangsnummer,
        documentId: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload document', {
        vorgangsnummer,
        fileName,
        error: error instanceof Error ? error.message : String(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
      throw new Error('Failed to upload document to Europace');
    }
  }

  /**
   * Get list of documents for a Vorgang
   */
  async getDocuments(vorgangsnummer: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/v2/vorgaenge/${vorgangsnummer}/unterlagen`
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get documents', {
        vorgangsnummer,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to get documents from Europace');
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(
    vorgangsnummer: string,
    dokumentId: string
  ): Promise<void> {
    try {
      await this.client.delete(
        `/v2/vorgaenge/${vorgangsnummer}/unterlagen/${dokumentId}`
      );

      logger.info('Document deleted successfully', {
        vorgangsnummer,
        dokumentId,
      });
    } catch (error) {
      logger.error('Failed to delete document', {
        vorgangsnummer,
        dokumentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to delete document from Europace');
    }
  }
}
