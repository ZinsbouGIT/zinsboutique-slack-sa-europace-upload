# ANTRAGSTELLER Tab Field Mapping Gaps

**Reference:** test-block-012-COMPREHENSIVE.json (Max & Erika Mustermann)

## Currently Working ✅

### Per Kunde (Applicant):
- ✅ personendaten.person (anrede, titel, vorname, nachname)
- ✅ personendaten.geburtsdatum
- ✅ personendaten.geburtsort
- ✅ personendaten.staatsangehoerigkeit
- ✅ personendaten.familienstand (@type, guetertrennungVereinbart)
- ✅ wohnsituation.wohnhaftSeit
- ✅ wohnsituation.anschrift
- ✅ kontakt.email
- ✅ kontakt.telefonnummer (vorwahl, nummer)
- ✅ finanzielles.steuerId
- ✅ finanzielles.beschaeftigung (@type, beruf, beschaeftigungsstatus, beschaeftigungsverhaeltnis)
- ✅ finanzielles.einkommenNetto

### Per Haushalt:
- ✅ finanzielleSituation.vermoegen.summeBankUndSparguthaben.guthaben
- ✅ finanzielleSituation.ausgaben.summeMietausgaben
- ✅ finanzielleSituation.verbindlichkeiten.ratenkredite (partially)

---

## Missing from Mapper ❌

### Per Kunde (Applicant):

#### personendaten:
- ❌ **geburtsland.isoCountryCode** - PDF parser extracts `staatsangehoerigkeit`, needs to be mapped as geburtsland too

#### finanzielles:
- ❌ **situationNachRenteneintritt** (Block 5 - Retirement) - COMPLETELY MISSING!
  - rentenversicherung.@type: "GESETZLICHE_RENTENVERSICHERUNG"
  - rentenversicherung.monatlicheRente: number
  - rentenversicherung.renteneintritt: "YYYY-MM-DD" (optional)

- ❌ **anzahlKinder**: number - Currently only at haushalt level, but also needed at kunde level
- ❌ **kindergeldFuerKinderUnter18**: boolean
- ❌ **bankverbindung** (Block 8) - COMPLETELY MISSING!
  - kreditinstitut: string
  - iban: string
  - bic: string
  - kontoinhaber: string

#### aufenthaltsstatus:
- ❌ **@type**: "EU_BUERGER" - COMPLETELY MISSING!

---

### Per Haushalt:

#### kinderErfassung:
- ❌ **@type** should be **"VORHANDENE_KINDER"** (currently using "KINDER_EINGEGEBEN")
- ❌ **kinder[]** array is incomplete:
  - Missing: **name**: string
  - Missing: **geburtsdatum**: "YYYY-MM-DD"
  - Missing: **wohnhaftBeiAntragsteller**: boolean
  - Missing: **kindergeldWirdBezogen**: boolean
  - Current mapper only creates empty objects based on count!

#### finanzielleSituation:
- ❌ **gemeinsamerHaushalt**: boolean
- ❌ **vermoegen.summeBankUndSparguthaben.zinsertragJaehrlich**: number
- ❌ **ausgaben.lebenshaltungskostenMonatlich**: number
- ❌ **verbindlichkeiten.kreditkarten**:
  - dispositionskredite: number
  - kreditkarten: number
  - geduldeteUeberziehungen: number

---

## PDF Parser Status

The AI PDF parser (aiPdfParser.ts) already extracts:
- ✅ rentenbeginn, gesetzlicheRenteMonatlich, privateRenteMonatlich (Block 5)
- ✅ kinder[] array with full details (Block 6)
- ✅ kontoinhaber, iban, bic, bankname (Block 8)
- ✅ zinsertragJaehrlich, dividendenJaehrlich
- ✅ Most financial fields

**BUT:** The mapper (europaceMapper.ts) is NOT using all these extracted fields!

---

## Action Plan

### Phase 1: Add Missing Block 5 (Retirement)
- Add `situationNachRenteneintritt` to kunde.finanzielles
- Map `rentenbeginn` → `renteneintritt`
- Map `gesetzlicheRenteMonatlich` → `monatlicheRente`
- Add for both antragsteller1 and antragsteller2

### Phase 2: Add Missing Block 8 (Bank Account)
- Add `bankverbindung` to kunde.finanzielles
- Map kontoinhaber, iban, bic, kreditinstitut

### Phase 3: Fix Children Mapping
- Change kinderErfassung.@type to "VORHANDENE_KINDER"
- Use extracted kinder[] array instead of just anzahlKinder count
- Map name, geburtsdatum, wohnhaftBeiAntragsteller, kindergeldWirdBezogen

### Phase 4: Add Missing kunde-level fields
- Add anzahlKinder to kunde.finanzielles
- Add kindergeldFuerKinderUnter18 to kunde.finanzielles
- Add aufenthaltsstatus with @type: "EU_BUERGER"
- Add geburtsland.isoCountryCode to personendaten

### Phase 5: Add Missing Haushalt-level fields
- Add gemeinsamerHaushalt to finanzielleSituation
- Add zinsertragJaehrlich to summeBankUndSparguthaben
- Add lebenshaltungskostenMonatlich to ausgaben
- Add kreditkarten object to verbindlichkeiten

### Phase 6: Test Complete Flow
- Test with real Selbstauskunft PDF
- Verify all ANTRAGSTELLER fields populate correctly in Europace UI
- Create v1 for workers to use

---

## Next Steps

1. Update `src/services/europaceMapper.ts` with all missing fields
2. Update `src/services/aiPdfParser.ts` prompt if any fields are missing
3. Test end-to-end with a real PDF
4. Deploy v1 with complete ANTRAGSTELLER tab support
5. LATER: Add IMMOBILIE and VORHABEN tabs
