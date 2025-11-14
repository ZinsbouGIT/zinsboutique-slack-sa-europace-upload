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
              text: `🇩🇪 DEUTSCHES DOKUMENT - GERMAN DOCUMENT 🇩🇪

⚠️⚠️⚠️ KRITISCH: DEUTSCHES DATUMSFORMAT ⚠️⚠️⚠️

DIESES DOKUMENT IST EIN DEUTSCHES SELBSTAUSKUNFT-FORMULAR!
IN DEUTSCHLAND IST DAS DATUMSFORMAT IMMER: TAG.MONAT.JAHR (DD.MM.YYYY)

🔴🔴🔴 ABSOLUT NIEMALS US-FORMAT (MM/DD/YYYY) VERWENDEN! 🔴🔴🔴

DATUM-KONVERTIERUNGS-REGELN (LESEN SIE DIESE 3X!!!):
1. Deutsches Format im PDF: DD.MM.YYYY (z.B. 15.03.1985)
2. ERSTE Zahl = TAG (day), ZWEITE Zahl = MONAT (month), DRITTE Zahl = JAHR (year)
3. Konvertierung zu ISO: YYYY-MM-DD
4. Beispiel: "15.03.1985" → "1985-03-15" (JAHR-MONAT-TAG)

❌ FALSCH: "15.03.1985" → "1985-15-03" (NIEMALS!)
✅ RICHTIG: "15.03.1985" → "1985-03-15"

❌ FALSCH: "01.11.2020" → "2020-01-11" (Das wäre 11. Januar statt 1. November!)
✅ RICHTIG: "01.11.2020" → "2020-11-01" (1. November)

❌ FALSCH: "25.12.1990" → "1990-25-12" (Unmöglicher Monat 25!)
✅ RICHTIG: "25.12.1990" → "1990-12-25" (25. Dezember)

MERKE: Bei deutschen Daten steht der TAG IMMER ZUERST!

🔴 CHECKBOX & MULTIPLE CHOICE FIELDS 🔴

For fields with checkboxes/radio buttons:
1. Examine ALL options in the group
2. Identify which is marked (filled circle ⚫, checkmark ✓, filled box ☑)
3. Unmarked appear as empty outlines (⚬, ○, ☐)
4. Output the value for the marked option
5. If all look the same or unclear, output null

Analyze this German Selbstauskunft (self-disclosure) form and extract ALL available information for BOTH applicants if present.

CRITICAL: Many PDFs contain TWO applicants:
- Antragsteller 1 (First Applicant)
- Antragsteller 2 / Mitantragsteller (Second Applicant / Co-Applicant)

Return ONLY a valid JSON object (no markdown, no explanation) with this structure. Extract EVERY field you can find from ALL sections:

{
  // ==========================================
  // ANTRAGSTELLER 1 - PERSONAL INFORMATION
  // ==========================================
  "vorname": "First name",
  "nachname": "Last name",
  "geburtsdatum": "🔴 CRITICAL: Birth date YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '15.03.1985' = Day 15, Month 03 (March) → '1985-03-15'. DO NOT swap!",
  "geburtsort": "Place of birth",
  "email": "Email address",
  "telefonnummer": "Phone number",
  "familienstand_reasoning": "Look at Familienstand section near Antragsteller 1's personal data. Identify which option is marked/selected (usually indicated by filled circle, checkmark, or different styling). State: 'The [option] option appears marked/selected.'",
  "familienstand": "Based on the marked option from reasoning, return: 'LEDIG', 'VERHEIRATET', 'GESCHIEDEN', 'VERWITWET', 'GETRENNT_LEBEND', or 'EINGETRAGENE_LEBENSPARTNERSCHAFT'. Output ONLY the value.",
  "staatsangehoerigkeit": "Nationality (DE/AT/CH/etc - ISO 3166-1 alpha-2)",
  "steuerId": "🔴 CRITICAL: Tax ID / Steuer-ID / Steueridentifikationsnummer (11-digit number)",

  // Current Address
  "strasse": "Street name only",
  "hausnummer": "House number",
  "plz": "5-digit postal code",
  "ort": "City",
  "wohnhaftSeit": "🔴 CRITICAL: Living there since YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '15.08.2010' = Day 15, Month 08 (August) → '2010-08-15'. DO NOT swap!",
  "wohnverhaeltnis": "EIGENTUM/MIETE/ELTERN",
  "monatlicheKaltmiete": Monthly rent (if renting),

  // Previous Address
  "vorherigePlz": "Previous postal code",
  "vorherigeStadt": "Previous city",

  // Employment
  "arbeitgeber": "Employer name",
  "beschaeftigungsart": "ANGESTELLTER/ARBEITER/BEAMTER/SELBSTSTAENDIGER/FREIBERUFLER/RENTNER/ARBEITSLOSER/HAUSHALTENDE_PERSON",
  "beruf": "Occupation/profession",
  "beschaeftigtSeit": "🔴🔴🔴 ULTRA CRITICAL: Employed since date in YYYY-MM-DD format. The PDF shows DD.MM.YYYY (GERMAN format). You MUST convert: FIRST number = DAY, SECOND number = MONTH, THIRD = YEAR. Examples: '01.07.2023' = Day 01, Month 07 (July) → '2023-07-01' | '15.03.2020' = Day 15, Month 03 (March) → '2020-03-15' | '28.12.2019' = Day 28, Month 12 (December) → '2019-12-28'. DO NOT swap them!",
  "beschaeftigungsstatus": "UNBEFRISTET/BEFRISTET (only for ANGESTELLTER/ARBEITER)",
  "bruttoeinkommen": Gross monthly income,
  "nettoeinkommenMonatlich": Net monthly income,
  "anzahlGehaelterProJahr": "ZWOELF/DREIZEHN/VIERZEHN",

  // BLOCK-005: Rente & Riester (Situation after retirement)
  "rentenbeginn": "🔴🔴🔴 ULTRA CRITICAL: Planned retirement date YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '01.07.2030' = Day 01, Month 07 (July) → '2030-07-01'. DO NOT swap!",
  "gesetzlicheRenteMonatlich": Monthly statutory pension amount (Gesetzliche Rente),
  "privateRenteMonatlich": Monthly private pension amount (Private Rente, Riester, etc.),
  "sonstigesEinkommenNachRente": Other income after retirement,

  // ==========================================
  // BLOCK-006: KINDER (Children - up to 10)
  // ==========================================
  "kinder": [
    {
      "name": "Child name",
      "geburtsdatum": "🔴 Child birth date YYYY-MM-DD (PDF shows DD.MM.YYYY - FIRST number is DAY! Example: 15.03.2010 → 2010-03-15)",
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

  // Bank and Savings Accounts (Arrays for Europace positionen)
  "bankUndSparguthaben": [
    {
      "aktuellerWert": Current value of bank/savings accounts (e.g., 50000),
      "zinsertragJaehrlich": Annual interest income (e.g., 500)
    }
  ],

  // Securities/Stocks (Arrays for Europace positionen)
  "wertpapiere": [
    {
      "aktuellerWert": Current value of securities/stocks (e.g., 35000),
      "dividendenJaehrlich": Annual dividend income (e.g., 1000)
    }
  ],

  // Savings Plans (Arrays for Europace positionen)
  "sparplaene": [
    {
      "aktuellerWert": Current value of savings plan (e.g., 12000),
      "beitragMonatlich": Monthly contribution (e.g., 300)
    }
  ],

  // Other Assets (Arrays for Europace positionen)
  "sonstigeVermoegen": [
    {
      "aktuellerWert": Value of other assets (e.g., 8000),
      "beschreibung": "Description (e.g., Gold, Kunst, Oldtimer, etc.)"
    }
  ],

  // Legacy single value fields (still extract these for backwards compatibility)
  "summeBankUndSparguthaben": Sum of all bank and savings accounts,
  "sonstigesVermoegenWert": Other assets value (e.g., 8000),

  // ==========================================
  // BLOCK-007: EINNAHMEN (Additional Income) - VERY IMPORTANT!
  // Look for sections like "Sonstige Einnahmen", "Zusätzliche Einnahmen"
  // ==========================================

  // Kindergeld (Arrays for Europace positionen)
  "kindergeld": [
    {
      "betragMonatlich": Monthly child benefit amount (e.g., 510 for multiple children, 250 per child)
    }
  ],

  // Sonstige Einnahmen (Arrays for Europace positionen)
  "sonstigeEinnahmen": [
    {
      "betragMonatlich": Other monthly income (e.g., 500),
      "beschreibung": "Description (e.g., Mieteinnahmen Garage, etc.)"
    }
  ],

  // Variable Einkünfte (Arrays for Europace positionen)
  "variableEinkuenfte": [
    {
      "betragMonatlich": Variable monthly income like bonus, commission (e.g., 300)
    }
  ],

  // Ehegattenunterhalt (Arrays for Europace positionen)
  "ehegattenunterhalt": [
    {
      "betragMonatlich": Spousal support received monthly (e.g., 0)
    }
  ],

  // Unbefristete Zusatzrenten (Arrays for Europace positionen)
  "unbefristeteZusatzrenten": [
    {
      "betragMonatlich": Unlimited additional pension monthly (Betriebsrente, etc.) (e.g., 200)
    }
  ],

  "einkuenfteAusNebentaetigkeit": [
    {
      "betragMonatlich": Monthly amount from side job (e.g., 400),
      "beschreibung": "Description of side job (e.g., Freelance Beratung)",
      "beginnDerNebentaetigkeit": "Start date of side job YYYY-MM-DD (e.g., 2022-01-01)"
    }
  ],

  // Legacy single value fields (still extract these for backwards compatibility)
  "sonstigeEinnahmenMonatlich": Other monthly income (e.g., 500),
  "variableEinkuenfteMonatlich": Variable monthly income (e.g., 300),
  "ehegattenunterhaltMonatlich": Spousal support received monthly (e.g., 0),
  "unbefristeteZusatzrentenMonatlich": Unlimited additional pension monthly (e.g., 200),

  // ==========================================
  // BLOCK-007: AUSGABEN (Expenses) - VERY IMPORTANT!
  // Look for sections like "Ausgaben", "Kosten", "Verpflichtungen"
  // ==========================================

  // Mietausgaben (Arrays for Europace positionen)
  "mietAusgaben": [
    {
      "betragMonatlich": Monthly rent expenses (current rent payment) (e.g., 1200),
      "entfallenMitFinanzierung": false  // Will these expenses cease with financing? Usually false
    }
  ],

  // Private Krankenversicherung (Arrays for Europace positionen)
  "privateKrankenversicherung": [
    {
      "betragMonatlich": Monthly private health insurance cost (e.g., 450)
    }
  ],

  // Sonstige Ausgaben (Arrays for Europace positionen)
  "sonstigeAusgaben": [
    {
      "betragMonatlich": Other monthly expenses (e.g., 800),
      "beschreibung": "Description of other expenses"
    }
  ],

  // Unterhaltsverpflichtungen (Arrays for Europace positionen)
  "unterhaltsverpflichtungen": [
    {
      "betragMonatlich": Monthly alimony/child support obligations (e.g., 500),
      "empfaenger": "Recipient name (optional)"
    }
  ],

  // Legacy single value fields (still extract these for backwards compatibility)
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

  // Sonstige Verbindlichkeiten (Arrays for Europace positionen)
  "sonstigeVerbindlichkeiten": [
    {
      "rateMonatlich": Monthly payment for other liabilities (e.g., 50),
      "beschreibung": "Description of liability",
      "restschuld": Remaining debt (optional)
    }
  ],

  // Legacy single value field (still extract this for backwards compatibility)
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
  // BLOCK-011: BESTEHENDE IMMOBILIEN (Existing Properties) - Look for "Weitere Immobilien", "Bestehende Immobilien", "Immobilienbesitz"
  // ==========================================
  "bestehendeImmobilien": [
    {
      "bezeichnung": "Property description/name (e.g., 'Eigentumswohnung Berlin')",
      "verkehrswert": Market/traffic value (Verkehrswert),
      "marktwert": Market value (Marktwert),
      "adresse": {
        "strasse": "Street name",
        "hausnummer": "House number",
        "postleitzahl": "Postal code",
        "ort": "City"
      },
      "objektArt": "EINFAMILIENHAUS/EIGENTUMSWOHNUNG/MEHRFAMILIENHAUS/ZWEIFAMILIENHAUS/etc",
      "grundstuecksgroesse": Plot size in sqm (0 if apartment),
      "baujahr": Year built,
      "wohnflaeche": Living space in sqm,
      "nutzungsArt": "EIGENGENUTZT/VERMIETET/TEILVERMIETET",
      "mieteinnahmenNettoKaltMonatlich": Monthly net cold rent income (if rented),
      "vermieteteFlaeche": Rented space in sqm (if rented),
      "bestehendeDarlehen": [
        {
          "darlehensArt": "IMMOBILIENDARLEHEN/ANNUITAETENDARLEHEN/etc",
          "restschuld": Remaining debt (aktuelleRestschuld),
          "rateMonatlich": Monthly payment rate,
          "zinsBindungEndetAm": "Interest binding end date YYYY-MM-DD",
          "eingetrageneGrundschuld": Registered land charge amount
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
  "antragsteller2_geburtsdatum": "🔴 CRITICAL: Second applicant birth date YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '15.03.1985' = Day 15, Month 03 (March) → '1985-03-15'. DO NOT swap!",
  "antragsteller2_geburtsort": "Second applicant place of birth",
  "antragsteller2_email": "Second applicant email",
  "antragsteller2_telefonnummer": "Second applicant phone",
  "antragsteller2_familienstand_reasoning": "If Antragsteller 2 exists (has name), look at their Familienstand section. Identify marked option. If no Antragsteller 2, return null. State: 'The [option] option appears marked' or null.",
  "antragsteller2_familienstand": "If reasoning is null, return null. Otherwise return: 'LEDIG', 'VERHEIRATET', 'GESCHIEDEN', 'VERWITWET', 'GETRENNT_LEBEND', or 'EINGETRAGENE_LEBENSPARTNERSCHAFT'.",
  "antragsteller2_staatsangehoerigkeit": "Second applicant nationality",
  "antragsteller2_steuerId": "🔴 CRITICAL: Second applicant Tax ID / Steuer-ID (11-digit number)",
  "antragsteller2_strasse": "Second applicant street (or same as applicant 1)",
  "antragsteller2_hausnummer": "Second applicant house number",
  "antragsteller2_plz": "Second applicant postal code",
  "antragsteller2_ort": "Second applicant city",
  "antragsteller2_wohnhaftSeit": "🔴 CRITICAL: Second applicant living there since YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '15.08.2010' = Day 15, Month 08 (August) → '2010-08-15'. DO NOT swap!",
  "antragsteller2_arbeitgeber": "Second applicant employer",
  "antragsteller2_beschaeftigungsart": "Second applicant employment type",
  "antragsteller2_beschaeftigungsstatus": "Second applicant employment status",
  "antragsteller2_beruf": "Second applicant profession",
  "antragsteller2_beschaeftigtSeit": "🔴🔴🔴 ULTRA CRITICAL: Second applicant employed since date in YYYY-MM-DD format. The PDF shows DD.MM.YYYY (GERMAN format). You MUST convert: FIRST number = DAY, SECOND number = MONTH, THIRD = YEAR. Examples: '01.07.2023' = Day 01, Month 07 (July) → '2023-07-01' | '15.03.2020' = Day 15, Month 03 (March) → '2020-03-15' | '28.12.2019' = Day 28, Month 12 (December) → '2019-12-28'. DO NOT swap them!",
  "antragsteller2_nettoeinkommenMonatlich": "Second applicant net monthly income",
  "antragsteller2_anzahlGehaelterProJahr": "Second applicant number of salaries per year",

  // BLOCK-005: Second applicant retirement
  "antragsteller2_rentenbeginn": "🔴🔴🔴 ULTRA CRITICAL: Second applicant planned retirement date YYYY-MM-DD (PDF shows DD.MM.YYYY GERMAN format). Convert: FIRST=DAY, SECOND=MONTH. Example: '01.07.2030' = Day 01, Month 07 (July) → '2030-07-01'. DO NOT swap!",
  "antragsteller2_gesetzlicheRenteMonatlich": "Second applicant statutory pension",
  "antragsteller2_privateRenteMonatlich": "Second applicant private pension",
  "antragsteller2_sonstigesEinkommenNachRente": "Second applicant other income after retirement",

  // BLOCK-008: Second applicant bank account
  "antragsteller2_iban": "🔴 CRITICAL: Second applicant IBAN",
  "antragsteller2_bic": "Second applicant BIC",
  "antragsteller2_bankname": "Second applicant bank name",
  "antragsteller2_kontoinhaber": "Second applicant account holder"
}

🚨🚨🚨 CRITICAL RULES 🚨🚨🚨

⚠️⚠️⚠️ DATUM-WARNUNG NR. 1 ⚠️⚠️⚠️
DIESES DOKUMENT VERWENDET DEUTSCHES DATUMSFORMAT!
IM PDF: TAG.MONAT.JAHR (DD.MM.YYYY)
AUSGABE: JAHR-MONAT-TAG (YYYY-MM-DD)
DIE ERSTE ZAHL IST IMMER DER TAG!!!

BEISPIELE (LESEN SIE DIESE NOCHMAL!!!):
✅ "15.03.1985" → "1985-03-15" (15. März 1985)
❌ "15.03.1985" → "1985-15-03" (FALSCH! Monat 15 gibt es nicht!)

✅ "01.11.2020" → "2020-11-01" (1. November 2020)
❌ "01.11.2020" → "2020-01-11" (FALSCH! Das wäre 11. Januar!)

✅ "25.12.1990" → "1990-12-25" (25. Dezember 1990)
❌ "25.12.1990" → "1990-25-12" (FALSCH! Monat 25 existiert nicht!)

✅ "01.07.2030" → "2030-07-01" (1. Juli 2030)
❌ "01.07.2030" → "2030-01-07" (FALSCH! Das wäre 7. Januar!)

MERKSATZ: In Deutschland steht der TAG IMMER ZUERST, dann der MONAT, dann das JAHR!
NIEMALS US-Format MM/DD/YYYY verwenden!

OTHER CRITICAL RULES:
- ONLY extract data that is EXPLICITLY present in the document
- NEVER make up, guess, or infer data that is not clearly visible
- Use null for ALL fields not present in the document
- IMPORTANT: Check for BOTH applicants (Antragsteller 1 AND Antragsteller 2 / Mitantragsteller)
- If second applicant exists, extract ALL their data with "antragsteller2_" prefix
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
- Rentenbeginn - retirement date (REMEMBER: DD.MM.YYYY → YYYY-MM-DD!!!)
- Geburtsdatum - birth date (REMEMBER: DD.MM.YYYY → YYYY-MM-DD!!!)
- Familienstand - ⚠️⚠️⚠️ MOST CRITICAL FIELD - HIGHEST FAILURE RATE! ⚠️⚠️⚠️
  REAL EXAMPLE FROM TYPICAL PDF:
    ⚬ Verheiratet           ← DOTTED circle (first option, but NOT selected!)
      ⚬ mit Gütertrennung   ← Sub-option, ignore
      ⚬ ohne Gütertrennung  ← Sub-option, ignore
    ⚫ Ledig                 ← SOLID BLACK circle (THIS IS THE SELECTED ONE!)
    ⚬ Getrennt lebend       ← DOTTED circle (not selected)
    ⚬ Geschieden            ← DOTTED circle (not selected)
    ⚬ Lebenspartnerschaft   ← DOTTED circle (not selected)
    ⚬ Verwitwet             ← DOTTED circle (not selected)

  CORRECT OUTPUT: "LEDIG" (because ONLY Ledig has solid black ⚫, all others are dotted ⚬)
  WRONG: Do NOT output "VERHEIRATET" just because it appears first!

  PROCESS: Compare ALL circles → Find the ONE that is SOLID BLACK vs DOTTED → Read text next to it → Output enum

- Sonstige Verbindlichkeiten - other liabilities
- ALL DATES: DD.MM.YYYY (PDF) → YYYY-MM-DD (Output) - FIRST NUMBER = DAY!`,
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
      // Remove any markdown code blocks and text before/after JSON
      let cleanedJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Remove any text before the first {
      const firstBrace = cleanedJson.indexOf('{');
      if (firstBrace > 0) {
        cleanedJson = cleanedJson.substring(firstBrace);
      }

      // Remove any text after the last }
      const lastBrace = cleanedJson.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < cleanedJson.length - 1) {
        cleanedJson = cleanedJson.substring(0, lastBrace + 1);
      }

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
      familienstand_reasoning: data.familienstand_reasoning, // DEBUG: See AI's reasoning
      familienstand: data.familienstand, // DEBUG: Check what AI extracts
      antragsteller2_familienstand_reasoning: data.antragsteller2_familienstand_reasoning, // DEBUG: See reasoning for A2
      antragsteller2_familienstand: data.antragsteller2_familienstand, // DEBUG: Check Antragsteller 2
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
