import { KundenangabenClient } from './src/europace/kundenangaben';
import { logger } from './src/utils/logger';
import * as fs from 'fs';

async function main() {
  try {
    logger.info('Testing vollständige Payload (Max & Erika Mustermann)');

    // Read the JSON payload
    const payloadPath = '/Users/timlutter/Desktop/Projects/zinsboutique-sa-europace-upload/EUROPACE-VOLLSTAENDIGE-JSON-STRUKTUR.json';
    const payloadStr = fs.readFileSync(payloadPath, 'utf-8');
    const payload = JSON.parse(payloadStr);

    // Create client and POST to Europace
    const client = new KundenangabenClient();

    logger.info('Posting payload to Europace...');
    const result = await client.createVorgang(payload);

    logger.info('✅ SUCCESS! Vorgang created', {
      vorgangsnummer: result.vorgangsnummer
    });

    console.log('\n==============================================');
    console.log('✅ VORGANG CREATED SUCCESSFULLY!');
    console.log('==============================================');
    console.log('Vorgangsnummer:', result.vorgangsnummer);
    console.log('==============================================\n');

  } catch (error) {
    logger.error('❌ FAILED to post payload', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('\n❌ TEST FAILED');
    console.error('Error:', error instanceof Error ? error.message : String(error));

    process.exit(1);
  }
}

main();
