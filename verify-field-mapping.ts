/**
 * Field Mapping Verification Script
 *
 * This script ensures that ALL fields extracted by the AI PDF Parser
 * are correctly mapped in the europaceMapper.ts
 */

import * as fs from 'fs';

// Extract all field names from AI parser prompt
function extractAIParserFields(promptText: string): string[] {
  const fieldRegex = /"([a-zA-Z_0-9]+)":/g;
  const fields: string[] = [];
  let match;

  while ((match = fieldRegex.exec(promptText)) !== null) {
    const field = match[1];
    // Exclude common JSON structure keywords
    if (!['type', '@type', 'source', 'media_type', 'data', 'role', 'user', 'text'].includes(field)) {
      fields.push(field);
    }
  }

  return [...new Set(fields)].sort();
}

// Extract all fields used in mapper
function extractMapperFields(mapperText: string): string[] {
  const fieldRegex = /extractedData\.([a-zA-Z_0-9]+)/g;
  const fields: string[] = [];
  let match;

  while ((match = fieldRegex.exec(mapperText)) !== null) {
    fields.push(match[1]);
  }

  return [...new Set(fields)].sort();
}

// Main verification
async function verifyFieldMapping() {
  console.log('🔍 Verifying Field Mapping Consistency...\n');

  // Read AI Parser
  const aiParserPath = './src/services/aiPdfParser.ts';
  const aiParserContent = fs.readFileSync(aiParserPath, 'utf-8');

  // Read Europace Mapper
  const mapperPath = './src/services/europaceMapper.ts';
  const mapperContent = fs.readFileSync(mapperPath, 'utf-8');

  // Extract fields
  const aiFields = extractAIParserFields(aiParserContent);
  const mapperFields = extractMapperFields(mapperContent);

  console.log(`✅ AI Parser defines ${aiFields.length} fields`);
  console.log(`✅ Mapper uses ${mapperFields.length} field references\n`);

  // Find fields in AI parser but NOT used in mapper
  const unusedFields = aiFields.filter(f => !mapperFields.includes(f));

  if (unusedFields.length > 0) {
    console.log(`⚠️  WARNING: ${unusedFields.length} fields are extracted by AI but NOT used in mapper:`);
    console.log('─'.repeat(80));
    unusedFields.forEach(field => {
      console.log(`  ❌ ${field}`);
    });
    console.log('─'.repeat(80));
    console.log();
  } else {
    console.log('✅ All AI parser fields are used in mapper!\n');
  }

  // Find fields in mapper but NOT defined in AI parser
  const undefinedFields = mapperFields.filter(f => !aiFields.includes(f));

  if (undefinedFields.length > 0) {
    console.log(`⚠️  WARNING: ${undefinedFields.length} fields are used in mapper but NOT defined in AI parser:`);
    console.log('─'.repeat(80));
    undefinedFields.forEach(field => {
      console.log(`  ❌ ${field}`);
    });
    console.log('─'.repeat(80));
    console.log();
  } else {
    console.log('✅ All mapper fields are defined in AI parser!\n');
  }

  // Block 7 critical fields checklist
  console.log('📋 Block 7 Critical Fields Checklist:');
  console.log('─'.repeat(80));

  const criticalFields = [
    'summeBankUndSparguthaben',
    'zinsertragJaehrlich',
    'depotwert',
    'dividendenJaehrlich',
    'sparplaeneAktuellerWert',
    'sparplaeneBeitragMonatlich',
    'bausparvertraege',
    'lebensversicherungen',
    'sonstigesVermoegenWert',
    'sonstigeEinnahmenMonatlich',
    'variableEinkuenfteMonatlich',
    'ehegattenunterhaltMonatlich',
    'unbefristeteZusatzrentenMonatlich',
    'einkuenfteAusNebentaetigkeit',
    'mietausgabenMonatlich',
    'lebenshaltungskostenMonatlich',
    'unterhaltsverpflichtungenMonatlich',
    'privateKrankenversicherungMonatlich',
    'sonstigeAusgabenMonatlich',
    'ratenkredite',
    'privatdarlehen',
  ];

  criticalFields.forEach(field => {
    const inAI = aiFields.includes(field);
    const inMapper = mapperFields.includes(field);

    if (inAI && inMapper) {
      console.log(`  ✅ ${field.padEnd(45)} [AI ✓] [Mapper ✓]`);
    } else if (inAI && !inMapper) {
      console.log(`  ❌ ${field.padEnd(45)} [AI ✓] [Mapper ✗]`);
    } else if (!inAI && inMapper) {
      console.log(`  ⚠️  ${field.padEnd(45)} [AI ✗] [Mapper ✓]`);
    } else {
      console.log(`  ❌ ${field.padEnd(45)} [AI ✗] [Mapper ✗]`);
    }
  });

  console.log('─'.repeat(80));
  console.log();

  // Summary
  if (unusedFields.length === 0 && undefinedFields.length === 0) {
    console.log('🎉 SUCCESS! All fields are correctly mapped!');
    process.exit(0);
  } else {
    console.log('❌ FAILED! Field mapping inconsistencies detected!');
    console.log(`   - ${unusedFields.length} unused fields`);
    console.log(`   - ${undefinedFields.length} undefined fields`);
    process.exit(1);
  }
}

verifyFieldMapping().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
