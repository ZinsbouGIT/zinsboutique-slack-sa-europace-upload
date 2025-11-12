# Comprehensive Selbstauskunft Data Extraction

## Current Fields (15) ✅
- vorname, nachname, geburtsdatum
- email, telefonnummer
- strasse, hausnummer, plz, ort
- arbeitgeber, beschaeftigungsart, nettoeinkommenMonatlich
- kaufpreis, eigenkapital, finanzierungszweck

## Missing Critical Fields ⚠️

### Personal Details
- [ ] **familienstand** - LEDIG, VERHEIRATET, GESCHIEDEN, VERWITWET
- [ ] **anzahlKinder** - Number of children
- [ ] **staatsangehoerigkeit** - Nationality
- [ ] **geburtsort** - Place of birth
- [ ] **aufenthaltsstatus** - Residence status (for non-Germans)

### Current Address Details
- [ ] **wohnhaftSeit** - Living at address since (date)
- [ ] **wohnverhaeltnis** - EIGENTUM, MIETE, ELTERN
- [ ] **monatlicheKaltmiete** - Monthly rent if renting

### Employment Details
- [ ] **beschaeftigtSeit** - Employed since (date)
- [ ] **beruf** - Occupation/profession
- [ ] **bruttoeinkommen** - Gross monthly income
- [ ] **zusatzlichesEinkommen** - Additional income sources
- [ ] **sonstigeEinkuenfte** - Other income (rent, pension, etc.)

### Financial Details - Income
- [ ] **kindergeld** - Child benefit
- [ ] **elterngeld** - Parental allowance
- [ ] **nebeneinkommen** - Side income
- [ ] **mieteinnahmen** - Rental income
- [ ] **kapitalertraege** - Capital gains

### Financial Details - Expenses
- [ ] **monatlicheAusgaben** - Total monthly expenses
- [ ] **unterhaltszahlungen** - Alimony/child support payments
- [ ] **krankenversicherung** - Health insurance cost
- [ ] **lebenshaltungskosten** - Living costs

### Existing Financial Obligations
- [ ] **bestehendeKredite** - Existing loans (array)
  - kreditart, kreditgeber, restschuld, monatlicheRate, laufzeitEnde
- [ ] **kreditkarten** - Credit cards
- [ ] **buergschaften** - Guarantees

### Property Details (Finanzierungsobjekt)
- [ ] **objektart** - EINFAMILIENHAUS, EIGENTUMSWOHNUNG, MEHRFAMILIENHAUS, etc.
- [ ] **nutzungsart** - EIGENGENUTZT, VERMIETET, TEILVERMIETET
- [ ] **baujahr** - Year built
- [ ] **wohnflaeche** - Living space in sqm
- [ ] **grundstuecksgroesse** - Plot size in sqm
- [ ] **anzahlZimmer** - Number of rooms
- [ ] **anzahlGaragen** - Number of garages/parking
- [ ] **modernisierungen** - Recent renovations
- [ ] **energieausweis** - Energy certificate class

### Financing Details
- [ ] **darlehenswunsch** - Desired loan amount
- [ ] **laufzeit** - Desired term in years
- [ ] **zinsbindung** - Fixed rate period
- [ ] **sondertilgung** - Extra repayment wishes
- [ ] **bereitstellungszins** - Provision interest
- [ ] **verwendungszweckDetails** - Detailed purpose description

### Bank Information
- [ ] **kontoinhaber** - Account holder
- [ ] **iban** - IBAN
- [ ] **bankname** - Bank name

### Consent & Declarations
- [ ] **schufa** - SCHUFA consent
- [ ] **datenschutz** - Data protection consent
- [ ] **ort** - Place of signature
- [ ] **datum** - Date of signature

---

## Recommendation

Given the complexity, I suggest a **two-phase approach**:

### Phase 1 (Current) - Essential Fields ✅
Extract the 15 core fields needed to create a basic Vorgang:
- Personal info, address, employment, basic financing

### Phase 2 (Enhanced) - Comprehensive Fields
Extract ALL 50+ fields for complete Vorgang:
- Family details, detailed income/expenses, property specs, existing obligations

**Should we:**
1. **Stay with Phase 1** - Simple, fast, works now
2. **Upgrade to Phase 2** - Comprehensive, better data quality, more complex

What do you prefer?
