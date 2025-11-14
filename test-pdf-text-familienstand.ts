import * as fs from 'fs';
const pdfParse = require('pdf-parse');

async function extractFamilienstandText() {
  const pdfPath = '/Users/timlutter/Desktop/_ZinsBoutique/_Auto_SA_Upload_Europace/Harika Sayin Selbsauskunft.pdf';

  console.log('Reading PDF...');
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('Extracting text...');
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text;

  // Look for familienstand section
  const lines = text.split('\n');

  console.log('\n=== SEARCHING FOR FAMILIENSTAND TEXT ===\n');

  // Find lines containing familienstand-related keywords
  const keywords = ['familienstand', 'ledig', 'verheiratet', 'geschieden', 'verwitwet', 'lebenspartnerschaft', 'getrennt'];

  let contextStart = -1;
  let contextEnd = -1;

  lines.forEach((line: string, index: number) => {
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      if (contextStart === -1 || index < contextStart) contextStart = index;
      if (contextEnd === -1 || index > contextEnd) contextEnd = index;
    }
  });

  if (contextStart >= 0) {
    // Show context around familienstand section
    const start = Math.max(0, contextStart - 3);
    const end = Math.min(lines.length, contextEnd + 10);

    console.log('Lines containing familienstand-related keywords:\n');
    for (let i = start; i < end; i++) {
      const prefix = i >= contextStart && i <= contextEnd ? '>>> ' : '    ';
      console.log(`${prefix}Line ${i}: ${lines[i]}`);
    }
  }

  // Look for specific checkbox symbols
  console.log('\n\n=== SEARCHING FOR CHECKBOX SYMBOLS ===\n');

  const checkboxSymbols = ['●', '○', '⚫', '⚬', '◉', '◯', '☐', '☑', '☒', '✓', '✔', '✗', '✘'];

  checkboxSymbols.forEach(symbol => {
    const count = (text.match(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
      console.log(`Symbol "${symbol}" appears ${count} times`);

      // Show lines containing this symbol
      lines.forEach((line: string, index: number) => {
        if (line.includes(symbol)) {
          console.log(`  Line ${index}: ${line.substring(0, 100)}`);
        }
      });
    }
  });

  // Look for Unicode circle patterns
  console.log('\n\n=== CHARACTER CODE ANALYSIS (first 100 chars of each line with circles) ===\n');

  lines.forEach((line: string, index: number) => {
    if (line.match(/[○●⚫⚬◉◯]/)) {
      console.log(`Line ${index}: ${line.substring(0, 80)}`);
      console.log(`  Char codes: ${[...line.substring(0, 80)].map(c => `${c}(${c.charCodeAt(0)})`).join(' ')}`);
    }
  });
}

extractFamilienstandText().catch(console.error);
