import { KundenangabenClient } from '../europace/kundenangaben';
import { UnterlagenClient } from '../europace/unterlagen';
import { logger } from '../utils/logger';
import { parseWithAI, fillDefaultsForTest } from './aiPdfParser';
import { createEuropacePayload } from './europaceMapper';

export interface ProcessResult {
  vorgangId: string;
  documentId: string;
}

/**
 * Main orchestration service
 * 1. Create a new Vorgang in Europace
 * 2. Upload the PDF document to that Vorgang
 */
export async function processUpload(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ProcessResult> {
  const kundenangabenClient = new KundenangabenClient();
  const unterlagenClient = new UnterlagenClient();

  try {
    logger.info('Starting upload process', { fileName });

    // Step 0: Parse PDF with AI to extract customer data
    logger.info('Step 0: Parsing PDF with AI');
    let extractedData = await parseWithAI(pdfBuffer);

    // Fill defaults for TEST_MODUS if data is incomplete
    extractedData = fillDefaultsForTest(extractedData);

    // Log comprehensive extracted data summary
    logger.info('PDF data extracted - Full summary', {
      vorname: extractedData.vorname,
      nachname: extractedData.nachname,
      email: extractedData.email,
      telefonnummer: extractedData.telefonnummer,
      geburtsdatum: extractedData.geburtsdatum,
      strasse: extractedData.strasse,
      hausnummer: extractedData.hausnummer,
      plz: extractedData.plz,
      ort: extractedData.ort,
      arbeitgeber: extractedData.arbeitgeber,
      nettoeinkommenMonatlich: extractedData.nettoeinkommenMonatlich,
      kaufpreis: extractedData.kaufpreis,
      eigenkapital: extractedData.eigenkapital,
      extractedFieldCount: Object.keys(extractedData).filter(k => extractedData[k as keyof typeof extractedData]).length,
    });

    // Step 1: Map extracted data to Europace structure using TypeScript mapper
    logger.info('Step 1: Mapping extracted data to Europace structure');
    const payload = createEuropacePayload(extractedData);

    // Step 2: Create Vorgang with mapped payload
    logger.info('Step 2: Creating Vorgang in Europace');
    const vorgang = await kundenangabenClient.createVorgang(payload);

    const vorgangId = vorgang.vorgangsnummer;
    logger.info('Vorgang created successfully', { vorgangId });

    // Step 1.5: Update Vorgang name (DISABLED - API doesn't support this)
    // const vorgangsname = payload.vorgangsname as string | undefined;
    // if (vorgangsname) {
    //   logger.info('Step 1.5: Updating Vorgang name', { vorgangId, vorgangsname });
    //   await kundenangabenClient.updateVorgangName(vorgangId, vorgangsname);
    // }

    // Step 2: Upload document
    logger.info('Step 2: Uploading document', { vorgangId });
    const document = await unterlagenClient.uploadDocument(
      vorgangId,
      pdfBuffer,
      fileName
    );

    logger.info('Document uploaded successfully', {
      vorgangId,
      documentId: document.id,
    });

    return {
      vorgangId,
      documentId: document.id,
    };
  } catch (error) {
    logger.error('Upload process failed', {
      fileName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Retry wrapper for process upload
 * Retries the upload process up to maxRetries times
 */
export async function processUploadWithRetry(
  pdfBuffer: Buffer,
  fileName: string,
  maxRetries = 3
): Promise<ProcessResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info('Upload attempt', { attempt, maxRetries, fileName });
      return await processUpload(pdfBuffer, fileName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn('Upload attempt failed', {
        attempt,
        maxRetries,
        fileName,
        error: lastError.message,
      });

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      logger.info('Retrying after delay', { delay, fileName });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Upload failed after retries');
}
