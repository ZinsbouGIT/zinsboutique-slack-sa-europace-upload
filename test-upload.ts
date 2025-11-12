import * as fs from 'fs';
import { processUpload } from './src/services/processor';
import { logger } from './src/utils/logger';

async function testUpload() {
  try {
    console.log('Starting test upload...\n');

    // Read test PDF
    const pdfPath = './test-riemer.pdf';
    console.log(`Reading PDF: ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`PDF size: ${pdfBuffer.length} bytes\n`);

    // Process upload
    console.log('Uploading to Europace (TEST_MODUS)...');
    const result = await processUpload(pdfBuffer, 'test-riemer.pdf');

    console.log('\n✅ SUCCESS!');
    console.log(`Vorgang ID: ${result.vorgangId}`);
    console.log(`Document ID: ${result.documentId}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testUpload();
