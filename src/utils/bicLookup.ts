import axios from 'axios';
import { logger } from './logger';

/**
 * Lookup BIC code from IBAN using OpenIBAN API
 *
 * Note: BIC cannot be "extracted" from IBAN - it must be looked up from a bank database.
 * The IBAN contains the bank code (BLZ), but the BIC is a separate identifier that
 * must be queried from an external source.
 *
 * This function uses the free OpenIBAN API to validate IBANs and retrieve BIC codes.
 */
async function lookupBICFromAPI(iban: string): Promise<string | null> {
  try {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    const url = `https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`;

    logger.info(`Looking up BIC for IBAN via OpenIBAN API...`);

    const response = await axios.get(url, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.valid && response.data.bankData && response.data.bankData.bic) {
      const bic = response.data.bankData.bic;
      logger.info(`✓ BIC found via API: ${bic}`);
      return bic;
    } else {
      logger.info(`OpenIBAN API did not return BIC for this IBAN`);
      return null;
    }
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      logger.error(`BIC lookup timed out after 5 seconds`);
    } else if (error.response) {
      logger.error(`BIC lookup API error: ${error.response.status} - ${error.response.statusText}`);
    } else {
      logger.error(`BIC lookup failed: ${error.message}`);
    }
    return null;
  }
}

/**
 * Main function to lookup BIC from IBAN (and optionally bank name for logging)
 *
 * @param iban - The IBAN to lookup (required)
 * @param bankName - Optional bank name for additional context/logging
 * @returns BIC code or null if not found
 */
export async function lookupBIC(iban: string, bankName?: string): Promise<string | null> {
  if (!iban || iban.trim().length === 0) {
    logger.error('Cannot lookup BIC: IBAN is empty');
    return null;
  }

  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  logger.info(`Attempting to lookup BIC for${bankName ? ` ${bankName}` : ''} with IBAN: ${cleanIban}`);

  // Lookup BIC from API using the IBAN
  const bic = await lookupBICFromAPI(cleanIban);

  if (bic) {
    return bic;
  }

  logger.info(`Could not determine BIC for IBAN: ${cleanIban}${bankName ? ` (${bankName})` : ''}`);
  return null;
}

/**
 * Validate BIC format
 * BIC format: 8 or 11 characters (AAAABBCCXXX)
 * - AAAA: Bank code (4 letters)
 * - BB: Country code (2 letters)
 * - CC: Location code (2 letters/digits)
 * - XXX: Branch code (3 letters/digits, optional)
 */
export function isValidBIC(bic: string): boolean {
  if (!bic) return false;
  const cleanBic = bic.replace(/\s/g, '').toUpperCase();
  // BIC is either 8 or 11 characters
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanBic);
}
