import * as fs from 'fs';
import * as path from 'path';
import { KundenangabenClient } from './src/europace/kundenangaben';
import { logger } from './src/utils/logger';

async function testComprehensive() {
  try {
    logger.info('='.repeat(80));
    logger.info('Testing COMPREHENSIVE payload with correct API structure');
    logger.info('='.repeat(80));

    const jsonPath = path.join(__dirname, 'test-block-012-COMPREHENSIVE.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const payload = JSON.parse(jsonContent);

    logger.info('Payload loaded', {
      finanzierungszweck: payload.finanzbedarf?.finanzierungszweck,
      objektart: payload.finanzierungsobjekt?.objektart,
      kaufpreis: payload.finanzbedarf?.kaufpreis
    });

    const client = new KundenangabenClient();
    logger.info('Sending to Europace API...');
    
    const response = await client.createVorgang(payload);

    logger.info('='.repeat(80));
    logger.info('✅ SUCCESS! Vorgang created');
    logger.info('='.repeat(80));
    logger.info('Vorgangsnummer:', response.vorgangsnummer);
    logger.info('');
    logger.info('Please verify in Europace that the IMMOBILIE tab is populated!');
    logger.info('');

  } catch (error) {
    logger.error('❌ TEST FAILED');
    logger.error('Error:', error);
    process.exit(1);
  }
}

testComprehensive();
