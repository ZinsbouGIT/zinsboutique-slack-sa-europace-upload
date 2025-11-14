import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

async function checkRadioGroups() {
  const pdfPath = '/Users/timlutter/Desktop/_ZinsBoutique/_Auto_SA_Upload_Europace/Harika Sayin Selbsauskunft.pdf';

  console.log('Reading PDF...');
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('Loading PDF document...');
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  console.log('Checking for radio groups...');
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const radioGroups = fields.filter(f => f.constructor.name === 'PDFRadioGroup');

  console.log(`\nFound ${radioGroups.length} radio groups\n`);

  radioGroups.forEach((field, index) => {
    const name = field.getName();
    const radioGroup = form.getRadioGroup(name);

    console.log(`Radio Group ${index + 1}:`);
    console.log(`  Name: ${name}`);
    console.log(`  Selected: ${radioGroup.getSelected() || '(none)'}`);

    try {
      const options = radioGroup.getOptions();
      console.log(`  Options: ${options.join(', ')}`);
    } catch (e) {
      console.log(`  Options: (couldn't extract)`);
    }

    console.log('');
  });

  // Also check all checkboxes with names containing familienstand, ledig, verheiratet, etc.
  console.log('\n=== CHECKBOXES RELATED TO FAMILIENSTAND ===\n');

  const familienstandRelated = fields.filter(f => {
    const name = f.getName().toLowerCase();
    return name.includes('famil') || name.includes('ledig') ||
           name.includes('verheiratet') || name.includes('geschieden') ||
           name.includes('verwitwet') || name.includes('lebenspartner') ||
           name.includes('gueter');
  });

  familienstandRelated.forEach((field) => {
    const name = field.getName();
    const type = field.constructor.name;

    console.log(`Field: ${name}`);
    console.log(`  Type: ${type}`);

    if (type === 'PDFCheckBox') {
      const checkBox = form.getCheckBox(name);
      console.log(`  Checked: ${checkBox.isChecked()}`);
    }

    console.log('');
  });
}

checkRadioGroups().catch(console.error);
