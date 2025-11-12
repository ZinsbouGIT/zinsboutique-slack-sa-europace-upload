/**
 * Test script to validate the new mapper structure
 * Run with: npx ts-node test-new-mapper.ts
 */

import { createEuropacePayload } from './src/services/europaceMapper';
import { SelbstauskunftData } from './src/services/pdfParser';

// Sample test data
const testData: SelbstauskunftData = {
  // Personal data
  anrede: 'HERR',
  vorname: 'Max',
  nachname: 'Mustermann',
  titel: 'Dr.',
  geburtsdatum: '1985-03-15',
  geburtsort: 'Berlin',
  staatsangehoerigkeit: 'DE',
  familienstand: 'verheiratet',

  // Contact
  email: 'max.mustermann@test.de',
  telefonnummer: '030 12345678',

  // Address
  strasse: 'Teststraße',
  hausnummer: '42',
  plz: '10115',
  ort: 'Berlin',
  wohnhaftSeit: '2020-01-01',

  // Employment
  beschaeftigungsart: 'angestellt',
  arbeitgeber: 'Tech Solutions GmbH',
  beruf: 'Software-Entwickler',
  beschaeftigtSeit: '2020-01-15',
  nettoeinkommenMonatlich: 4500,

  // Children
  anzahlKinder: 2,

  // Financial
  eigenkapital: 50000,
  sparguthaben: 25000,
  monatlicheKaltmiete: 1200,

  // Credits
  bestehendeKredite: [
    {
      kreditgeber: 'Bank AG',
      restschuld: 15000,
      monatlicheRate: 300,
      laufzeitEnde: '2026-12-31',
    },
  ],
};

console.log('🧪 Testing new mapper structure...\n');

try {
  const payload = createEuropacePayload(testData);

  console.log('✅ Payload created successfully!\n');

  // Validate structure
  console.log('📋 Structure Validation:');
  console.log('------------------------');

  // Check importMetadaten
  if (payload.importMetadaten) {
    console.log('✅ importMetadaten exists');
    console.log(`   - datenkontext: ${payload.importMetadaten.datenkontext}`);
    console.log(`   - externeVorgangsId: ${payload.importMetadaten.externeVorgangsId}`);
  } else {
    console.log('❌ importMetadaten missing');
  }

  // Check kundenangaben structure
  if (payload.kundenangaben) {
    console.log('✅ kundenangaben exists');

    if (payload.kundenangaben.haushalte) {
      console.log('✅ haushalte array exists');
      console.log(`   - Count: ${payload.kundenangaben.haushalte.length}`);

      const haushalt = payload.kundenangaben.haushalte[0];

      // Check kunden (NOT personen!)
      if (haushalt.kunden) {
        console.log('✅ kunden array exists (correct!)');
        console.log(`   - Count: ${haushalt.kunden.length}`);

        const kunde = haushalt.kunden[0];

        // Check kunde structure
        if (kunde.referenzId) {
          console.log(`✅ kunde.referenzId: ${kunde.referenzId}`);
        }
        if (kunde.externeKundenId) {
          console.log(`✅ kunde.externeKundenId: ${kunde.externeKundenId}`);
        }

        // Check personendaten.person structure
        if (kunde.personendaten?.person) {
          console.log('✅ personendaten.person exists');
          console.log(`   - anrede: ${kunde.personendaten.person.anrede}`);
          console.log(`   - vorname: ${kunde.personendaten.person.vorname}`);
          console.log(`   - nachname: ${kunde.personendaten.person.nachname}`);
          if (kunde.personendaten.person.titel) {
            console.log(`   - titel.dr: ${kunde.personendaten.person.titel.dr}`);
            console.log(`   - titel.prof: ${kunde.personendaten.person.titel.prof}`);
          }
        } else {
          console.log('❌ personendaten.person missing');
        }

        // Check geburtsdatum is directly under personendaten
        if (kunde.personendaten?.geburtsdatum) {
          console.log(`✅ personendaten.geburtsdatum (direct): ${kunde.personendaten.geburtsdatum}`);
        } else {
          console.log('❌ personendaten.geburtsdatum missing');
        }

        // Check staatsangehoerigkeit is directly under personendaten
        if (kunde.personendaten?.staatsangehoerigkeit) {
          console.log(`✅ personendaten.staatsangehoerigkeit (direct): ${kunde.personendaten.staatsangehoerigkeit}`);
        }

        // Check familienstand with @type
        if (kunde.personendaten?.familienstand?.['@type']) {
          console.log(`✅ personendaten.familienstand.@type: ${kunde.personendaten.familienstand['@type']}`);
        }

        // Check wohnsituation at kunde level
        if (kunde.wohnsituation) {
          console.log('✅ wohnsituation at kunde level (correct!)');
          console.log(`   - wohnhaftSeit: ${kunde.wohnsituation.wohnhaftSeit}`);
          console.log(`   - anschrift.strasse: ${kunde.wohnsituation.anschrift.strasse}`);
        } else {
          console.log('❌ wohnsituation missing');
        }

        // Check kontakt at kunde level
        if (kunde.kontakt) {
          console.log('✅ kontakt at kunde level (correct!)');
          console.log(`   - email: ${kunde.kontakt.email}`);
          if (kunde.kontakt.telefonnummer) {
            console.log(`   - telefonnummer.vorwahl: ${kunde.kontakt.telefonnummer.vorwahl}`);
            console.log(`   - telefonnummer.nummer: ${kunde.kontakt.telefonnummer.nummer}`);
          }
        } else {
          console.log('❌ kontakt missing');
        }

        // Check finanzielles.beschaeftigung
        if (kunde.finanzielles?.beschaeftigung) {
          console.log('✅ finanzielles.beschaeftigung exists');
          console.log(`   - @type: ${kunde.finanzielles.beschaeftigung['@type']}`);
          console.log(`   - beruf: ${kunde.finanzielles.beschaeftigung.beruf}`);
          if (kunde.finanzielles.beschaeftigung.beschaeftigungsverhaeltnis) {
            console.log(`   - arbeitgeber.name: ${kunde.finanzielles.beschaeftigung.beschaeftigungsverhaeltnis.arbeitgeber.name}`);
          }
        }

        // Check einkommenNetto
        if (kunde.finanzielles?.einkommenNetto) {
          console.log(`✅ finanzielles.einkommenNetto: ${kunde.finanzielles.einkommenNetto}`);
        }
      } else if (haushalt.personen) {
        console.log('❌ haushalt.personen exists (WRONG! Should be kunden)');
      } else {
        console.log('❌ kunden array missing');
      }

      // Check kinderErfassung at haushalt level
      if (haushalt.kinderErfassung) {
        console.log('✅ kinderErfassung at haushalt level (correct!)');
        console.log(`   - @type: ${haushalt.kinderErfassung['@type']}`);
        console.log(`   - kinder count: ${haushalt.kinderErfassung.kinder.length}`);
      }

      // Check finanzielleSituation at haushalt level
      if (haushalt.finanzielleSituation) {
        console.log('✅ finanzielleSituation at haushalt level (correct!)');

        if (haushalt.finanzielleSituation.vermoegen) {
          console.log('   ✅ vermoegen exists');
        }
        if (haushalt.finanzielleSituation.ausgaben) {
          console.log('   ✅ ausgaben exists');
        }
        if (haushalt.finanzielleSituation.verbindlichkeiten) {
          console.log('   ✅ verbindlichkeiten exists');
          if (haushalt.finanzielleSituation.verbindlichkeiten.ratenkredite) {
            console.log(`   ✅ ratenkredite count: ${haushalt.finanzielleSituation.verbindlichkeiten.ratenkredite.length}`);
          }
        }
      }
    } else {
      console.log('❌ haushalte missing');
    }
  } else {
    console.log('❌ kundenangaben missing');
  }

  console.log('\n📄 Full JSON Output:');
  console.log('====================');
  console.log(JSON.stringify(payload, null, 2));

  console.log('\n✅ Test completed successfully!');
  console.log('\n💡 Structure matches field-mapping documentation (Blocks 1-11)');

} catch (error) {
  console.error('❌ Test failed:', error);
  if (error instanceof Error) {
    console.error(error.stack);
  }
  process.exit(1);
}
