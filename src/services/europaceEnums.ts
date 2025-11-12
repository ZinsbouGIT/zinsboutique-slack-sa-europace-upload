/**
 * Europace API Enum Constants
 *
 * SINGLE SOURCE OF TRUTH - Based on europace-field-mapping-master documentation
 * All enum values in this file are proven to work with Europace API
 * Reference: europace-field-mapping-master/blocks/BLOCK-001 through BLOCK-011
 */

// ============================================================================
// BLOCK 002: Familienstand (Marital Status)
// ============================================================================
export const FAMILIENSTAND = {
  LEDIG: 'LEDIG',
  VERHEIRATET: 'VERHEIRATET',
  GESCHIEDEN: 'GESCHIEDEN',
  VERWITWET: 'VERWITWET',
  EINGETRAGENE_LEBENSPARTNERSCHAFT: 'EINGETRAGENE_LEBENSPARTNERSCHAFT',
  GETRENNT_LEBEND: 'GETRENNT_LEBEND',
} as const;

// ============================================================================
// BLOCK 004: Beschäftigungsart (Employment Type)
// ============================================================================
export const BESCHAEFTIGUNGSART = {
  ANGESTELLTER: 'ANGESTELLTER',
  ARBEITER: 'ARBEITER',
  BEAMTER: 'BEAMTER',
  SELBSTSTAENDIGER: 'SELBSTSTAENDIGER',
  FREIBERUFLER: 'FREIBERUFLER',
  RENTNER: 'RENTNER',
  ARBEITSLOSER: 'ARBEITSLOSER',
  HAUSHALTENDE_PERSON: 'HAUSHALTENDE_PERSON',
} as const;

// ============================================================================
// BLOCK 004: Beschäftigungsstatus (Employment Status)
// Note: Only for ANGESTELLTER and ARBEITER (NOT for BEAMTER)
// ============================================================================
export const BESCHAEFTIGUNGSSTATUS = {
  UNBEFRISTET: 'UNBEFRISTET',
  BEFRISTET: 'BEFRISTET',
} as const;

// ============================================================================
// BLOCK 004: Anzahl Gehälter pro Jahr
// ============================================================================
export const ANZAHL_GEHAELTER = {
  ZWOELF: 'ZWOELF',
  ZWOELF_EINHALB: 'ZWOELF_EINHALB',
  DREIZEHN: 'DREIZEHN',
  DREIZEHN_EINHALB: 'DREIZEHN_EINHALB',
  VIERZEHN: 'VIERZEHN',
  VIERZEHN_EINHALB: 'VIERZEHN_EINHALB',
  FUENFZEHN: 'FUENFZEHN',
  // Used in field-mapping docs
  ZWOELF_KOMMA_FUENF: 'ZWOELF_KOMMA_FUENF',
} as const;

// ============================================================================
// BLOCK 006: Kindergeld
// ============================================================================
export const KINDERGELD_FUER = {
  ERSTES_ODER_ZWEITES_KIND: 'ERSTES_ODER_ZWEITES_KIND',
  DRITTES_KIND: 'DRITTES_KIND',
  AB_VIERTEM_KIND: 'AB_VIERTEM_KIND',
} as const;

// ============================================================================
// BLOCK 011: Immobilientyp
// ============================================================================
export const IMMOBILIENTYP = {
  EINFAMILIENHAUS: 'EINFAMILIENHAUS',
  ZWEIFAMILIENHAUS: 'ZWEIFAMILIENHAUS',
  MEHRFAMILIENHAUS: 'MEHRFAMILIENHAUS',
  EIGENTUMSWOHNUNG: 'EIGENTUMSWOHNUNG',
  DOPPELHAUSHAELFTE: 'DOPPELHAUSHAELFTE',
  REIHENHAUS: 'REIHENHAUS',
  GRUNDSTUECK: 'GRUNDSTUECK',
} as const;

// ============================================================================
// BLOCK 011: Nutzungsart
// ============================================================================
export const NUTZUNGSART = {
  EIGENGENUTZT: 'EIGENGENUTZT',
  VERMIETET: 'VERMIETET',
  TEILVERMIETET: 'TEILVERMIETET',
} as const;

// ============================================================================
// BLOCK 011: Grundschuldart
// ============================================================================
export const GRUNDSCHULDART = {
  BUCH_GRUNDSCHULD: 'BUCH_GRUNDSCHULD',
  BRIEF_GRUNDSCHULD: 'BRIEF_GRUNDSCHULD',
} as const;

// ============================================================================
// Import Metadata
// ============================================================================
export const DATENKONTEXT = {
  TEST_MODUS: 'TEST_MODUS',
  ECHT_GESCHAEFT: 'ECHT_GESCHAEFT',
} as const;

export const PRIORITAET = {
  NIEDRIG: 'NIEDRIG',
  MITTEL: 'MITTEL',
  HOCH: 'HOCH',
} as const;

// ============================================================================
// Kinder Erfassung Type
// ============================================================================
export const KINDER_ERFASSUNG_TYPE = {
  KEINE_KINDER: 'KEINE_KINDER',
  VORHANDENE_KINDER: 'VORHANDENE_KINDER',
} as const;

// ============================================================================
// BLOCK F01: Finanzierungszweck (Financing Purpose)
// ============================================================================
export const FINANZIERUNGSZWECK = {
  KAUF: 'KAUF',
  NEUBAU: 'NEUBAU',
  KAUF_NEUBAU_VOM_BAUTRAEGER: 'KAUF_NEUBAU_VOM_BAUTRAEGER',
  MODERNISIERUNG_UMBAU_ANBAU: 'MODERNISIERUNG_UMBAU_ANBAU',
  ANSCHLUSSFINANZIERUNG: 'ANSCHLUSSFINANZIERUNG',
  KAPITALBESCHAFFUNG: 'KAPITALBESCHAFFUNG',
} as const;

// ============================================================================
// BLOCK F02: Bauweise
// ============================================================================
export const BAUWEISE = {
  MASSIV: 'MASSIV',
  HOLZ: 'HOLZ',
  FACHWERK_MIT_ZIEGELN: 'FACHWERK_MIT_ZIEGELN',
} as const;

// ============================================================================
// BLOCK 011: Bestehende Immobiliendarlehen Type
// ============================================================================
export const IMMOBILIENDARLEHEN_TYPE = {
  BESTEHENDES_IMMOBILIENDARLEHEN: 'BESTEHENDES_IMMOBILIENDARLEHEN',
} as const;

// ============================================================================
// BLOCK 011: Darlehensgeber Type
// ============================================================================
export const DARLEHENSGEBER_TYPE = {
  PRODUKTANBIETER_DARLEHENSGEBER: 'PRODUKTANBIETER_DARLEHENSGEBER',
} as const;

// ============================================================================
// Helper function to validate enum values
// ============================================================================
export function isValidEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}

/**
 * Get all valid enum values for a given enum type
 */
export function getValidEnumValues<T extends Record<string, string>>(
  enumObj: T
): string[] {
  return Object.values(enumObj);
}
