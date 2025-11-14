import { parseWithAI } from './src/services/aiPdfParser';
import * as fs from 'fs';
import * as path from 'path';

async function testExtraction() {
  const pdfPath = '/Users/timlutter/Desktop/_ZinsBoutique/_Auto_SA_Upload_Europace/Harika Sayin Selbsauskunft.pdf';

  console.log('Reading PDF...');
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('Extracting with AI...');
  const result = await parseWithAI(pdfBuffer);

  console.log('\n=== EXTRACTION RESULTS ===\n');
  console.log('Vorname:', result.vorname);
  console.log('Nachname:', result.nachname);
  console.log('\n--- Antragsteller 1 Familienstand ---');
  console.log('Reasoning:', result.familienstand_reasoning);
  console.log('Final Value:', result.familienstand);
  console.log('\n--- Antragsteller 2 Familienstand ---');
  console.log('Reasoning:', result.antragsteller2_familienstand_reasoning);
  console.log('Final Value:', result.antragsteller2_familienstand);

  console.log('\n=== FULL DATA ===');
  console.log(JSON.stringify(result, null, 2));
}

testExtraction().catch(console.error);
