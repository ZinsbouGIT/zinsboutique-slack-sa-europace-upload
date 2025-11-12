import { KundenangabenClient } from './src/europace/kundenangaben';

async function testGetVorgang() {
  try {
    const client = new KundenangabenClient();
    const vorgangId = 'D387YR';  // From our successful creation

    console.log(`Getting Vorgang ${vorgangId}...`);
    const vorgang = await client.getVorgang(vorgangId);

    console.log('\n✅ Vorgang exists!');
    console.log(JSON.stringify(vorgang, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to get Vorgang');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testGetVorgang();
