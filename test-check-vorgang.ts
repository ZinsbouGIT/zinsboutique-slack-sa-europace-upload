import { KundenangabenClient } from './src/europace/kundenangaben';

async function checkVorgang() {
  try {
    const client = new KundenangabenClient();
    const vorgangId = 'GM6SZR';  // The most recent one from Slack

    console.log(`Getting Vorgang ${vorgangId}...`);
    const vorgang = await client.getVorgang(vorgangId);

    console.log('\n✅ Vorgang details:');
    console.log(JSON.stringify(vorgang, null, 2));

    // Check datenKontext specifically
    const data: any = vorgang;
    if (data.datenKontext) {
      console.log(`\n📊 datenKontext: ${data.datenKontext}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to get Vorgang');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

checkVorgang();
