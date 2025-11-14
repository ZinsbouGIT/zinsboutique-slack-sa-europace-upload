import { SelbstauskunftData } from './pdfParser';
import { config } from '../utils/config';
import {
  mapFamilienstand,
  mapBeschaeftigungsart,
  mapWohnart,
  mapObjektart,
  mapNutzungsart,
  mapFinanzierungszweck,
  mapStaatsangehoerigkeit,
  parseTelefonnummer,
  normalizeDate,
  parseGermanNumber,
} from './enumMappers';
import { lookupBIC } from '../utils/bicLookup';

/**
 * Generate vorgang name based on applicant(s)
 * - 1 applicant: "Nachname"
 * - 2 applicants: "Nachname1 / Nachname2"
 */
function generateVorgangsname(extractedData: SelbstauskunftData): string {
  const nachname1 = extractedData.nachname;
  const nachname2 = extractedData.antragsteller2_nachname;

  if (nachname2) {
    return `${nachname1} / ${nachname2}`;
  }

  return nachname1 || 'Neuer Vorgang';
}

/**
 * Map telefonnummer to Europace format
 * Returns telefonnummer object with vorwahl and nummer
 */
function mapTelefonnummer(telefonnummer: string | undefined) {
  if (!telefonnummer) return undefined;

  const parsed = parseTelefonnummer(telefonnummer);

  // If we have both vorwahl and nummer from parser
  if (parsed && parsed.vorwahl && parsed.nummer) {
    return {
      vorwahl: parsed.vorwahl,
      nummer: parsed.nummer,
    };
  }

  return undefined;
}

/**
 * Map titel to Europace format (prof/dr booleans)
 */
function mapTitel(titel: string | undefined) {
  if (!titel) return undefined;

  const titelLower = titel.toLowerCase();
  return {
    prof: titelLower.includes('prof'),
    dr: titelLower.includes('dr'),
  };
}

/**
 * Comprehensive mapper that converts extracted PDF data to Europace API structure
 * Following EXACT structure from field-mapping documentation (Blocks 1-11)
 *
 * STRUCTURE RULES (from field-mapping docs):
 * 1. haushalte[].kunden[] (NOT personen)
 * 2. personendaten.person.{anrede, vorname, nachname, titel}
 * 3. personendaten.geburtsdatum (NOT under person)
 * 4. wohnsituation at kunde level (NOT under personendaten)
 * 5. kontakt at kunde level (NOT under personendaten)
 * 6. finanzielles.beschaeftigung with @type discriminator
 * 7. kinderErfassung at haushalt level (NOT under kunde)
 * 8. finanzielleSituation at haushalt level
 */
export function mapToEuropacePayload(extractedData: SelbstauskunftData) {
  const timestamp = Date.now();
  const vorgangsname = generateVorgangsname(extractedData);

  console.log(`[DEBUG] Generated vorgangsname: "${vorgangsname}" from nachname: "${extractedData.nachname}"`);
  console.log(`[DEBUG] Using externeVorgangsId: "${vorgangsname}"`);

  // Build kunde object (Antragsteller 1)
  const kunde1: any = {
    referenzId: 'antragsteller1',
    externeKundenId: `KUNDE-${timestamp}`,

    // Personal data structure (EXACT from field-mapping)
    personendaten: {
      person: {
        anrede: extractedData.anrede || 'HERR',
        vorname: extractedData.vorname,
        nachname: extractedData.nachname,
        ...(mapTitel(extractedData.titel) && { titel: mapTitel(extractedData.titel) }),
      },
      // IMPORTANT: geburtsdatum is DIRECTLY under personendaten, NOT under person
      geburtsdatum: normalizeDate(extractedData.geburtsdatum),
      ...(extractedData.geburtsort && { geburtsort: extractedData.geburtsort }),
      // IMPORTANT: staatsangehoerigkeit is DIRECTLY under personendaten
      staatsangehoerigkeit: mapStaatsangehoerigkeit(extractedData.staatsangehoerigkeit) || 'DE',
      // BLOCK-001: geburtsland (if staatsangehoerigkeit exists, use same country)
      ...(extractedData.staatsangehoerigkeit && {
        geburtsland: {
          isoCountryCode: mapStaatsangehoerigkeit(extractedData.staatsangehoerigkeit) || 'DE',
        },
      }),
      // IMPORTANT: familienstand has @type discriminator
      ...(extractedData.familienstand && {
        familienstand: (() => {
          const extracted = extractedData.familienstand;
          const mapped = mapFamilienstand(extracted);
          console.log(`[DEBUG FAMILIENSTAND] Extracted: "${extracted}" → Mapped: "${mapped}"`);
          return {
            '@type': mapped || 'LEDIG',
            // Add guetertrennungVereinbart only for VERHEIRATET or EINGETRAGENE_LEBENSPARTNERSCHAFT
            ...(mapped === 'VERHEIRATET' && {
              guetertrennungVereinbart: false,
            }),
          };
        })(),
      }),
    },

    // IMPORTANT: wohnsituation is at kunde level, NOT under personendaten
    wohnsituation: {
      wohnhaftSeit: normalizeDate(extractedData.wohnhaftSeit) || new Date().toISOString().split('T')[0],
      anschrift: {
        strasse: extractedData.strasse,
        hausnummer: extractedData.hausnummer,
        plz: extractedData.plz,
        ort: extractedData.ort,
      },
      // Previous address (voranschrift)
      ...(extractedData.vorherigePlz && {
        voranschrift: {
          ...(extractedData.vorherigeStrasse && { strasse: extractedData.vorherigeStrasse }),
          plz: extractedData.vorherigePlz,
          ort: extractedData.vorherigeStadt,
        },
      }),
    },

    // IMPORTANT: kontakt is at kunde level, NOT under personendaten
    kontakt: {
      email: extractedData.email,
      ...(mapTelefonnummer(extractedData.telefonnummer) && {
        telefonnummer: mapTelefonnummer(extractedData.telefonnummer),
      }),
    },

    // IMPORTANT: finanzielles with beschaeftigung and einkommenNetto
    finanzielles: {
      // Tax ID
      ...(extractedData.steuerId && { steuerId: extractedData.steuerId }),

      // Employment with @type discriminator
      ...(extractedData.arbeitgeber && {
        beschaeftigung: {
          '@type': mapBeschaeftigungsart(extractedData.beschaeftigungsart) || 'ANGESTELLTER',
          ...(extractedData.beruf && { beruf: extractedData.beruf }),

          // For ANGESTELLTER, ARBEITER, BEAMTER
          ...(['ANGESTELLTER', 'ARBEITER', 'BEAMTER'].includes(mapBeschaeftigungsart(extractedData.beschaeftigungsart) || '') && {
            // beschaeftigungsstatus only for ANGESTELLTER and ARBEITER (NOT BEAMTER)
            ...(['ANGESTELLTER', 'ARBEITER'].includes(mapBeschaeftigungsart(extractedData.beschaeftigungsart) || '') && {
              beschaeftigungsstatus: 'UNBEFRISTET',
            }),
            beschaeftigungsverhaeltnis: {
              arbeitgeber: {
                name: extractedData.arbeitgeber,
                inDeutschland: true,
              },
              beschaeftigtSeit: normalizeDate(extractedData.beschaeftigtSeit),
              probezeit: false,
              anzahlGehaelterProJahr: 'ZWOELF',
            },
          }),

          // For SELBSTSTAENDIGER, FREIBERUFLER
          ...(['SELBSTSTAENDIGER', 'FREIBERUFLER'].includes(mapBeschaeftigungsart(extractedData.beschaeftigungsart) || '') && {
            taetigkeit: {
              ...(extractedData.beruf && { berufsbezeichnung: extractedData.beruf }),
              ...(extractedData.arbeitgeber && { firma: extractedData.arbeitgeber }),
              taetigSeit: normalizeDate(extractedData.beschaeftigtSeit),
            },
          }),
        },
      }),

      // Net income (monthly for employees, yearly for self-employed)
      ...(extractedData.nettoeinkommenMonatlich && {
        einkommenNetto: parseGermanNumber(extractedData.nettoeinkommenMonatlich),
      }),

      // BLOCK-005: Retirement situation (situationNachRenteneintritt)
      ...((extractedData.rentenbeginn || extractedData.gesetzlicheRenteMonatlich || extractedData.privateRenteMonatlich) && {
        situationNachRenteneintritt: {
          rentenversicherung: {
            '@type': 'GESETZLICHE_RENTENVERSICHERUNG',
            ...(extractedData.gesetzlicheRenteMonatlich && {
              monatlicheRente: parseGermanNumber(extractedData.gesetzlicheRenteMonatlich),
            }),
            ...(extractedData.rentenbeginn && {
              renteneintritt: normalizeDate(extractedData.rentenbeginn),
            }),
          },
        },
      }),

      // BLOCK-006: Number of children at kunde level
      ...(extractedData.anzahlKinder && {
        anzahlKinder: extractedData.anzahlKinder,
      }),
      ...(typeof extractedData.kindergeldFuerKinderUnter18 === 'boolean' && {
        kindergeldFuerKinderUnter18: extractedData.kindergeldFuerKinderUnter18,
      }),

      // BLOCK-008: Bank account details
      ...((extractedData.iban || extractedData.bankname || extractedData.kontoinhaber) && {
        bankverbindung: {
          ...(extractedData.bankname && { kreditinstitut: extractedData.bankname }),
          ...(extractedData.iban && { iban: extractedData.iban }),
          ...(extractedData.bic && { bic: extractedData.bic }),
          ...(extractedData.kontoinhaber && { kontoinhaber: extractedData.kontoinhaber }),
        },
      }),
    },

    // BLOCK-001: Aufenthaltsstatus (residence status)
    ...(extractedData.staatsangehoerigkeit && {
      aufenthaltsstatus: {
        '@type': 'EU_BUERGER',
      },
    }),
  };

  // Build kunde2 if exists (Antragsteller 2)
  const kunden: any[] = [kunde1];

  if (extractedData.antragsteller2_nachname) {
    const kunde2: any = {
      referenzId: 'antragsteller2',
      externeKundenId: `KUNDE2-${timestamp}`,
      personendaten: {
        person: {
          anrede: extractedData.antragsteller2_anrede || 'FRAU',
          vorname: extractedData.antragsteller2_vorname,
          nachname: extractedData.antragsteller2_nachname,
          ...(mapTitel(extractedData.antragsteller2_titel) && { titel: mapTitel(extractedData.antragsteller2_titel) }),
        },
        ...(extractedData.antragsteller2_geburtsdatum && {
          geburtsdatum: normalizeDate(extractedData.antragsteller2_geburtsdatum),
        }),
        ...(extractedData.antragsteller2_geburtsort && { geburtsort: extractedData.antragsteller2_geburtsort }),
        staatsangehoerigkeit: mapStaatsangehoerigkeit(extractedData.antragsteller2_staatsangehoerigkeit) || 'DE',
        ...(extractedData.antragsteller2_staatsangehoerigkeit && {
          geburtsland: {
            isoCountryCode: mapStaatsangehoerigkeit(extractedData.antragsteller2_staatsangehoerigkeit) || 'DE',
          },
        }),
        ...(extractedData.antragsteller2_familienstand && {
          familienstand: {
            '@type': mapFamilienstand(extractedData.antragsteller2_familienstand) || 'LEDIG',
            ...(mapFamilienstand(extractedData.antragsteller2_familienstand) === 'VERHEIRATET' && {
              guetertrennungVereinbart: false,
            }),
          },
        }),
      },
      // BLOCK-002: Wohnsituation for antragsteller2
      ...(extractedData.antragsteller2_strasse && {
        wohnsituation: {
          wohnhaftSeit: normalizeDate(extractedData.antragsteller2_wohnhaftSeit) || new Date().toISOString().split('T')[0],
          anschrift: {
            strasse: extractedData.antragsteller2_strasse,
            hausnummer: extractedData.antragsteller2_hausnummer,
            plz: extractedData.antragsteller2_plz,
            ort: extractedData.antragsteller2_ort,
          },
        },
      }),
      // BLOCK-004: Kontakt for antragsteller2
      kontakt: {
        ...(extractedData.antragsteller2_email && { email: extractedData.antragsteller2_email }),
        ...(mapTelefonnummer(extractedData.antragsteller2_telefonnummer) && {
          telefonnummer: mapTelefonnummer(extractedData.antragsteller2_telefonnummer),
        }),
      },
      // BLOCK-003 & BLOCK-005: Employment and financial details for antragsteller2
      ...(extractedData.antragsteller2_arbeitgeber && {
        finanzielles: {
          ...(extractedData.antragsteller2_steuerId && { steuerId: extractedData.antragsteller2_steuerId }),
          beschaeftigung: {
            '@type': mapBeschaeftigungsart(extractedData.antragsteller2_beschaeftigungsart) || 'ANGESTELLTER',
            ...(extractedData.antragsteller2_beruf && { beruf: extractedData.antragsteller2_beruf }),
            ...(['ANGESTELLTER', 'ARBEITER', 'BEAMTER'].includes(mapBeschaeftigungsart(extractedData.antragsteller2_beschaeftigungsart) || '') && {
              ...(['ANGESTELLTER', 'ARBEITER'].includes(mapBeschaeftigungsart(extractedData.antragsteller2_beschaeftigungsart) || '') && {
                beschaeftigungsstatus: extractedData.antragsteller2_beschaeftigungsstatus || 'UNBEFRISTET',
              }),
              beschaeftigungsverhaeltnis: {
                arbeitgeber: {
                  name: extractedData.antragsteller2_arbeitgeber,
                  inDeutschland: true,
                },
                beschaeftigtSeit: normalizeDate(extractedData.antragsteller2_beschaeftigtSeit),
                probezeit: false,
                anzahlGehaelterProJahr: extractedData.antragsteller2_anzahlGehaelterProJahr || 'ZWOELF',
              },
            }),
          },
          ...(extractedData.antragsteller2_nettoeinkommenMonatlich && {
            einkommenNetto: parseGermanNumber(extractedData.antragsteller2_nettoeinkommenMonatlich),
          }),
          // BLOCK-005: Retirement for antragsteller2
          ...((extractedData.antragsteller2_rentenbeginn || extractedData.antragsteller2_gesetzlicheRenteMonatlich || extractedData.antragsteller2_privateRenteMonatlich) && {
            situationNachRenteneintritt: {
              rentenversicherung: {
                '@type': 'GESETZLICHE_RENTENVERSICHERUNG',
                ...(extractedData.antragsteller2_gesetzlicheRenteMonatlich && {
                  monatlicheRente: parseGermanNumber(extractedData.antragsteller2_gesetzlicheRenteMonatlich),
                }),
                ...(extractedData.antragsteller2_rentenbeginn && {
                  renteneintritt: normalizeDate(extractedData.antragsteller2_rentenbeginn),
                }),
              },
            },
          }),
          // BLOCK-006: Children count at kunde level for antragsteller2
          ...(extractedData.antragsteller2_anzahlKinder && {
            anzahlKinder: extractedData.antragsteller2_anzahlKinder,
          }),
          ...(typeof extractedData.antragsteller2_kindergeldFuerKinderUnter18 === 'boolean' && {
            kindergeldFuerKinderUnter18: extractedData.antragsteller2_kindergeldFuerKinderUnter18,
          }),
          // BLOCK-008: Bank account for antragsteller2
          ...((extractedData.antragsteller2_iban || extractedData.antragsteller2_bankname || extractedData.antragsteller2_kontoinhaber) && {
            bankverbindung: {
              ...(extractedData.antragsteller2_bankname && { kreditinstitut: extractedData.antragsteller2_bankname }),
              ...(extractedData.antragsteller2_iban && { iban: extractedData.antragsteller2_iban }),
              ...(extractedData.antragsteller2_bic && { bic: extractedData.antragsteller2_bic }),
              ...(extractedData.antragsteller2_kontoinhaber && { kontoinhaber: extractedData.antragsteller2_kontoinhaber }),
            },
          }),
        },
      }),
      // BLOCK-001: Aufenthaltsstatus for antragsteller2
      ...(extractedData.antragsteller2_staatsangehoerigkeit && {
        aufenthaltsstatus: {
          '@type': 'EU_BUERGER',
        },
      }),
    };
    kunden.push(kunde2);
  }

  // Build haushalt object
  const haushalt: any = {
    kunden,

    // BLOCK-006: kinder is at haushalt level (direct array as per JL8Y5D payload)
    ...((extractedData.kinder && extractedData.kinder.length > 0) && {
      kinder: extractedData.kinder.map((kind: any) => ({
        ...(kind.name && { name: kind.name }),
        ...(kind.geburtsdatum && { geburtsdatum: normalizeDate(kind.geburtsdatum) }),
        ...(typeof kind.kindergeldWirdBezogen === 'boolean' && { kindergeldWirdBezogen: kind.kindergeldWirdBezogen }),
      })),
    }),

    // BLOCK-011: bestehendeImmobilien (Existing Properties) - Direct array at haushalt level
    ...((extractedData.bestehendeImmobilien && extractedData.bestehendeImmobilien.length > 0) && {
      bestehendeImmobilien: extractedData.bestehendeImmobilien.map((immobilie: any) => ({
        ...(immobilie.bezeichnung && { bezeichnung: immobilie.bezeichnung }),
        ...(immobilie.adresse && {
          adresse: {
            ...(immobilie.adresse.strasse && { strasse: immobilie.adresse.strasse }),
            ...(immobilie.adresse.hausnummer && { hausnummer: immobilie.adresse.hausnummer }),
            ...(immobilie.adresse.postleitzahl && { postleitzahl: immobilie.adresse.postleitzahl }),
            ...(immobilie.adresse.ort && { ort: immobilie.adresse.ort }),
          },
        }),
        ...(immobilie.objektArt && { objektArt: immobilie.objektArt }),
        ...(immobilie.baujahr && { baujahr: immobilie.baujahr }),
        ...(immobilie.wohnflaeche && {
          gebaeude: {
            wohnflaeche: {
              gesamtGroesse: parseGermanNumber(immobilie.wohnflaeche),
              ...(immobilie.nutzungsArt && {
                vermietungsInformationen: {
                  nutzungsArt: immobilie.nutzungsArt,
                  ...(immobilie.mieteinnahmenNettoKaltMonatlich && {
                    mieteinnahmenNettoKaltMonatlich: parseGermanNumber(immobilie.mieteinnahmenNettoKaltMonatlich),
                  }),
                  ...(immobilie.vermieteteFlaeche && {
                    vermieteteFlaeche: parseGermanNumber(immobilie.vermieteteFlaeche),
                  }),
                },
              }),
            },
          },
        }),
        ...(immobilie.grundstuecksgroesse !== undefined && {
          grundstueck: {
            groesse: parseGermanNumber(immobilie.grundstuecksgroesse) || 0,
          },
        }),
        ...(immobilie.verkehrswert && { verkehrswert: parseGermanNumber(immobilie.verkehrswert) }),
        ...(immobilie.marktwert && { marktwert: parseGermanNumber(immobilie.marktwert) }),
        ...(immobilie.bestehendeDarlehen && immobilie.bestehendeDarlehen.length > 0 && {
          bestehendeDarlehen: immobilie.bestehendeDarlehen.map((darlehen: any) => ({
            ...(darlehen.darlehensArt && { darlehensArt: darlehen.darlehensArt }),
            ...(darlehen.restschuld && { aktuelleRestschuldWennNichtAbzuloesen: parseGermanNumber(darlehen.restschuld) }),
            ...(darlehen.rateMonatlich && { rateMonatlich: parseGermanNumber(darlehen.rateMonatlich) }),
            ...(darlehen.zinsBindungEndetAm && { zinsBindungEndetAm: normalizeDate(darlehen.zinsBindungEndetAm) }),
            ...(darlehen.eingetrageneGrundschuld && { eingetrageneGrundschuld: parseGermanNumber(darlehen.eingetrageneGrundschuld) }),
          })),
        }),
      })),
    }),

    // BLOCK-012: positionen structure (all financial arrays matching JL8Y5D)
    // This contains all Vermögen, Einnahmen, Ausgaben, Verbindlichkeiten as arrays
    positionen: {
      // VERMÖGEN (Assets) - Arrays
      // Bank and savings accounts
      ...((extractedData.bankUndSparguthaben && extractedData.bankUndSparguthaben.length > 0) && {
        bankUndSparguthaben: extractedData.bankUndSparguthaben.map((bank: any) => ({
          ...(bank.aktuellerWert && { aktuellerWert: parseGermanNumber(bank.aktuellerWert) }),
          ...(bank.zinsertragJaehrlich && { zinsertragJaehrlich: parseGermanNumber(bank.zinsertragJaehrlich) }),
          vermoegensTyp: 'VERMOEGEN',
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Building savings contracts (already exists, keep same structure)
      ...((extractedData.bausparvertraege && extractedData.bausparvertraege.length > 0) && {
        bausparvertraege: extractedData.bausparvertraege.map((bsv: any) => ({
          ...(bsv.tarif && { tarif: bsv.tarif }),
          ...(bsv.vertragsNummer && { vertragsNummer: bsv.vertragsNummer }),
          ...(bsv.bausparSumme && { bausparSumme: parseGermanNumber(bsv.bausparSumme) }),
          ...(bsv.zuteilungsDatum && { zuteilungsDatum: normalizeDate(bsv.zuteilungsDatum) }),
          ...(bsv.vermoegensEinsatz && { vermoegensEinsatz: bsv.vermoegensEinsatz }),
          ...(bsv.aktuellerWert && { aktuellerWert: parseGermanNumber(bsv.aktuellerWert) }),
          vermoegensTyp: 'VERMOEGEN',
          zahlungsTyp: 'AUSGABE',
          typ: 'BAUSPARVERTRAG',
        })),
      }),

      // Life and pension insurance
      ...((extractedData.lebensversicherungen && extractedData.lebensversicherungen.length > 0) && {
        lebensUndRentenVersicherungen: extractedData.lebensversicherungen.map((lv: any) => ({
          ...(lv.rueckkaufswert && { rueckkaufsWertAktuell: parseGermanNumber(lv.rueckkaufswert) }),
          ...(lv.praemieMonatlich && { praemieMonatlich: parseGermanNumber(lv.praemieMonatlich) }),
          ...(lv.vermoegensEinsatz && { vermoegensEinsatz: lv.vermoegensEinsatz }),
          vermoegensTyp: 'VERMOEGEN',
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Savings plans
      ...((extractedData.sparplaene && extractedData.sparplaene.length > 0) && {
        sparplaene: extractedData.sparplaene.map((sp: any) => ({
          ...(sp.aktuellerWert && { aktuellerWert: parseGermanNumber(sp.aktuellerWert) }),
          vermoegensTyp: 'VERMOEGEN',
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Securities/Stocks
      ...((extractedData.wertpapiere && extractedData.wertpapiere.length > 0) && {
        wertpapiere: extractedData.wertpapiere.map((wp: any) => ({
          ...(wp.aktuellerWert && { aktuellerWert: parseGermanNumber(wp.aktuellerWert) }),
          zahlungsTyp: 'EINNAHME',
          vermoegensTyp: 'VERMOEGEN',
        })),
      }),

      // Other assets
      ...((extractedData.sonstigeVermoegen && extractedData.sonstigeVermoegen.length > 0) && {
        sonstigeVermoegen: extractedData.sonstigeVermoegen.map((sv: any) => ({
          ...(sv.aktuellerWert && { aktuellerWert: parseGermanNumber(sv.aktuellerWert) }),
          vermoegensTyp: 'VERMOEGEN',
        })),
      }),

      // EINNAHMEN (Income) - Arrays
      // Child benefits
      ...((extractedData.kindergeld && extractedData.kindergeld.length > 0) && {
        kindergeld: extractedData.kindergeld.map((kg: any) => ({
          ...(kg.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(kg.einnahmenMonatlich) }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Side job income
      ...((extractedData.einkuenfteAusNebentaetigkeit && extractedData.einkuenfteAusNebentaetigkeit.length > 0) && {
        einkuenfteAusNebentaetigkeit: extractedData.einkuenfteAusNebentaetigkeit.map((nebentaetigkeit: any) => ({
          ...(nebentaetigkeit.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(nebentaetigkeit.einnahmenMonatlich) }),
          ...(nebentaetigkeit.beginnDerNebentaetigkeit && {
            beginnDerNebentaetigkeit: normalizeDate(nebentaetigkeit.beginnDerNebentaetigkeit),
          }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Other income
      ...((extractedData.sonstigeEinnahmen && extractedData.sonstigeEinnahmen.length > 0) && {
        sonstigeEinnahmen: extractedData.sonstigeEinnahmen.map((se: any) => ({
          ...(se.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(se.einnahmenMonatlich) }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Variable income
      ...((extractedData.variableEinkuenfte && extractedData.variableEinkuenfte.length > 0) && {
        variableEinkuenfte: extractedData.variableEinkuenfte.map((ve: any) => ({
          ...(ve.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(ve.einnahmenMonatlich) }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Spousal support
      ...((extractedData.ehegattenunterhalt && extractedData.ehegattenunterhalt.length > 0) && {
        ehegattenUnterhalt: extractedData.ehegattenunterhalt.map((eu: any) => ({
          ...(eu.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(eu.einnahmenMonatlich) }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // Unlimited additional pensions
      ...((extractedData.unbefristeteZusatzrenten && extractedData.unbefristeteZusatzrenten.length > 0) && {
        unbefristeteZusatzRenten: extractedData.unbefristeteZusatzrenten.map((uzr: any) => ({
          ...(uzr.einnahmenMonatlich && { einnahmenMonatlich: parseGermanNumber(uzr.einnahmenMonatlich) }),
          zahlungsTyp: 'EINNAHME',
        })),
      }),

      // AUSGABEN (Expenses) - Arrays
      // Rent expenses
      ...((extractedData.mietAusgaben && extractedData.mietAusgaben.length > 0) && {
        mietAusgaben: extractedData.mietAusgaben.map((ma: any) => ({
          ...(ma.ausgabenMonatlich && { ausgabenMonatlich: parseGermanNumber(ma.ausgabenMonatlich) }),
          ...(typeof ma.entfallenMitFinanzierung === 'boolean' && { entfallenMitFinanzierung: ma.entfallenMitFinanzierung }),
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Private health insurance
      ...((extractedData.privateKrankenversicherung && extractedData.privateKrankenversicherung.length > 0) && {
        privateKrankenversicherung: extractedData.privateKrankenversicherung.map((pkv: any) => ({
          ...(pkv.ausgabenMonatlich && { ausgabenMonatlich: parseGermanNumber(pkv.ausgabenMonatlich) }),
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Other expenses
      ...((extractedData.sonstigeAusgaben && extractedData.sonstigeAusgaben.length > 0) && {
        sonstigeAusgaben: extractedData.sonstigeAusgaben.map((sa: any) => ({
          ...(sa.ausgabenMonatlich && { ausgabenMonatlich: parseGermanNumber(sa.ausgabenMonatlich) }),
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // VERBINDLICHKEITEN (Liabilities) - Arrays
      // Installment loans (ratenkredite)
      ...((extractedData.ratenkredite && extractedData.ratenkredite.length > 0) && {
        ratenkredite: extractedData.ratenkredite.map((kredit: any) => ({
          ...(kredit.glaeubiger && { glaeubiger: kredit.glaeubiger }),
          ...(kredit.laufzeitEnde && { laufzeitEnde: normalizeDate(kredit.laufzeitEnde) }),
          ...(kredit.rateMonatlich && { rateMonatlich: parseGermanNumber(kredit.rateMonatlich) }),
          ...(kredit.restschuld && { restschuld: parseGermanNumber(kredit.restschuld) }),
          vermoegensTyp: 'VERBINDLICHKEIT',
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Private loans (privateDarlehen)
      ...((extractedData.privatdarlehen && extractedData.privatdarlehen.length > 0) && {
        privateDarlehen: extractedData.privatdarlehen.map((darlehen: any) => ({
          ...(darlehen.glaeubiger && { glaeubiger: darlehen.glaeubiger }),
          ...(darlehen.laufzeitEnde && { laufzeitEnde: normalizeDate(darlehen.laufzeitEnde) }),
          ...(darlehen.rateMonatlich && { rateMonatlich: parseGermanNumber(darlehen.rateMonatlich) }),
          ...(darlehen.restschuld && { restschuld: parseGermanNumber(darlehen.restschuld) }),
          vermoegensTyp: 'VERBINDLICHKEIT',
          zahlungsTyp: 'AUSGABE',
        })),
      }),

      // Other liabilities
      ...((extractedData.sonstigeVerbindlichkeiten && extractedData.sonstigeVerbindlichkeiten.length > 0) && {
        sonstigeVerbindlichkeiten: extractedData.sonstigeVerbindlichkeiten.map((sv: any) => ({
          ...(sv.rateMonatlich && { rateMonatlich: parseGermanNumber(sv.rateMonatlich) }),
          vermoegensTyp: 'VERBINDLICHKEIT',
          zahlungsTyp: 'AUSGABE',
        })),
      }),
    },

    // IMPORTANT: finanzielleSituation is at haushalt level
    finanzielleSituation: {
      // BLOCK-007: Shared household (if both applicants exist)
      ...((extractedData.nachname && extractedData.antragsteller2_nachname) && {
        gemeinsamerHaushalt: true,
      }),

      // BLOCK-007: Assets (Vermögen)
      ...(extractedData.eigenkapital || extractedData.sparguthaben || extractedData.summeBankUndSparguthaben || extractedData.depotwert || extractedData.bausparvertraege || extractedData.lebensversicherungen || extractedData.sparplaeneAktuellerWert || extractedData.sonstigesVermoegenWert ? {
        vermoegen: {
          // Building savings contracts (up to 3)
          ...(extractedData.bausparvertraege && extractedData.bausparvertraege.length > 0 && {
            bausparvertraege: extractedData.bausparvertraege.slice(0, 3).map((bsv: any) => ({
              ...(bsv.angesparterBetrag && { angesparterBetrag: parseGermanNumber(bsv.angesparterBetrag) }),
              ...(bsv.sparbeitrag && { sparbeitrag: parseGermanNumber(bsv.sparbeitrag) }),
              ...(bsv.bausparkasse && { bausparkasse: bsv.bausparkasse }),
              ...(bsv.bausparsumme && { bausparsumme: parseGermanNumber(bsv.bausparsumme) }),
            })),
          }),
          // Life/Pension insurance (up to 3)
          ...(extractedData.lebensversicherungen && extractedData.lebensversicherungen.length > 0 && {
            lebensOderRentenversicherungen: extractedData.lebensversicherungen.slice(0, 3).map((lv: any) => ({
              ...(lv.rueckkaufswert && { rueckkaufswert: parseGermanNumber(lv.rueckkaufswert) }),
              ...(lv.praemieMonatlich && { praemieMonatlich: parseGermanNumber(lv.praemieMonatlich) }),
            })),
          }),
          // Securities
          ...(extractedData.depotwert && {
            summeDepotvermoegen: {
              depotwert: parseGermanNumber(extractedData.depotwert),
              ...(extractedData.dividendenJaehrlich && {
                ertragJaehrlich: parseGermanNumber(extractedData.dividendenJaehrlich),
              }),
            },
          }),
          // Bank and savings
          ...((extractedData.sparguthaben || extractedData.summeBankUndSparguthaben || extractedData.zinsertragJaehrlich) && {
            summeBankUndSparguthaben: {
              ...(extractedData.summeBankUndSparguthaben && {
                guthaben: parseGermanNumber(extractedData.summeBankUndSparguthaben),
              }),
              ...(extractedData.sparguthaben && {
                guthaben: parseGermanNumber(extractedData.sparguthaben),
              }),
              ...(extractedData.zinsertragJaehrlich && {
                zinsertragJaehrlich: parseGermanNumber(extractedData.zinsertragJaehrlich),
              }),
            },
          }),
          // Savings plans
          ...((extractedData.sparplaeneAktuellerWert || extractedData.sparplaeneBeitragMonatlich) && {
            summeSparplaene: {
              ...(extractedData.sparplaeneAktuellerWert && {
                aktuellerWert: parseGermanNumber(extractedData.sparplaeneAktuellerWert),
              }),
              ...(extractedData.sparplaeneBeitragMonatlich && {
                beitragMonatlich: parseGermanNumber(extractedData.sparplaeneBeitragMonatlich),
              }),
            },
          }),
          // Other assets
          ...(extractedData.sonstigesVermoegenWert && {
            summeSonstigesVermoegen: {
              aktuellerWert: parseGermanNumber(extractedData.sonstigesVermoegenWert),
            },
          }),
        },
      } : {}),

      // BLOCK-007: Income (Einnahmen)
      ...(extractedData.sonstigeEinnahmenMonatlich || extractedData.variableEinkuenfteMonatlich || extractedData.ehegattenunterhaltMonatlich || extractedData.unbefristeteZusatzrentenMonatlich || (extractedData.einkuenfteAusNebentaetigkeit && extractedData.einkuenfteAusNebentaetigkeit.length > 0) ? {
        einnahmen: {
          // Other monthly income
          ...(extractedData.sonstigeEinnahmenMonatlich && {
            summeSonstigeEinnahmenMonatlich: {
              betrag: parseGermanNumber(extractedData.sonstigeEinnahmenMonatlich),
            },
          }),
          // Variable income
          ...(extractedData.variableEinkuenfteMonatlich && {
            summeVariablerEinkuenfteMonatlich: parseGermanNumber(extractedData.variableEinkuenfteMonatlich),
          }),
          // Spousal support
          ...(extractedData.ehegattenunterhaltMonatlich && {
            summeEhegattenunterhalt: parseGermanNumber(extractedData.ehegattenunterhaltMonatlich),
          }),
          // Unlimited additional pensions
          ...(extractedData.unbefristeteZusatzrentenMonatlich && {
            summeUnbefristeteZusatzrentenMonatlich: {
              betrag: parseGermanNumber(extractedData.unbefristeteZusatzrentenMonatlich),
            },
          }),
          // Side jobs income
          ...(extractedData.einkuenfteAusNebentaetigkeit && extractedData.einkuenfteAusNebentaetigkeit.length > 0 && {
            einkuenfteAusNebentaetigkeit: extractedData.einkuenfteAusNebentaetigkeit.map((nebentaetigkeit: any) => ({
              ...(nebentaetigkeit.betragMonatlich && {
                betragMonatlich: parseGermanNumber(nebentaetigkeit.betragMonatlich),
              }),
              ...(nebentaetigkeit.beschreibung && { beschreibung: nebentaetigkeit.beschreibung }),
              ...(nebentaetigkeit.beginnDerNebentaetigkeit && {
                beginnDerTaetigkeit: normalizeDate(nebentaetigkeit.beginnDerNebentaetigkeit),
              }),
            })),
          }),
        },
      } : {}),

      // BLOCK-007: Expenses (Ausgaben)
      ...(extractedData.monatlicheKaltmiete || extractedData.mietausgabenMonatlich || extractedData.unterhaltszahlungen || extractedData.unterhaltsverpflichtungenMonatlich || extractedData.lebenshaltungskostenMonatlich ? {
        ausgaben: {
          // Rent expenses
          ...((extractedData.monatlicheKaltmiete || extractedData.mietausgabenMonatlich) && {
            summeMietausgaben: {
              betragMonatlich: parseGermanNumber(extractedData.mietausgabenMonatlich || extractedData.monatlicheKaltmiete),
              entfaelltMitFinanzierung: false,
            },
          }),
          // Living costs
          ...(extractedData.lebenshaltungskostenMonatlich && {
            lebenshaltungskostenMonatlich: parseGermanNumber(extractedData.lebenshaltungskostenMonatlich),
          }),
          // Alimony
          ...((extractedData.unterhaltszahlungen || extractedData.unterhaltsverpflichtungenMonatlich) && {
            unterhaltsverpflichtungenMonatlich: [parseGermanNumber(extractedData.unterhaltsverpflichtungenMonatlich || extractedData.unterhaltszahlungen)],
          }),
          // Health insurance
          ...((extractedData.krankenversicherung || extractedData.privateKrankenversicherungMonatlich) && {
            summePrivaterKrankenversicherungenMonatlich: parseGermanNumber(extractedData.privateKrankenversicherungMonatlich || extractedData.krankenversicherung),
          }),
          // Other expenses
          ...(extractedData.sonstigeAusgabenMonatlich && {
            summeSonstigerAusgabenMonatlich: {
              betrag: parseGermanNumber(extractedData.sonstigeAusgabenMonatlich),
            },
          }),
        },
      } : {}),

      // BLOCK-007: Liabilities (Verbindlichkeiten)
      ...((extractedData.bestehendeKredite && extractedData.bestehendeKredite.length > 0) || extractedData.ratenkredite || extractedData.privatdarlehen || extractedData.sonstigeVerbindlichkeitRateMonatlich ? {
        verbindlichkeiten: {
          // Installment loans
          ...((extractedData.bestehendeKredite && extractedData.bestehendeKredite.length > 0) && {
            ratenkredite: extractedData.bestehendeKredite.slice(0, 3).map((kredit: any) => ({
              glaeubiger: kredit.kreditgeber || kredit.glaeubiger,
              restschuld: kredit.restschuld,
              rateMonatlich: kredit.monatlicheRate || kredit.rateMonatlich,
              ...(kredit.laufzeitEnde && { laufzeitende: normalizeDate(kredit.laufzeitEnde) }),
            })),
          }),
          // Ratenkredite from PDF parser
          ...(extractedData.ratenkredite && extractedData.ratenkredite.length > 0 && {
            ratenkredite: extractedData.ratenkredite.slice(0, 3).map((kredit: any) => ({
              ...(kredit.glaeubiger && { glaeubiger: kredit.glaeubiger }),
              ...(kredit.restschuld && { restschuld: parseGermanNumber(kredit.restschuld) }),
              ...(kredit.rateMonatlich && { rateMonatlich: parseGermanNumber(kredit.rateMonatlich) }),
              ...(kredit.laufzeitende && { laufzeitende: normalizeDate(kredit.laufzeitende) }),
            })),
          }),
          // Private loans
          ...(extractedData.privatdarlehen && extractedData.privatdarlehen.length > 0 && {
            privatdarlehen: extractedData.privatdarlehen.slice(0, 3).map((darlehen: any) => ({
              ...(darlehen.glaeubiger && { glaeubiger: darlehen.glaeubiger }),
              ...(darlehen.restschuld && { restschuld: parseGermanNumber(darlehen.restschuld) }),
              ...(darlehen.rateMonatlich && { rateMonatlich: parseGermanNumber(darlehen.rateMonatlich) }),
              ...(darlehen.laufzeitende && { laufzeitende: normalizeDate(darlehen.laufzeitende) }),
            })),
          }),
          // Sonstige Verbindlichkeiten (Other liabilities)
          ...(extractedData.sonstigeVerbindlichkeitRateMonatlich && {
            sonstigeVerbindlichkeit: {
              rateMonatlich: parseGermanNumber(extractedData.sonstigeVerbindlichkeitRateMonatlich),
            },
          }),
          // Credit cards
          kreditkarten: {
            dispositionskredite: 0,
            kreditkarten: 0,
            geduldeteUeberziehungen: 0,
          },
        },
      } : {}),
    },
  };

  return {
    // Import metadata
    importMetadaten: {
      datenkontext: config.europace.testMode ? 'TEST_MODUS' : 'ECHT_GESCHAEFT',
      externeVorgangsId: `${vorgangsname}-${timestamp}`,
      importquelle: 'Slack Bot Upload - AI Extracted',
      prioritaet: 'MITTEL',
    },

    // Customer data following EXACT structure from field-mapping
    kundenangaben: {
      haushalte: [haushalt],
    },
  };
}

/**
 * Helper function to remove undefined/null values from the payload
 * Europace API prefers missing fields over null values
 */
export function cleanPayload(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload).filter(item => {
      if (item === null || item === undefined) return false;
      // Filter out empty objects from arrays
      if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) return false;
      return true;
    });
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const cleanedValue = cleanPayload(value);

      // Only include if value is not null/undefined and not an empty array/object
      if (cleanedValue !== null && cleanedValue !== undefined) {
        if (Array.isArray(cleanedValue) && cleanedValue.length === 0) {
          return acc;
        }
        if (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) {
          return acc;
        }
        acc[key] = cleanedValue;
      }

      return acc;
    }, {} as any);
  }

  return obj;
}

/**
 * Main export: Create clean Europace payload from extracted data
 * Now async to support BIC lookup when missing
 */
export async function createEuropacePayload(extractedData: SelbstauskunftData) {
  // Lookup missing BICs before mapping
  const enrichedData = await enrichWithBIC(extractedData);

  const payload = mapToEuropacePayload(enrichedData);
  const cleaned = cleanPayload(payload);

  console.log(`[DEBUG] Final payload structure check:`);
  console.log(`[DEBUG] - Has importMetadaten: ${!!cleaned.importMetadaten}`);
  console.log(`[DEBUG] - Has kundenangaben: ${!!cleaned.kundenangaben}`);
  console.log(`[DEBUG] - Has haushalte: ${!!cleaned.kundenangaben?.haushalte}`);
  console.log(`[DEBUG] - Has kunden: ${!!cleaned.kundenangaben?.haushalte?.[0]?.kunden}`);
  console.log(`[DEBUG] - Kunde count: ${cleaned.kundenangaben?.haushalte?.[0]?.kunden?.length}`);
  console.log(`[DEBUG] - externeVorgangsId: "${cleaned.importMetadaten?.externeVorgangsId}"`);

  return cleaned;
}

/**
 * Enrich extracted data with BIC lookup for missing BIC codes
 */
async function enrichWithBIC(extractedData: SelbstauskunftData): Promise<SelbstauskunftData> {
  const enriched = { ...extractedData };

  // Lookup BIC for Antragsteller 1 if IBAN exists but BIC doesn't
  if (enriched.iban && !enriched.bic) {
    console.log(`[BIC] Antragsteller 1: IBAN found but BIC missing, attempting lookup...`);
    const bic = await lookupBIC(enriched.iban, enriched.bankname);
    if (bic) {
      enriched.bic = bic;
      console.log(`[BIC] ✓ Antragsteller 1: BIC found and added: ${bic}`);
    } else {
      console.log(`[BIC] ⚠ Antragsteller 1: Could not lookup BIC for IBAN ${enriched.iban}`);
    }
  }

  // Lookup BIC for Antragsteller 2 if IBAN exists but BIC doesn't
  if (enriched.antragsteller2_iban && !enriched.antragsteller2_bic) {
    console.log(`[BIC] Antragsteller 2: IBAN found but BIC missing, attempting lookup...`);
    const bic = await lookupBIC(enriched.antragsteller2_iban, enriched.antragsteller2_bankname);
    if (bic) {
      enriched.antragsteller2_bic = bic;
      console.log(`[BIC] ✓ Antragsteller 2: BIC found and added: ${bic}`);
    } else {
      console.log(`[BIC] ⚠ Antragsteller 2: Could not lookup BIC for IBAN ${enriched.antragsteller2_iban}`);
    }
  }

  return enriched;
}
