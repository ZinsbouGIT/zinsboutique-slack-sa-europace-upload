import { KundenangabenClient } from './src/europace/kundenangaben';
import * as fs from 'fs';

async function fetchKundenangaben() {
  const vorgangsnummer = 'JL8Y5D';

  console.log(`Fetching Kundenangaben for Vorgang ${vorgangsnummer} from Europace...`);

  const client = new KundenangabenClient();

  try {
    // Try to fetch full kundenangaben payload
    console.log('\n🔍 Attempting to fetch full Kundenangaben payload...\n');
    const kundenangabenData = await client.getKundenangaben(vorgangsnummer);

    console.log('\n=== KUNDENANGABEN PAYLOAD ===\n');
    console.log(JSON.stringify(kundenangabenData, null, 2));

    // Save to file
    const filename = `europace-kundenangaben-${vorgangsnummer}.json`;
    fs.writeFileSync(filename, JSON.stringify(kundenangabenData, null, 2));
    console.log(`\n✅ Saved complete payload to ${filename}`);

  } catch (error) {
    console.error('❌ Error fetching Kundenangaben:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Status:', axiosError.response?.status);
      console.error('Response:', JSON.stringify(axiosError.response?.data, null, 2));
    }

    // Try alternative endpoint
    console.log('\n🔄 Trying alternative endpoint /v2/vorgaenge...\n');
    try {
      const vorgangData = await client.getVorgang(vorgangsnummer);
      console.log('\n=== VORGANG DATA (basic) ===\n');
      console.log(JSON.stringify(vorgangData, null, 2));

      const filename2 = `europace-vorgang-basic-${vorgangsnummer}.json`;
      fs.writeFileSync(filename2, JSON.stringify(vorgangData, null, 2));
      console.log(`\n✅ Saved basic vorgang data to ${filename2}`);
    } catch (err2) {
      console.error('❌ Alternative endpoint also failed:', err2);
    }
  }
}

fetchKundenangaben().catch(console.error);
