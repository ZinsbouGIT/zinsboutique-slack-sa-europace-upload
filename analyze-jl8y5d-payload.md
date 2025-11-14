# Europace Payload JL8Y5D - Struktur-Analyse

## 1. KINDER (Children)

```json
"kinder": [
  {
    "id": "69135e69827e74ca0bd5e5c6",
    "geburtsdatum": "2018-05-01",
    "kindergeldWirdBezogen": true,
    "name": "Kind 1"
  },
  {
    "id": "69135e691b079e024d1df3ff",
    "geburtsdatum": "2020-08-15",
    "kindergeldWirdBezogen": true,
    "name": "Kind 2"
  }
]
```

**Felder:**
- `geburtsdatum` (Date)
- `kindergeldWirdBezogen` (Boolean)
- `name` (String)

---

## 2. VERMÖGEN (Assets) - In `haushalte[0].positionen`

### 2.1 Bank- und Sparguthaben
```json
"bankUndSparguthaben": [
  {
    "aktuellerWert": 50000,
    "maximalAufzuloesenderWert": 0,
    "zinsertragJaehrlich": 500,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 2.2 Bausparverträge
```json
"bausparvertraege": [
  {
    "tarif": "Classic",
    "id": "69135e696f1a8b64725bebef",
    "vertragsNummer": "BSP-123456",
    "bausparSumme": 50000,
    "zuteilungsDatum": "2025-12-31",
    "vermoegensEinsatz": "KEIN_EINSATZ",
    "aktuellerWert": 15000,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE",
    "typ": "BAUSPARVERTRAG"
  },
  {
    "tarif": "Fuchs",
    "id": "69135e69c90bf83443f20ec3",
    "vertragsNummer": "BSP-789012",
    "bausparSumme": 30000,
    "aktuellerWert": 8000,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE",
    "typ": "BAUSPARVERTRAG"
  },
  {
    "tarif": "Standard",
    "id": "69135e69659d149257e405c0",
    "vertragsNummer": "BSP-345678",
    "bausparSumme": 25000,
    "produktAnbieter": {...},
    "aktuellerWert": 5000,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE",
    "typ": "BAUSPARVERTRAG"
  }
]
```

### 2.3 Lebens- und Rentenversicherungen
```json
"lebensUndRentenVersicherungen": [
  {
    "id": "69135e69182401e076fc0fdb",
    "rueckkaufsWertAktuell": 25000,
    "praemieMonatlich": 150,
    "vermoegensEinsatz": "AUFLOESEN",
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE"
  },
  {
    "id": "69135e69127c03184c1e78aa",
    "rueckkaufsWertAktuell": 15000,
    "praemieMonatlich": 100,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE"
  },
  {
    "id": "69135e69d4ff86bad1daf0e0",
    "rueckkaufsWertAktuell": 10000,
    "praemieMonatlich": 80,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 2.4 Sparpläne
```json
"sparplaene": [
  {
    "aktuellerWert": 12000,
    "vermoegensTyp": "VERMOEGEN",
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 2.5 Wertpapiere
```json
"wertpapiere": [
  {
    "aktuellerWert": 35000,
    "zahlungsTyp": "EINNAHME",
    "vermoegensTyp": "VERMOEGEN"
  }
]
```

### 2.6 Sonstiges Vermögen
```json
"sonstigeVermoegen": [
  {
    "aktuellerWert": 8000,
    "vermoegensTyp": "VERMOEGEN"
  }
]
```

---

## 3. EINNAHMEN (Income) - In `haushalte[0].positionen`

### 3.1 Kindergeld
```json
"kindergeld": [
  {
    "einnahmenMonatlich": 510,
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 3.2 Einkünfte aus Nebentätigkeit
```json
"einkuenfteAusNebentaetigkeit": [
  {
    "einnahmenMonatlich": 400,
    "beginnDerNebentaetigkeit": "2022-01-01",
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 3.3 Sonstige Einnahmen
```json
"sonstigeEinnahmen": [
  {
    "einnahmenMonatlich": 500,
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 3.4 Ehegattenunterhalt
```json
"ehegattenUnterhalt": [
  {
    "einnahmenMonatlich": 0,
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 3.5 Variable Einkünfte
```json
"variableEinkuenfte": [
  {
    "einnahmenMonatlich": 300,
    "zahlungsTyp": "EINNAHME"
  }
]
```

### 3.6 Unbefristete Zusatzrenten
```json
"unbefristeteZusatzRenten": [
  {
    "einnahmenMonatlich": 200,
    "zahlungsTyp": "EINNAHME"
  }
]
```

---

## 4. AUSGABEN (Expenses) - In `haushalte[0].positionen`

### 4.1 Mietausgaben
```json
"mietAusgaben": [
  {
    "ausgabenMonatlich": 0,
    "entfallenMitFinanzierung": false,
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 4.2 Private Krankenversicherung
```json
"privateKrankenversicherung": [
  {
    "ausgabenMonatlich": 450,
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 4.3 Sonstige Ausgaben
```json
"sonstigeAusgaben": [
  {
    "ausgabenMonatlich": 800,
    "zahlungsTyp": "AUSGABE"
  }
]
```

---

## 5. VERBINDLICHKEITEN (Liabilities) - In `haushalte[0].positionen`

### 5.1 Ratenkredite
```json
"ratenkredite": [
  {
    "glaeubiger": "Commerzbank",
    "laufzeitEnde": "2026-12-31",
    "rateMonatlich": 200,
    "restschuld": 5000,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  },
  {
    "glaeubiger": "ADAC Leasing",
    "laufzeitEnde": "2027-06-30",
    "rateMonatlich": 150,
    "restschuld": 8000,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  },
  {
    "glaeubiger": "MediaMarkt Finanzierung",
    "laufzeitEnde": "2025-03-31",
    "rateMonatlich": 100,
    "restschuld": 2000,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 5.2 Privatdarlehen
```json
"privateDarlehen": [
  {
    "glaeubiger": "Familie",
    "laufzeitEnde": "2025-12-31",
    "rateMonatlich": 100,
    "restschuld": 3000,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  },
  {
    "glaeubiger": "Freunde",
    "laufzeitEnde": "2024-12-31",
    "rateMonatlich": 50,
    "restschuld": 1500,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  }
]
```

### 5.3 Sonstige Verbindlichkeiten
```json
"sonstigeVerbindlichkeiten": [
  {
    "rateMonatlich": 50,
    "vermoegensTyp": "VERBINDLICHKEIT",
    "zahlungsTyp": "AUSGABE"
  }
]
```

---

## 6. BESTEHENDE IMMOBILIEN (Existing Properties)

```json
"bestehendeImmobilien": [
  {
    "id": "69135e69031717a463cf54cf",
    "adresse": {
      "hausnummer": "15",
      "ort": "Berlin",
      "postleitzahl": "10179",
      "strasse": "Wohnstraße"
    },
    "bundesland": "BERLIN",
    "grundstueck": {
      "groesse": 0
    },
    "gebaeude": {
      "baujahr": 2015,
      "wohnflaeche": {
        "vermietungsInformationen": {
          "nutzungsArt": "EIGENGENUTZT"
        },
        "gesamtGroesse": 120
      }
    },
    "objektArt": "EIGENTUMSWOHNUNG",
    "verkehrswert": 450000,
    "marktwert": 450000,
    "bestehendeDarlehen": [
      {
        "id": "69135e697c4e1d5bdac12841",
        "aktuelleRestschuldWennNichtAbzuloesen": 180000,
        "darlehensArt": "IMMOBILIENDARLEHEN",
        "eingetrageneGrundschuld": 200000,
        "grundschuldArt": "BUCH_GRUNDSCHULD",
        "rateMonatlich": 850,
        "zinsBindungEndetAm": "2028-12-31"
      }
    ],
    "bezeichnung": "Eigentumswohnung Berlin"
  },
  {
    "id": "69135e69e5062462be33f470",
    "adresse": {
      "hausnummer": "8",
      "ort": "München",
      "postleitzahl": "80331",
      "strasse": "Vermietstraße"
    },
    "bundesland": "BAYERN",
    "grundstueck": {
      "groesse": 0
    },
    "gebaeude": {
      "baujahr": 2010,
      "wohnflaeche": {
        "vermietungsInformationen": {
          "nutzungsArt": "VERMIETET",
          "mieteinnahmenNettoKaltMonatlich": 1200,
          "vermieteteFlaeche": 75
        },
        "gesamtGroesse": 75
      }
    },
    "objektArt": "EIGENTUMSWOHNUNG",
    "verkehrswert": 300000,
    "marktwert": 300000,
    "bezeichnung": "Vermietetes Apartment München"
  }
]
```

**Wichtige Felder:**
- `adresse` (Straße, Hausnummer, PLZ, Ort)
- `bundesland`
- `objektArt` (EIGENTUMSWOHNUNG, EINFAMILIENHAUS, etc.)
- `baujahr`
- `wohnflaeche.gesamtGroesse`
- `wohnflaeche.vermietungsInformationen.nutzungsArt` (EIGENGENUTZT, VERMIETET)
- `wohnflaeche.vermietungsInformationen.mieteinnahmenNettoKaltMonatlich`
- `wohnflaeche.vermietungsInformationen.vermieteteFlaeche`
- `verkehrswert`
- `marktwert`
- `bestehendeDarlehen[]` (existing loans on this property)
  - `aktuelleRestschuldWennNichtAbzuloesen`
  - `darlehensArt`
  - `eingetrageneGrundschuld`
  - `rateMonatlich`
  - `zinsBindungEndetAm`
- `bezeichnung` (description/name)

---

## ZUSAMMENFASSUNG DER STRUKTUR

```
haushalte[0]
  ├── antragsteller[]          // Personen (bereits gemapped)
  ├── kinder[]                 // ⚠️ WICHTIG
  ├── bestehendeImmobilien[]   // ⚠️ WICHTIG - Weitere Immobilien
  └── positionen               // ⚠️ WICHTIG - Alle finanziellen Positionen
      ├── VERMÖGEN
      │   ├── bankUndSparguthaben[]
      │   ├── bausparvertraege[]
      │   ├── lebensUndRentenVersicherungen[]
      │   ├── sparplaene[]
      │   ├── wertpapiere[]
      │   └── sonstigeVermoegen[]
      ├── EINNAHMEN
      │   ├── kindergeld[]
      │   ├── einkuenfteAusNebentaetigkeit[]
      │   ├── sonstigeEinnahmen[]
      │   ├── ehegattenUnterhalt[]
      │   ├── variableEinkuenfte[]
      │   └── unbefristeteZusatzRenten[]
      ├── AUSGABEN
      │   ├── mietAusgaben[]
      │   ├── privateKrankenversicherung[]
      │   └── sonstigeAusgaben[]
      └── VERBINDLICHKEITEN
          ├── ratenkredite[]
          ├── privateDarlehen[]
          └── sonstigeVerbindlichkeiten[]
```
