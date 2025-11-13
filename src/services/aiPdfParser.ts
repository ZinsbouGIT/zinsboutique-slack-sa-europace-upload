import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { SelbstauskunftData } from './pdfParser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parse Selbstauskunft PDF using Claude AI with temperature 0 for consistency
 */
export async function parseWithAI(pdfBuffer: Buffer): Promise<SelbstauskunftData> {
  try {
    logger.info('Starting AI-based PDF parsing');

    // Convert PDF to base64 for Claude API
    const base64Pdf = pdfBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0, // Deterministic output
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              type: 'text',
              text: `Analyze this Selbstauskunft (self-disclosure) form and extract ALL available information for BOTH applicants if present.

CRITICAL: Many PDFs contain TWO applicants:
- Antragsteller 1 (First Applicant)
- Antragsteller 2 / Mitantragsteller (Second Applicant / Co-Applicant)

🔴 CRITICAL DATE FORMAT INSTRUCTION:
- German dates are written as DD.MM.YYYY or DD/MM/YYYY (e.g., 15.03.1985 or 15/03/1985)
- You MUST convert them to YYYY-MM-DD format (e.g., 1985-03-15)
- NEVER interpret German dates as MM/DD/YYYY (US format)
- Example: "25.12.1990" = 1990-12-25 (NOT 1990-25-12!)

Return ONLY a valid JSON object (no markdown, no explanation) with this structure. Extract EVERY field you can find from ALL sections:

{
  // ==========================================
  // ANTRAGSTELLER 1 - PERSONAL INFORMATION
  // ==========================================
  "vorname": "First name",
  "nachname": "Last name",
  "geburtsdatum": "Birth date YYYY-MM-DD (GERMAN FORMAT: DD.MM.YYYY → convert to YYYY-MM-DD)",
  "geburtsort": "Place of birth",
  "email": "Email address",
  "telefonnummer": "Phone number",
  "familienstand": "LEDIG/VERHEIRATET/GESCHIEDEN/VERWITWET/EINGETRAGENE_LEBENSPARTNERSCHAFT (Look for checkboxes or written text)",
  "staatsangehoerigkeit": "Nationality (DE/AT/CH/etc - ISO 3166-1 alpha-2)",
  "steuerId": "🔴 CRITICAL: Tax ID / Steuer-ID / Steueridentifikationsnummer (11-digit number)",

  // Current Address
  "strasse": "Street name only",
  "hausnummer": "House number",
  "plz": "5-digit postal code",
  "ort": "City",
  "wohnhaftSeit": "Living there since (YYYY-MM-DD)",
  "wohnverhaeltnis": "EIGENTUM/MIETE/ELTERN",
  "monatlicheKaltmiete": Monthly rent (if renting),

  // Previous Address
  "vorherigePlz": "Previous postal code",
  "vorherigeStadt": "Previous city",

  // Employment
  "arbeitgeber": "Employer name",
  "beschaeftigungsart": "ANGESTELLTER/ARBEITER/BEAMTER/SELBSTSTAENDIGER/FREIBERUFLER/RENTNER/ARBEITSLOSER/HAUSHALTENDE_PERSON",
  "beruf": "Occupation/profession",
  "beschaeftigtSeit": "Employed since (YYYY-MM-DD)",
  "beschaeftigungsstatus": "UNBEFRISTET/BEFRISTET (only for ANGESTELLTER/ARBEITER)",
  "bruttoeinkommen": Gross monthly income,
  "nettoeinkommenMonatlich": Net monthly income,
  "anzahlGehaelterProJahr": "ZWOELF/DREIZEHN/VIERZEHN",

  // BLOCK-005: Rente & Riester (Situation after retirement)
  "rentenbeginn": "🔴 CRITICAL: Planned retirement date YYYY-MM-DD (Look for 'Rentenbeginn', 'Renteneintritt', 'Ruhestand ab') - GERMAN DATE FORMAT DD.MM.YYYY",
  "gesetzlicheRenteMonatlich": Monthly statutory pension amount (Gesetzliche Rente),
  "privateRenteMonatlich": Monthly private pension amount (Private Rente, Riester, etc.),
  "sonstigesEinkommenNachRente": Other income after retirement,

  // ==========================================
  // BLOCK-006: KINDER (Children - up to 10)
  // ==========================================
  "kinder": [
    {
      "name": "Child name",
      "geburtsdatum": "Birth date YYYY-MM-DD",
      "kindergeldWirdBezogen": true/false,
      "unterhalt": Monthly child support amount
    }
  ],

  // ==========================================
  // BLOCK-007: VERMÖGEN (Assets) - VERY IMPORTANT!
  // Look for sections like "Vermögen", "Guthaben", "Ersparnisse"
  // ==========================================

  // Bank & Savings - CRITICAL: Look for "Bank-/Sparguthaben", "Kontoguthaben", "Sparkonto"
  "summeBankUndSparguthaben": Total bank and savings balance (e.g., 50000),
  "zinsertragJaehrlich": Annual interest income from bank/savings (e.g., 500),

  // Securities & Stocks - Look for "Wertpapiere", "Depot", "Aktien"
  "depotwert": Total securities/depot value (e.g., 35000),
  "dividendenJaehrlich": Annual dividends from securities (e.g., 1500),

  // Savings Plans - Look for "Sparplan", "Fondssparplan"
  "sparplaeneAktuellerWert": Current value of savings plans (e.g., 12000),
  "sparplaeneBeitragMonatlich": Monthly savings plan contribution (e.g., 300),

  // Building Savings Contracts (up to 3) - Look for "Bausparvertrag", "Bausparen"
  "bausparvertraege": [
    {
      "angesparterBetrag": Saved/accumulated amount (e.g., 15000),
      "sparbeitrag": Monthly savings contribution (e.g., 200),
      "bausparsumme": Total building savings sum (e.g., 50000),
      "bausparkasse": "Building society name (LBS, Schwäbisch Hall, Wüstenrot, etc.)"
    }
  ],

  // Life/Pension Insurance (up to 3) - Look for "Lebensversicherung", "Rentenversicherung"
  "lebensversicherungen": [
    {
      "rueckkaufswert": Surrender value / cash value (e.g., 25000),
      "praemieMonatlich": Monthly premium payment (e.g., 150)
    }
  ],

  // Other Assets - Look for "Sonstiges Vermögen", "Gold", "Kunst", "Oldtimer"
  "sonstigesVermoegenWert": Other assets value (e.g., 8000),

  // ==========================================
  // BLOCK-007: EINNAHMEN (Additional Income) - VERY IMPORTANT!
  // Look for sections like "Sonstige Einnahmen", "Zusätzliche Einnahmen"
  // ==========================================

  "sonstigeEinnahmenMonatlich": Other monthly income (Kindergeld, Mieteinnahmen Garage, etc.) (e.g., 500),
  "variableEinkuenfteMonatlich": Variable monthly income (e.g., 300),
  "ehegattenunterhaltMonatlich": Spousal support received monthly (e.g., 0),
  "unbefristeteZusatzrentenMonatlich": Unlimited additional pension monthly (Betriebsrente, etc.) (e.g., 200),

  "einkuenfteAusNebentaetigkeit": [
    {
      "betragMonatlich": Monthly amount from side job (e.g., 400),
      "beschreibung": "Description of side job (e.g., Freelance Beratung)",
      "beginnDerNebentaetigkeit": "Start date of side job YYYY-MM-DD (e.g., 2022-01-01)"
    }
  ],

  // ==========================================
  // BLOCK-007: AUSGABEN (Expenses) - VERY IMPORTANT!
  // Look for sections like "Ausgaben", "Kosten", "Verpflichtungen"
  // ==========================================

  "mietausgabenMonatlich": Monthly rent expenses (current rent payment) (e.g., 1200),
  "lebenshaltungskostenMonatlich": Monthly living costs (Lebenshaltung) (e.g., 2000),
  "unterhaltsverpflichtungenMonatlich": Monthly alimony/child support obligations (e.g., 500),
  "privateKrankenversicherungMonatlich": Private health insurance monthly (e.g., 450),
  "sonstigeAusgabenMonatlich": Other monthly expenses (Versicherungen, Hobbys, Mitgliedschaften, etc.) (e.g., 800),
  "sonstigeVersicherungsausgabenMonatlich": Other insurance expenses monthly (e.g., 100),

  // ==========================================
  // BLOCK-007: VERBINDLICHKEITEN (Liabilities)
  // ==========================================
  // Installment Loans/Leasing (up to 3)
  "ratenkredite": [
    {
      "rateMonatlich": Monthly payment,
      "glaeubiger": "Creditor name",
      "restschuld": Remaining debt,
      "laufzeitende": "End date YYYY-MM-DD (GERMAN DATE FORMAT)"
    }
  ],

  // Private Loans (up to 3)
  "privatdarlehen": [
    {
      "rateMonatlich": Monthly payment,
      "glaeubiger": "Creditor name",
      "restschuld": Remaining debt,
      "laufzeitende": "End date YYYY-MM-DD (GERMAN DATE FORMAT)"
    }
  ],

  // 🔴 CRITICAL: Other Liabilities - Look for "Sonstige Verbindlichkeiten", "Weitere Kredite", "Andere Verpflichtungen"
  "sonstigeVerbindlichkeitRateMonatlich": Other monthly liability payment (any other debts not listed above),

  // ==========================================
  // BLOCK-008: BANKVERBINDUNG (Bank Account) - 🔴 CRITICAL!
  // Look for "Bankverbindung", "Kontoverbindung", "IBAN", "Konto"
  // ==========================================
  "kontoinhaber": "🔴 CRITICAL: Account holder name(s) (Kontoinhaber)",
  "iban": "🔴 CRITICAL: IBAN (International Bank Account Number) - Look very carefully for this!",
  "bic": "BIC/SWIFT code (Bankleitzahl)",
  "bankname": "Bank name (e.g., Sparkasse, Volksbank, Deutsche Bank, etc.)",

  // ==========================================
  // BLOCK-F01: FINANZIERUNGSZWECK (Financing Purpose)
  // ==========================================
  "finanzierungszweck": "KAUF/NEUBAU/KAUF_NEUBAU_VOM_BAUTRAEGER/MODERNISIERUNG_UMBAU_ANBAU/ANSCHLUSSFINANZIERUNG/KAPITALBESCHAFFUNG",

  // ==========================================
  // BLOCK-F02 & F03: FINANZIERUNGSOBJEKT (Property Being Financed)
  // ==========================================
  // Property Address
  "objektStrasse": "Property street",
  "objektHausnummer": "Property house number",
  "objektPlz": "Property postal code",
  "objektOrt": "Property city",

  // Property Details
  "objektart": "EINFAMILIENHAUS/ZWEIFAMILIENHAUS/MEHRFAMILIENHAUS/EIGENTUMSWOHNUNG/DOPPELHAUSHAELFTE/REIHENHAUS/GRUNDSTUECK",
  "anzahlGeschosse": Number of floors,
  "bauweise": "MASSIV/HOLZ/FACHWERK_MIT_ZIEGELN",
  "grundstuecksgroesse": Plot size in sqm,
  "baujahr": Year built,
  "anzahlGaragen": Number of garages,
  "anzahlStellplaetze": Number of parking spaces,

  // Usage (BLOCK-F03)
  "wohnflaeche": Living space in sqm,
  "nutzungsart": "EIGENGENUTZT/VERMIETET/TEILVERMIETET",
  "vermieteteFlaeche": Rented space in sqm (if applicable),
  "mieteinnahmenNettoKaltMonatlich": Monthly net cold rent (if applicable),

  // Commercial Space (if exists)
  "gewerbeflaeche": Commercial space in sqm,
  "gewerbeNutzungsart": "EIGENGENUTZT/VERMIETET/TEILVERMIETET",
  "gewerbeVermieteteFlaeche": Rented commercial space in sqm,
  "gewerbeMieteinnahmenMonatlich": Monthly commercial rent,

  // Financing Details
  "kaufpreis": Purchase price,
  "eigenkapital": Equity,
  "darlehenswunsch": Desired loan amount,
  "marktwert": Market value,

  // ==========================================
  // BLOCK-011: BESTEHENDE IMMOBILIEN (Existing Properties)
  // ==========================================
  "bestehendeImmobilien": [
    {
      "bezeichnung": "Property description/name",
      "marktwert": Market value,
      "adresse": {
        "strasse": "Street",
        "hausnummer": "House number",
        "plz": "Postal code",
        "ort": "City"
      },
      "typ": "EINFAMILIENHAUS/EIGENTUMSWOHNUNG/etc",
      "grundstuecksgroesse": Plot size,
      "baujahr": Year built,
      "wohnflaeche": Living space,
      "nutzungsart": "EIGENGENUTZT/VERMIETET/TEILVERMIETET",
      "mieteinnahmenMonatlich": Monthly rental income (if rented),
      "darlehen": [
        {
          "darlehensgeber": "Lender name",
          "urspruenglicheDarlehenssumme": Original loan amount,
          "restschuld": Remaining debt,
          "rateMonatlich": Monthly payment,
          "sollzins": Interest rate percentage,
          "zinsbindungBis": "Fixed rate until YYYY-MM-DD",
          "laufzeitende": "Loan end date YYYY-MM-DD"
        }
      ]
    }
  ],

  // Signature
  "unterschriftOrt": "Place of signature",
  "unterschriftDatum": "Date of signature YYYY-MM-DD",

  // ==========================================
  // ANTRAGSTELLER 2 / MITANTRAGSTELLER (Second Applicant)
  // IMPORTANT: If there is a second applicant, extract all their data with "antragsteller2_" prefix
  // ==========================================
  "antragsteller2_vorname": "Second applicant first name",
  "antragsteller2_nachname": "Second applicant last name",
  "antragsteller2_geburtsdatum": "Second applicant birth date YYYY-MM-DD (GERMAN DATE FORMAT)",
  "antragsteller2_geburtsort": "Second applicant place of birth",
  "antragsteller2_email": "Second applicant email",
  "antragsteller2_telefonnummer": "Second applicant phone",
  "antragsteller2_familienstand": "Second applicant marital status",
  "antragsteller2_staatsangehoerigkeit": "Second applicant nationality",
  "antragsteller2_steuerId": "🔴 CRITICAL: Second applicant Tax ID / Steuer-ID (11-digit number)",
  "antragsteller2_strasse": "Second applicant street (or same as applicant 1)",
  "antragsteller2_hausnummer": "Second applicant house number",
  "antragsteller2_plz": "Second applicant postal code",
  "antragsteller2_ort": "Second applicant city",
  "antragsteller2_wohnhaftSeit": "Second applicant living there since (GERMAN DATE FORMAT)",
  "antragsteller2_arbeitgeber": "Second applicant employer",
  "antragsteller2_beschaeftigungsart": "Second applicant employment type",
  "antragsteller2_beschaeftigungsstatus": "Second applicant employment status",
  "antragsteller2_beruf": "Second applicant profession",
  "antragsteller2_beschaeftigtSeit": "Second applicant employed since (GERMAN DATE FORMAT)",
  "antragsteller2_nettoeinkommenMonatlich": "Second applicant net monthly income",
  "antragsteller2_anzahlGehaelterProJahr": "Second applicant number of salaries per year",

  // BLOCK-005: Second applicant retirement
  "antragsteller2_rentenbeginn": "🔴 Second applicant retirement date YYYY-MM-DD (GERMAN DATE FORMAT)",
  "antragsteller2_gesetzlicheRenteMonatlich": "Second applicant statutory pension",
  "antragsteller2_privateRenteMonatlich": "Second applicant private pension",
  "antragsteller2_sonstigesEinkommenNachRente": "Second applicant other income after retirement",

  // BLOCK-008: Second applicant bank account
  "antragsteller2_iban": "🔴 CRITICAL: Second applicant IBAN",
  "antragsteller2_bic": "Second applicant BIC",
  "antragsteller2_bankname": "Second applicant bank name",
  "antragsteller2_kontoinhaber": "Second applicant account holder"
}

CRITICAL RULES:
- ONLY extract data that is EXPLICITLY present in the document
- NEVER make up, guess, or infer data that is not clearly visible
- Use null for ALL fields not present in the document
- IMPORTANT: Check for BOTH applicants (Antragsteller 1 AND Antragsteller 2 / Mitantragsteller)
- If second applicant exists, extract ALL their data with "antragsteller2_" prefix

🔴 DATE FORMAT RULES (MOST IMPORTANT!):
- German dates are DD.MM.YYYY or DD/MM/YYYY format (e.g., 25.12.1990 or 25/12/1990)
- You MUST convert to YYYY-MM-DD format (e.g., 1990-12-25)
- NEVER use MM/DD/YYYY (US format) - this is WRONG for German documents!
- Example conversions:
  * "15.03.1985" → "1985-03-15" (NOT "1985-15-03"!)
  * "01.11.2020" → "2020-11-01" (NOT "2020-01-11"!)
  * "25.12.1990" → "1990-12-25" (NOT "1990-25-12"!)

- Convert ALL numbers to numeric values (remove €, commas, dots for thousands)
  * Examples: "1.500,50 €" → 1500.50, "50.000" → 50000
- For arrays (kinder, bausparvertraege, lebensversicherungen, ratenkredite, privatdarlehen, bestehendeImmobilien), create array if multiple entries exist
- If a field is unclear or ambiguous, use null
- Return ONLY the JSON object, absolutely no other text
- Maximum 3 bausparvertraege, 3 lebensversicherungen, 3 ratenkredite, 3 privatdarlehen
- Maximum 10 children in kinder array

🔴 EXTRA ATTENTION REQUIRED FOR:
- Steuer-ID (Tax ID) - 11-digit number
- IBAN - bank account number
- Rentenbeginn - retirement date
- Familienstand - check for checkboxes or written status
- Sonstige Verbindlichkeiten - other liabilities
- All dates must be DD.MM.YYYY → YYYY-MM-DD`,
            },
          ],
        },
      ],
    });

    // Extract the JSON from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    logger.info('AI parsing response received', {
      responseLength: responseText.length,
    });

    // Parse the JSON response
    let data: SelbstauskunftData;
    try {
      // Remove any markdown code blocks if present
      const cleanedJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      data = JSON.parse(cleanedJson);
    } catch (parseError) {
      logger.error('Failed to parse AI response as JSON', {
        response: responseText,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error('AI returned invalid JSON');
    }

    logger.info('AI PDF parsing completed successfully', {
      extractedFields: Object.keys(data).filter(k => data[k as keyof SelbstauskunftData] !== null && data[k as keyof SelbstauskunftData] !== undefined),
      vorname: data.vorname,
      nachname: data.nachname,
    });

    return data;
  } catch (error) {
    logger.error('AI PDF parsing failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error('Failed to parse PDF with AI');
  }
}

/**
 * Validate that we have minimum required data
 */
export function hasMinimumData(data: SelbstauskunftData): boolean {
  // At minimum, we need a name
  return !!(data.vorname || data.nachname);
}

/**
 * Fill missing data with sensible defaults for TEST_MODUS
 */
export function fillDefaultsForTest(data: SelbstauskunftData): SelbstauskunftData {
  return {
    ...data,
    vorname: data.vorname || 'Test',
    nachname: data.nachname || 'User',
    geburtsdatum: data.geburtsdatum || '1990-01-01',
    finanzierungszweck: data.finanzierungszweck || 'KAUF',
    kaufpreis: data.kaufpreis || 300000,
    eigenkapital: data.eigenkapital || 60000,
    beschaeftigungsart: data.beschaeftigungsart || 'ANGESTELLT',
  };
}
