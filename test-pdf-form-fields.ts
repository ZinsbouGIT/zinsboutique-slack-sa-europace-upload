import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

async function checkFormFields() {
  const pdfPath = '/Users/timlutter/Desktop/_ZinsBoutique/_Auto_SA_Upload_Europace/Harika Sayin Selbsauskunft.pdf';

  console.log('Reading PDF...');
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('Loading PDF document...');
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  console.log('Checking for form fields...');
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`\nFound ${fields.length} form fields\n`);

  if (fields.length > 0) {
    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      console.log(`Field ${index + 1}:`);
      console.log(`  Name: ${name}`);
      console.log(`  Type: ${type}`);

      try {
        // Try to get the value
        if (type === 'PDFTextField') {
          const textField = form.getTextField(name);
          console.log(`  Value: ${textField.getText() || '(empty)'}`);
        } else if (type === 'PDFCheckBox') {
          const checkBox = form.getCheckBox(name);
          console.log(`  Checked: ${checkBox.isChecked()}`);
        } else if (type === 'PDFRadioGroup') {
          const radioGroup = form.getRadioGroup(name);
          console.log(`  Selected: ${radioGroup.getSelected() || '(none)'}`);
        } else if (type === 'PDFDropdown') {
          const dropdown = form.getDropdown(name);
          console.log(`  Selected: ${dropdown.getSelected() || '(none)'}`);
        }
      } catch (e) {
        console.log(`  Value: (couldn't extract)`);
      }

      console.log('');
    });
  } else {
    console.log('❌ This PDF has NO form fields - it\'s a flattened/static PDF');
    console.log('We cannot extract checkbox values from form data.');
  }
}

checkFormFields().catch(console.error);
