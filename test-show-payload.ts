import * as fs from 'fs';
import { parsePDF } from './src/services/pdfParser';
import { createEuropacePayload } from './src/services/europaceMapper';

async function showPayload() {
  try {
    const pdfPath = './test-riemer.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);

    console.log('Parsing PDF...');
    const extractedData = await parsePDF(pdfBuffer);

    console.log('\nCreating Europace payload...');
    const payload = createEuropacePayload(extractedData);

    const payloadJson = JSON.stringify(payload, null, 2);

    // Save to file
    const filename = `payload-example-${Date.now()}.json`;
    fs.writeFileSync(filename, payloadJson);

    console.log('\n✅ Payload structure:');
    console.log(payloadJson);
    console.log(`\n📄 Saved to: ${filename}`);

    // Show important fields
    console.log('\n📊 Key fields:');
    console.log(`  - datenkontext: ${payload.importMetadaten.datenkontext}`);
    console.log(`  - externeVorgangsId: ${payload.importMetadaten.externeVorgangsId}`);
    console.log(`  - importquelle: ${payload.importMetadaten.importquelle}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

showPayload();
