/**
 * Enum mappers for Europace API
 * Converts extracted German text values to Europace API enum values
 */

export function mapFamilienstand(familienstand?: string): string | undefined {
  if (!familienstand) return undefined;

  const normalized = familienstand.toLowerCase().trim();

  if (normalized.includes('ledig')) return 'LEDIG';
  if (normalized.includes('verheiratet')) return 'VERHEIRATET';
  if (normalized.includes('geschieden')) return 'GESCHIEDEN';
  if (normalized.includes('verwitwet')) return 'VERWITWET';
  if (normalized.includes('getrennt')) return 'GETRENNT_LEBEND';
  if (normalized.includes('lebenspartnerschaft')) return 'EINGETRAGENE_LEBENSPARTNERSCHAFT';

  return 'LEDIG'; // Default
}

export function mapBeschaeftigungsart(art?: string): string | undefined {
  if (!art) return 'ANGESTELLTER';

  const normalized = art.toLowerCase().trim();

  // EXACT values from field-mapping documentation (Block 004)
  if (normalized.includes('angestellt')) return 'ANGESTELLTER';
  if (normalized.includes('arbeiter')) return 'ARBEITER';
  if (normalized.includes('beamter')) return 'BEAMTER';
  if (normalized.includes('selbst') || normalized.includes('selbständig')) return 'SELBSTSTAENDIGER';
  if (normalized.includes('freiberuf')) return 'FREIBERUFLER';
  if (normalized.includes('hausfrau') || normalized.includes('hausmann')) return 'HAUSHALTENDE_PERSON';
  if (normalized.includes('rentner') || normalized.includes('pension')) return 'RENTNER';
  if (normalized.includes('arbeitslos')) return 'ARBEITSLOSER';

  return 'ANGESTELLTER'; // Default
}

export function mapWohnart(wohnverhaeltnis?: string): string | undefined {
  if (!wohnverhaeltnis) return undefined;

  const normalized = wohnverhaeltnis.toLowerCase().trim();

  if (normalized.includes('eigentum')) return 'EIGENTUM';
  if (normalized.includes('miete')) return 'MIETE';
  if (normalized.includes('eltern')) return 'BEI_DEN_ELTERN_WOHNHAFT';
  if (normalized.includes('mietfrei')) return 'MIETFREI';

  return 'MIETE'; // Default
}

export function mapObjektart(objektart?: string): string | undefined {
  if (!objektart) return 'EINFAMILIENHAUS';

  const normalized = objektart.toLowerCase().trim();

  if (normalized.includes('einfamilienhaus')) return 'EINFAMILIENHAUS';
  if (normalized.includes('zweifamilienhaus')) return 'ZWEIFAMILIENHAUS';
  if (normalized.includes('doppelhaus')) return 'DOPPELHAUSHAELFTE';
  if (normalized.includes('reihenhaus')) return 'REIHENHAUS';
  if (normalized.includes('eigentumswohnung') || normalized.includes('etw')) return 'EIGENTUMSWOHNUNG';
  if (normalized.includes('mehrfamilienhaus')) return 'MEHRFAMILIENHAUS';
  if (normalized.includes('grundstück')) return 'GRUNDSTUECK';

  return 'EINFAMILIENHAUS'; // Default
}

export function mapNutzungsart(nutzungsart?: string): string | undefined {
  if (!nutzungsart) return 'EIGENGENUTZT';

  const normalized = nutzungsart.toLowerCase().trim();

  if (normalized.includes('eigen')) return 'EIGENGENUTZT';
  if (normalized.includes('vermietet') && !normalized.includes('teil')) return 'VERMIETET';
  if (normalized.includes('teil') && normalized.includes('vermietet')) return 'TEILWEISE_VERMIETET';

  return 'EIGENGENUTZT'; // Default
}

export function mapFinanzierungszweck(zweck?: string): string | undefined {
  if (!zweck) return 'KAUF';

  const normalized = zweck.toLowerCase().trim();

  if (normalized.includes('kauf')) return 'KAUF';
  if (normalized.includes('neubau')) return 'NEUBAU';
  if (normalized.includes('anschluss')) return 'ANSCHLUSSFINANZIERUNG';
  if (normalized.includes('modernisierung') || normalized.includes('umbau')) return 'MODERNISIERUNG_UMBAU';
  if (normalized.includes('kapitalbeschaffung')) return 'KAPITALBESCHAFFUNG';

  return 'KAUF'; // Default
}

export function mapStaatsangehoerigkeit(nationality?: string): string | undefined {
  if (!nationality) return 'DE';

  const normalized = nationality.toLowerCase().trim();

  if (normalized.includes('deutsch') || normalized === 'de') return 'DE';
  if (normalized.includes('österreich') || normalized === 'at') return 'AT';
  if (normalized.includes('schweiz') || normalized === 'ch') return 'CH';

  // For other countries, return ISO 3166-1 alpha-2 code if available
  return 'DE'; // Default to Germany
}

/**
 * Parse German phone number into area code and number
 * Examples:
 * - "0151 58557703" → { vorwahl: "0151", nummer: "58557703" }
 * - "(0151) 58557703" → { vorwahl: "0151", nummer: "58557703" }
 * - "+49 151 58557703" → { vorwahl: "0151", nummer: "58557703" }
 */
export function parseTelefonnummer(telefonnummer?: string): { vorwahl?: string; nummer?: string } | undefined {
  if (!telefonnummer) return undefined;

  // Remove all formatting characters
  let cleaned = telefonnummer.replace(/[\s\(\)\-\/]/g, '');

  // Handle international format (+49)
  if (cleaned.startsWith('+49')) {
    cleaned = '0' + cleaned.substring(3);
  }

  // Try to split into area code and number
  // German mobile: 015x, 016x, 017x (4 digits)
  // German landline: 0xxx (3-5 digits)
  const mobileMatch = cleaned.match(/^(015\d|016\d|017\d)(\d+)$/);
  if (mobileMatch) {
    return {
      vorwahl: mobileMatch[1],
      nummer: mobileMatch[2],
    };
  }

  const landlineMatch = cleaned.match(/^(0\d{2,4})(\d+)$/);
  if (landlineMatch) {
    return {
      vorwahl: landlineMatch[1],
      nummer: landlineMatch[2],
    };
  }

  // Fallback: return as-is
  return {
    vorwahl: undefined,
    nummer: cleaned,
  };
}

/**
 * Normalize German date from various formats to YYYY-MM-DD
 * Examples:
 * - "21.01.1982" → "1982-01-21"
 * - "21/01/1982" → "1982-01-21"
 * - "1982-01-21" → "1982-01-21" (already correct)
 */
export function normalizeDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;

  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // German format: DD.MM.YYYY or DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})$/);
  if (match) {
    let day = match[1].padStart(2, '0');
    let month = match[2].padStart(2, '0');
    let year = match[3];

    // Handle 2-digit years
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }

    return `${year}-${month}-${day}`;
  }

  return dateStr; // Return as-is if can't parse
}

/**
 * Format German number (handle comma as decimal separator)
 * Examples:
 * - "1.500,50" → 1500.50
 * - "1500.50" → 1500.50
 * - "1500" → 1500
 */
export function parseGermanNumber(numStr?: string | number): number | undefined {
  if (numStr === undefined || numStr === null) return undefined;
  if (typeof numStr === 'number') return numStr;

  // Remove spaces
  let cleaned = numStr.trim().replace(/\s/g, '');

  // German format: 1.500,50 → 1500.50
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Only comma: 1500,50 → 1500.50
  else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}
