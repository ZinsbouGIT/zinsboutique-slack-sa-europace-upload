import * as fs from 'fs';
import * as path from 'path';
import { KundenangabenClient } from './src/europace/kundenangaben';
import { logger } from './src/utils/logger';

async function sendTestPayload() {
  try {
    logger.info('='.repeat(80));
    logger.info('Starting Europace API Test');
    logger.info('='.repeat(80));

    // Read the JSON payload
    const jsonPath = path.join(__dirname, 'EUROPACE-VOLLSTAENDIGE-JSON-STRUKTUR.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const payload = JSON.parse(jsonContent);

    logger.info('Loaded JSON payload', {
      datenkontext: payload.importMetadaten?.datenkontext,
      externeVorgangsId: payload.importMetadaten?.externeVorgangsId,
      importquelle: payload.importMetadaten?.importquelle,
      anzahlHaushalte: payload.kundenangaben?.haushalte?.length,
      anzahlKunden: payload.kundenangaben?.haushalte?.[0]?.kunden?.length,
    });

    // Create Europace client
    const client = new KundenangabenClient();

    // Send to Europace
    logger.info('Sending payload to Europace API...');
    const response = await client.createVorgang(payload);

    logger.info('='.repeat(80));
    logger.info('✅ SUCCESS! Vorgang created in Europace');
    logger.info('='.repeat(80));
    logger.info('Response:', JSON.stringify(response, null, 2));

    // Extract vorgangsnummer if available
    if (response.vorgangsnummer) {
      logger.info('Vorgangsnummer:', response.vorgangsnummer);

      // Optional: Update Vorgang name
      const vorgangsname = `${payload.kundenangaben?.haushalte?.[0]?.kunden?.[0]?.personendaten?.person?.vorname} ${payload.kundenangaben?.haushalte?.[0]?.kunden?.[0]?.personendaten?.person?.nachname} - Test`;

      logger.info('Updating Vorgang name...', { vorgangsname });
      await client.updateVorgangName(response.vorgangsnummer, vorgangsname);

      logger.info('✅ Vorgang name updated successfully');
    }

    logger.info('='.repeat(80));
    logger.info('Test completed successfully');
    logger.info('='.repeat(80));

  } catch (error) {
    logger.error('='.repeat(80));
    logger.error('❌ TEST FAILED');
    logger.error('='.repeat(80));

    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    } else {
      logger.error('Error:', error);
    }

    process.exit(1);
  }
}

// Run the test
sendTestPayload();
