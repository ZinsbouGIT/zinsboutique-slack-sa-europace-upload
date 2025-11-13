import { logger } from '../utils/logger';
const pdfParse = require('pdf-parse');

export interface SelbstauskunftData {
  // Personal Information
  anrede?: string; // HERR, FRAU
  titel?: string; // Dr., Prof., Prof. Dr.
  vorname?: string;
  nachname?: string;
  geburtsdatum?: string;
  geburtsort?: string;
  email?: string;
  telefonnummer?: string;
  familienstand?: string; // LEDIG, VERHEIRATET, GESCHIEDEN, VERWITWET
  staatsangehoerigkeit?: string;
  anzahlKinder?: number;
  steuerId?: string;

  // Retirement (Block 5)
  rentenbeginn?: string;
  gesetzlicheRenteMonatlich?: number;
  privateRenteMonatlich?: number;
  sonstigesEinkommenNachRente?: number;

  // Children details
  kindergeldFuerKinderUnter18?: boolean;
  kinder?: Array<{
    name?: string;
    geburtsdatum?: string;
    kindergeldWirdBezogen?: boolean;
    wohnhaftBeiAntragsteller?: boolean;
    unterhalt?: number;
  }>;

  // Bank account details
  bic?: string;

  // Second Applicant (if applicable) - ALL fields
  antragsteller2_anrede?: string;
  antragsteller2_titel?: string;
  antragsteller2_vorname?: string;
  antragsteller2_nachname?: string;
  antragsteller2_geburtsdatum?: string;
  antragsteller2_geburtsort?: string;
  antragsteller2_email?: string;
  antragsteller2_telefonnummer?: string;
  antragsteller2_familienstand?: string;
  antragsteller2_staatsangehoerigkeit?: string;
  antragsteller2_strasse?: string;
  antragsteller2_hausnummer?: string;
  antragsteller2_plz?: string;
  antragsteller2_ort?: string;
  antragsteller2_wohnhaftSeit?: string;
  antragsteller2_arbeitgeber?: string;
  antragsteller2_beschaeftigungsart?: string;
  antragsteller2_beschaeftigungsstatus?: string;
  antragsteller2_beruf?: string;
  antragsteller2_beschaeftigtSeit?: string;
  antragsteller2_nettoeinkommenMonatlich?: number;
  antragsteller2_anzahlGehaelterProJahr?: string;
  antragsteller2_steuerId?: string;
  antragsteller2_rentenbeginn?: string;
  antragsteller2_gesetzlicheRenteMonatlich?: number;
  antragsteller2_privateRenteMonatlich?: number;
  antragsteller2_anzahlKinder?: number;
  antragsteller2_kindergeldFuerKinderUnter18?: boolean;
  antragsteller2_iban?: string;
  antragsteller2_bic?: string;
  antragsteller2_bankname?: string;
  antragsteller2_kontoinhaber?: string;

  // Current Address
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  wohnhaftSeit?: string;
  wohnverhaeltnis?: string; // EIGENTUM, MIETE, ELTERN
  monatlicheKaltmiete?: number;

  // Previous Address (if recently moved)
  vorherigeStrasse?: string;
  vorherigePlz?: string;
  vorherigeStadt?: string;

  // Employment
  arbeitgeber?: string;
  beschaeftigungsart?: string; // ANGESTELLT, SELBSTSTAENDIG, BEAMTER, RENTNER
  beruf?: string;
  beschaeftigtSeit?: string;
  bruttoeinkommen?: number;
  nettoeinkommenMonatlich?: number;

  // Block 7: Assets (Vermögen)
  summeBankUndSparguthaben?: number;
  zinsertragJaehrlich?: number;
  depotwert?: number;
  dividendenJaehrlich?: number;
  sparplaeneAktuellerWert?: number;
  sparplaeneBeitragMonatlich?: number;
  sonstigesVermoegenWert?: number;

  bausparvertraege?: Array<{
    angesparterBetrag?: number;
    sparbeitrag?: number;
    bausparkasse?: string;
    bausparsumme?: number;
  }>;

  lebensversicherungen?: Array<{
    rueckkaufswert?: number;
    praemieMonatlich?: number;
  }>;

  // Block 7: Income (Einnahmen)
  sonstigeEinnahmenMonatlich?: number;
  variableEinkuenfteMonatlich?: number;
  ehegattenunterhaltMonatlich?: number;
  unbefristeteZusatzrentenMonatlich?: number;
  einkuenfteAusNebentaetigkeit?: Array<{
    betragMonatlich?: number;
    beschreibung?: string;
    beginnDerNebentaetigkeit?: string;
  }>;

  // Additional Income (old fields for backwards compatibility)
  zusatzlichesEinkommen?: number;
  nebeneinkommen?: number;
  mieteinnahmen?: number;
  kindergeld?: number;
  elterngeld?: number;
  sonstigeEinkuenfte?: number;

  // Block 7: Expenses (Ausgaben)
  mietausgabenMonatlich?: number;
  lebenshaltungskostenMonatlich?: number;
  unterhaltsverpflichtungenMonatlich?: number;
  privateKrankenversicherungMonatlich?: number;
  sonstigeAusgabenMonatlich?: number;
  sonstigeVersicherungsausgabenMonatlich?: number;

  // Expenses (old fields for backwards compatibility)
  monatlicheAusgaben?: number;
  unterhaltszahlungen?: number;
  krankenversicherung?: number;
  lebenshaltungskosten?: number;

  // Block 7: Liabilities (Verbindlichkeiten)
  ratenkredite?: Array<{
    rateMonatlich?: number;
    glaeubiger?: string;
    restschuld?: number;
    laufzeitende?: string;
  }>;

  privatdarlehen?: Array<{
    rateMonatlich?: number;
    glaeubiger?: string;
    restschuld?: number;
    laufzeitende?: string;
  }>;

  // Other Liabilities
  sonstigeVerbindlichkeitRateMonatlich?: number;

  // Existing Financial Obligations (old format for backwards compatibility)
  bestehendeKredite?: Array<{
    kreditart?: string;
    kreditgeber?: string;
    restschuld?: number;
    monatlicheRate?: number;
    laufzeitEnde?: string;
  }>;
  kreditkartenLimit?: number;
  buergschaften?: number;

  // Property Details (if buying/financing)
  objektart?: string; // EINFAMILIENHAUS, EIGENTUMSWOHNUNG, etc.
  nutzungsart?: string; // EIGENGENUTZT, VERMIETET
  baujahr?: number;
  wohnflaeche?: number;
  grundstuecksgroesse?: number;
  anzahlZimmer?: number;
  anzahlGaragen?: number;
  energieausweis?: string;

  // Financing Details
  kaufpreis?: number;
  eigenkapital?: number;
  sparguthaben?: number;
  wertpapiere?: number;
  finanzierungszweck?: string;
  darlehenswunsch?: number;
  laufzeitJahre?: number;
  zinsbindungJahre?: number;

  // Bank Information
  kontoinhaber?: string;
  iban?: string;
  bankname?: string;

  // Signature & Date
  unterschriftOrt?: string;
  unterschriftDatum?: string;

  // Raw extracted text for debugging
  rawText?: string;
}

/**
 * Parse a Selbstauskunft PDF and extract structured data
 */
export async function parseSelbstauskunftPDF(
  pdfBuffer: Buffer
): Promise<SelbstauskunftData> {
  try {
    logger.info('Starting PDF parsing');

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    logger.info('PDF text extracted', {
      pages: pdfData.numpages,
      textLength: text.length,
    });

    // Parse the extracted text to find relevant fields
    const data: SelbstauskunftData = {
      rawText: text, // Keep raw text for debugging
    };

    // Extract personal information
    data.vorname = extractField(text, [
      /vorname[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
      /first\s+name[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
    ]);

    data.nachname = extractField(text, [
      /nachname[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
      /familienname[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
      /last\s+name[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
    ]);

    data.geburtsdatum = extractDate(text, [
      /geburtsdatum[:\s]+(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /date\s+of\s+birth[:\s]+(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
      /geboren\s+am[:\s]+(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i,
    ]);

    data.email = extractField(text, [
      /e-?mail[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    ]);

    data.telefonnummer = extractField(text, [
      /telefon[:\s]+([\+\d\s\(\)\-\/]+)/i,
      /phone[:\s]+([\+\d\s\(\)\-\/]+)/i,
      /mobil[:\s]+([\+\d\s\(\)\-\/]+)/i,
    ]);

    // Extract address
    data.strasse = extractField(text, [
      /stra(?:ss|ß)e[:\s]+([a-zA-ZäöüÄÖÜß\s-]+?)(?:\s+\d|$|\n)/i,
      /street[:\s]+([a-zA-Z\s-]+?)(?:\s+\d|$|\n)/i,
    ]);

    data.hausnummer = extractField(text, [
      /hausnummer[:\s]+(\d+[a-zA-Z]?)/i,
      /stra(?:ss|ß)e[:\s]+[a-zA-ZäöüÄÖÜß\s-]+\s+(\d+[a-zA-Z]?)/i,
    ]);

    data.plz = extractField(text, [
      /plz[:\s]+(\d{5})/i,
      /postleitzahl[:\s]+(\d{5})/i,
      /(\d{5})\s+[a-zA-ZäöüÄÖÜß\s-]+(?:\n|$)/i,
    ]);

    data.ort = extractField(text, [
      /ort[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
      /stadt[:\s]+([a-zA-ZäöüÄÖÜß\s-]+)/i,
      /\d{5}\s+([a-zA-ZäöüÄÖÜß\s-]+)/i,
    ]);

    // Extract employment information
    data.arbeitgeber = extractField(text, [
      /arbeitgeber[:\s]+([a-zA-ZäöüÄÖÜß0-9\s&\.,\-]+?)(?:\n|$)/i,
      /employer[:\s]+([a-zA-Z0-9\s&\.,\-]+?)(?:\n|$)/i,
    ]);

    data.nettoeinkommenMonatlich = extractNumber(text, [
      /netto(?:einkommen)?[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
      /net\s+income[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
    ]);

    // Extract financing information
    data.kaufpreis = extractNumber(text, [
      /kaufpreis[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
      /purchase\s+price[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
    ]);

    data.eigenkapital = extractNumber(text, [
      /eigenkapital[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
      /equity[:\s]+(?:€\s*)?(\d+[.,]?\d*)/i,
    ]);

    logger.info('PDF parsing completed', {
      extractedFields: Object.keys(data).filter(k => data[k as keyof SelbstauskunftData] !== undefined),
      vorname: data.vorname,
      nachname: data.nachname,
    });

    return data;
  } catch (error) {
    logger.error('Failed to parse PDF', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to parse Selbstauskunft PDF');
  }
}

/**
 * Extract a field using multiple regex patterns
 */
function extractField(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Extract and normalize a date
 */
function extractDate(text: string, patterns: RegExp[]): string | undefined {
  const dateStr = extractField(text, patterns);
  if (!dateStr) return undefined;

  // Try to parse and normalize to YYYY-MM-DD format
  const parts = dateStr.split(/[\.\-\/]/);
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    // Handle 2-digit years
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }

    // Pad with zeros
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * Extract a number (handle German number format with comma)
 */
function extractNumber(text: string, patterns: RegExp[]): number | undefined {
  const numStr = extractField(text, patterns);
  if (!numStr) return undefined;

  // Convert German format (1.000,50) to US format (1000.50)
  const normalized = numStr.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(normalized);

  return isNaN(num) ? undefined : num;
}
