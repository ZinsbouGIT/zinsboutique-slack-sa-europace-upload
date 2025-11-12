import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { SelbstauskunftData } from './pdfParser';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Use AI with temperature 0 to map extracted data to EXACT Europace field-mapping structure
 * Reference: europace-field-mapping-master as single source of truth
 */
export async function mapToEuropaceStructure(extractedData: SelbstauskunftData): Promise<any> {
  try {
    logger.info('Using AI to map extracted data to Europace structure with temperature 0');

    // Read the field-mapping example structure
    const fieldMappingPath = path.join(
      __dirname,
      '../../europace-field-mapping-master/blocks/BLOCK-011-VOLLSTAENDIGE-JSON-STRUKTUR.md'
    );

    let fieldMappingGuide = '';
    try {
      fieldMappingGuide = fs.readFileSync(fieldMappingPath, 'utf-8');
    } catch (error) {
      logger.warn('Could not read field-mapping guide, using embedded structure');
    }

    const prompt = `You are a field mapper for the Europace API. Your job is to take extracted data and format it to match the EXACT structure from the europace-field-mapping documentation for ALL blocks.

CRITICAL STRUCTURE RULES (from europace-field-mapping-master):
1. Structure: kundenangaben.haushalte[].kunden[] (NOT personen!)
2. Each kunde MUST have: referenzId, externeKundenId
3. IMPORTANT: If there are TWO applicants (Antragsteller + Mitantragsteller), BOTH must be in kunden[] array
4. personendaten.person = {anrede, vorname, nachname, titel}
5. geburtsdatum is DIRECTLY under personendaten (NOT under person)
6. staatsangehoerigkeit is DIRECTLY under personendaten
7. familienstand MUST have @type discriminator
8. wohnsituation is at kunde level
9. kontakt is at kunde level
10. finanzielles is at kunde level with beschaeftigung, einkommenNetto, and situationNachRenteneintritt
11. kinderErfassung is at haushalt level with @type
12. finanzielleSituation is at haushalt level (vermoegen, einnahmen, ausgaben, verbindlichkeiten, bestehendeImmobilien)
13. bankverbindung is at kundenangaben level (NOT in haushalt!)
14. finanzierungsobjekt is at TOP LEVEL (same level as kundenangaben)
15. finanzierungsbedarf is at TOP LEVEL (same level as kundenangaben)
16. vorgangsname MUST be "Lastname1 / Lastname2" if 2 applicants, or just "Lastname1" if 1 applicant

VALID ENUM VALUES (ONLY use these exact values):
- @type for beschaeftigung: ANGESTELLTER, ARBEITER, BEAMTER, SELBSTSTAENDIGER, FREIBERUFLER, RENTNER, ARBEITSLOSER, HAUSHALTENDE_PERSON
- @type for familienstand: LEDIG, VERHEIRATET, GESCHIEDEN, VERWITWET, EINGETRAGENE_LEBENSPARTNERSCHAFT
- @type for kinderErfassung: KEINE_KINDER, VORHANDENE_KINDER
- @type for finanzierungszweck: KAUF, NEUBAU, KAUF_NEUBAU_VOM_BAUTRAEGER, MODERNISIERUNG_UMBAU_ANBAU, ANSCHLUSSFINANZIERUNG, KAPITALBESCHAFFUNG
- @type for immobilientyp: EINFAMILIENHAUS, ZWEIFAMILIENHAUS, MEHRFAMILIENHAUS, EIGENTUMSWOHNUNG, DOPPELHAUSHAELFTE, REIHENHAUS, GRUNDSTUECK
- @type for nutzungsart: EIGENGENUTZT, VERMIETET, TEILVERMIETET
- beschaeftigungsstatus (only for ANGESTELLTER/ARBEITER): UNBEFRISTET, BEFRISTET
- anzahlGehaelterProJahr: ZWOELF, DREIZEHN, VIERZEHN, ZWOELF_KOMMA_FUENF
- bauweise: MASSIV, HOLZ, FACHWERK_MIT_ZIEGELN
- grundschuldart: BUCH_GRUNDSCHULD, BRIEF_GRUNDSCHULD
- staatsangehoerigkeit MUST be valid ISO 3166-1 alpha-2 code (2 letters uppercase): DE, AT, CH, IN, US, GB, FR, IT, ES, PL, TR
  * If unknown or missing: omit the field entirely

CRITICAL DATA INTEGRITY RULES:
- NEVER make up or guess data
- ONLY use data from the extracted fields below
- If a field is null or missing in extracted data, OMIT it from the output
- Do NOT provide default values for missing data (except required fields)
- For staatsangehoerigkeit: only include if nationality is clearly stated, otherwise omit

EXTRACTED DATA TO MAP:
${JSON.stringify(extractedData, null, 2)}

Return ONLY valid JSON matching this COMPLETE structure (no markdown, no explanation):
{
  "vorgangsname": "LastName1 / LastName2" (if 2 applicants) or "LastName1" (if 1 applicant),
  "importMetadaten": {
    "datenkontext": "TEST_MODUS" or "ECHT_GESCHAEFT",
    "externeVorgangsId": "unique-id-timestamp",
    "importquelle": "Slack Bot Upload - AI Extracted",
    "prioritaet": "MITTEL"
  },

  // ==========================================
  // FINANZIERUNGSZWECK & FINANZIERUNGSOBJEKT (BLOCK-F01, F02, F03)
  // ==========================================
  "finanzierungsbedarf": {
    "finanzierungszweck": {
      "@type": "KAUF" (from extracted finanzierungszweck),
      "marktwertFinanzierungsobjekt": number (from marktwert if available)
    }
  },

  "finanzierungsobjekt": {
    "immobilie": {
      "adresse": {
        "strasse": "..." (from objektStrasse),
        "hausnummer": "..." (from objektHausnummer),
        "plz": "..." (from objektPlz),
        "ort": "..." (from objektOrt)
      },
      "typ": {
        "@type": "EINFAMILIENHAUS" (from objektart),
        "grundstuecksgroesse": number (from grundstuecksgroesse),
        "gebaeude": {
          "baujahr": number (from baujahr),
          "anzahlGeschosse": number (from anzahlGeschosse),
          "bauweise": "MASSIV" (from bauweise),
          "anzahlGaragen": number,
          "anzahlStellplaetze": number,
          "nutzung": {
            "wohnen": {
              "gesamtflaeche": number (from wohnflaeche),
              "nutzungsart": {
                "@type": "EIGENGENUTZT/VERMIETET/TEILVERMIETET" (from nutzungsart),
                "mieteinnahmenNettoKaltMonatlich": number (if vermietet),
                "vermieteteFlaeche": number (if teilvermietet/vermietet)
              }
            },
            "gewerbe": {
              "gesamtflaeche": number (from gewerbeflaeche, only if exists),
              "nutzungsart": {
                "@type": "..." (from gewerbeNutzungsart),
                "mieteinnahmenNettoKaltMonatlich": number,
                "vermieteteFlaeche": number
              }
            }
          }
        }
      }
    }
  },

  // ==========================================
  // KUNDENANGABEN
  // ==========================================
  "kundenangaben": {
    // BLOCK-008: Bankverbindung (at kundenangaben level!)
    "bankverbindung": {
      "iban": "..." (from iban),
      "bic": "..." (from bic),
      // If kontoinhaber matches applicant names, use kundenreferenzIdsDerKontoinhaber
      "kundenreferenzIdsDerKontoinhaber": ["antragsteller1", "antragsteller2"],
      // OR if kontoinhaber is different, use nameKontoinhaberKeinKunde
      "nameKontoinhaberKeinKunde": "..." (only if kontoinhaber is NOT the applicants)
    },

    "haushalte": [
      {
        "kunden": [
          {
            "referenzId": "antragsteller1",
            "externeKundenId": "KUNDE-" + timestamp,
            "personendaten": {
              "person": {
                "anrede": "HERR" or "FRAU" (infer from vorname if not explicit),
                "vorname": "..." (from vorname),
                "nachname": "..." (from nachname),
                "titel": { "prof": false, "dr": false }
              },
              "geburtsdatum": "YYYY-MM-DD" (from geburtsdatum),
              "geburtsort": "..." (from geburtsort),
              "staatsangehoerigkeit": "DE" (from staatsangehoerigkeit, omit if missing),
              "familienstand": {
                "@type": "VERHEIRATET" (from familienstand),
                "guetertrennungVereinbart": false
              }
            },
            "wohnsituation": {
              "wohnhaftSeit": "YYYY-MM-DD" (from wohnhaftSeit),
              "anschrift": {
                "strasse": "..." (from strasse),
                "hausnummer": "..." (from hausnummer),
                "plz": "..." (from plz),
                "ort": "..." (from ort)
              }
            },
            "kontakt": {
              "email": "..." (from email),
              "telefonnummer": {
                "vorwahl": "..." (split from telefonnummer),
                "nummer": "..." (split from telefonnummer)
              }
            },
            "finanzielles": {
              "beschaeftigung": {
                "@type": "ANGESTELLTER" (from beschaeftigungsart),
                "beruf": "..." (from beruf),
                // For ANGESTELLTER/ARBEITER:
                "beschaeftigungsstatus": "UNBEFRISTET" (from beschaeftigungsstatus),
                "beschaeftigungsverhaeltnis": {
                  "arbeitgeber": {
                    "name": "..." (from arbeitgeber),
                    "inDeutschland": true
                  },
                  "beschaeftigtSeit": "YYYY-MM-DD" (from beschaeftigtSeit),
                  "probezeit": false,
                  "anzahlGehaelterProJahr": "ZWOELF" (from anzahlGehaelterProJahr)
                },
                // BLOCK-005: Situation after retirement (omit for RENTNER!)
                "situationNachRenteneintritt": {
                  "rentenbeginn": "YYYY-MM-DD" (from rentenbeginn),
                  "gesetzlicheRenteMonatlich": number (from gesetzlicheRenteMonatlich),
                  "privateRenteMonatlich": number (from privateRenteMonatlich),
                  "sonstigesEinkommenMonatlich": number (from sonstigesEinkommenNachRente)
                }
              },
              "einkommenNetto": number (from nettoeinkommenMonatlich)
            }
          },
          // IMPORTANT: If antragsteller2_* fields exist, add second kunde:
          {
            "referenzId": "antragsteller2",
            "externeKundenId": "KUNDE-" + timestamp + "2",
            "personendaten": { ... (from antragsteller2_* fields) },
            "wohnsituation": { ... },
            "kontakt": { ... },
            "finanzielles": { ... }
          }
        ],

        // BLOCK-006: Kinder
        "kinderErfassung": {
          "@type": "VORHANDENE_KINDER" (if kinder array exists) or "KEINE_KINDER" (if no kinder),
          "kinder": [
            {
              "name": "..." (from kinder[].name),
              "geburtsdatum": "YYYY-MM-DD" (from kinder[].geburtsdatum),
              "kindergeldWirdBezogen": true (from kinder[].kindergeldWirdBezogen),
              "unterhalt": number (from kinder[].unterhalt)
            }
          ]
        },

        // BLOCK-007: Finanzielle Situation
        "finanzielleSituation": {
          "vermoegen": {
            "summeBankUndSparguthaben": {
              "guthaben": number (from summeBankUndSparGuthaben),
              "zinsertragJaehrlich": number (from zinsertragJaehrlich)
            },
            "summeDepotvermoegen": {
              "depotwert": number (from depotwert),
              "ertragJaehrlich": number (from dividendenJaehrlich)
            },
            "summeSparplaene": {
              "aktuellerWert": number (from sparplaeneAktuellerWert),
              "beitragMonatlich": number (from sparplaeneBeitragMonatlich)
            },
            "bausparvertraege": [
              {
                "angesparterBetrag": number,
                "sparbeitrag": number,
                "bausparsumme": number,
                "bausparkasse": "..." (from bausparvertraege array)
              }
            ],
            "lebensOderRentenversicherungen": [
              {
                "rueckkaufswert": number,
                "praemieMonatlich": number (from lebensversicherungen array)
              }
            ],
            "summeSonstigesVermoegen": {
              "aktuellerWert": number (from sonstigesVermoegenWert)
            }
          },
          "einnahmen": {
            "summeSonstigeEinnahmenMonatlich": {
              "betrag": number (from sonstigeEinnahmenMonatlich)
            },
            "summeVariablerEinkuenfteMonatlich": number (from variableEinkuenfteMonatlich),
            "summeEhegattenunterhalt": number (from ehegattenunterhaltMonatlich),
            "summeUnbefristeteZusatzrentenMonatlich": {
              "betrag": number (from unbefristeteZusatzrentenMonatlich)
            },
            "einkuenfteAusNebentaetigkeit": [
              {
                "betragMonatlich": number,
                "beginnDerNebentaetigkeit": "YYYY-MM-DD" (from einkuenfteAusNebentaetigkeit array)
              }
            ]
          },
          "ausgaben": {
            "summeMietausgaben": {
              "betragMonatlich": number (from mietausgabenMonatlich),
              "entfaelltMitFinanzierung": false
            },
            "unterhaltsverpflichtungenMonatlich": [number] (from unterhaltsverpflichtungenMonatlich as array),
            "summePrivaterKrankenversicherungenMonatlich": number (from privateKrankenversicherungMonatlich),
            "summeSonstigerAusgabenMonatlich": {
              "betrag": number (from sonstigeAusgabenMonatlich)
            }
          },
          "verbindlichkeiten": {
            "ratenkredite": [
              {
                "rateMonatlich": number,
                "glaeubiger": "...",
                "restschuld": number,
                "laufzeitende": "YYYY-MM-DD" (from ratenkredite array)
              }
            ],
            "privatdarlehen": [
              {
                "rateMonatlich": number,
                "glaeubiger": "...",
                "restschuld": number,
                "laufzeitende": "YYYY-MM-DD" (from privatdarlehen array)
              }
            ],
            "sonstigeVerbindlichkeit": {
              "rateMonatlich": number (from sonstigeVerbindlichkeitRateMonatlich)
            }
          },

          // BLOCK-011: Bestehende Immobilien
          "bestehendeImmobilien": [
            {
              "bezeichnung": "..." (from bestehendeImmobilien[].bezeichnung),
              "marktwert": number,
              "immobilie": {
                "adresse": {
                  "strasse": "...",
                  "hausnummer": "...",
                  "plz": "...",
                  "ort": "..."
                },
                "typ": {
                  "@type": "EINFAMILIENHAUS",
                  "grundstuecksgroesse": number,
                  "gebaeude": {
                    "baujahr": number,
                    "nutzung": {
                      "wohnen": {
                        "gesamtflaeche": number,
                        "nutzungsart": {
                          "@type": "EIGENGENUTZT/VERMIETET/TEILVERMIETET",
                          "mieteinnahmenNettoKaltMonatlich": number,
                          "vermieteteFlaeche": number
                        }
                      }
                    }
                  }
                }
              },
              "darlehensliste": [
                {
                  "@type": "BESTEHENDES_IMMOBILIENDARLEHEN",
                  "grundschuldart": "BUCH_GRUNDSCHULD",
                  "darlehensgeber": {
                    "@type": "PRODUKTANBIETER_DARLEHENSGEBER",
                    "produktanbieter": "..." (from darlehen[].darlehensgeber)
                  },
                  "grundschuld": number,
                  "urspruenglicheDarlehenssumme": number,
                  "rateMonatlich": number,
                  "sollzins": number,
                  "zinsbindungBis": "YYYY-MM-DD",
                  "laufzeitende": "YYYY-MM-DD",
                  "restschuld": {
                    "aktuell": number
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
}

IMPORTANT:
- Map ONLY the data that is available in EXTRACTED DATA above
- Use current timestamp for IDs (e.g., Date.now())
- OMIT all fields that have no data (null or missing)
- Do NOT include default values for missing optional fields
- Only required fields (referenzId, externeKundenId, person names, @type discriminators) must be present
- For situationNachRenteneintritt: ONLY include if beschaeftigungsart is NOT "RENTNER"
- For bankverbindung: Use kundenreferenzIdsDerKontoinhaber if account holder is applicant(s), otherwise use nameKontoinhaberKeinKunde
- For finanzierungsobjekt/finanzierungsbedarf: Only include if objektart or finanzierungszweck is present in extracted data
- For bestehendeImmobilien: Only include if array exists and has elements in extracted data`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0, // CRITICAL: Temperature 0 for consistent output
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    logger.info('AI field mapping response received', {
      responseLength: responseText.length,
    });

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    const mappedPayload = JSON.parse(cleanedResponse);

    logger.info('AI field mapping completed successfully', {
      hasImportMetadaten: !!mappedPayload.importMetadaten,
      hasKundenangaben: !!mappedPayload.kundenangaben,
      hasHaushalte: !!mappedPayload.kundenangaben?.haushalte,
      hasKunden: !!mappedPayload.kundenangaben?.haushalte?.[0]?.kunden,
    });

    return mappedPayload;
  } catch (error) {
    logger.error('AI field mapping failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error('Failed to map data to Europace structure with AI');
  }
}
