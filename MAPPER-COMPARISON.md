# Vergleich: Unser Mapper vs. Echtes Europace Payload (JL8Y5D)

## ✅ BEREITS KORREKT GEMAPPED

### 1. Antragsteller (Personal Data)
- ✅ Anrede, Vorname, Nachname
- ✅ Geburtsdatum, Geburtsort
- ✅ Email, Telefon
- ✅ Familienstand
- ✅ Staatsangehörigkeit
- ✅ Beschäftigung (Arbeitgeber, Beruf, Einkommen, etc.)
- ✅ Anschrift

---

## ⚠️ STRUKTURELLE UNTERSCHIEDE

### 1. KINDER - Struktur falsch

**Unser Mapper:**
```json
"kinderErfassung": {
  "@type": "VORHANDENE_KINDER",
  "kinder": [...]
}
```

**Echtes Europace (JL8Y5D):**
```json
"kinder": [
  {
    "id": "...",
    "geburtsdatum": "2018-05-01",
    "kindergeldWirdBezogen": true,
    "name": "Kind 1"
  }
]
```

**Problem:** Wir nutzen `kinderErfassung` wrapper mit `@type` discriminator, aber echtes Payload hat nur `kinder` Array.

---

## ❌ FEHLENDE FELDER - VERMÖGEN (Assets)

### Was wir haben:
```javascript
vermoegen: {
  bausparvertraege: [...],  // ✅ Vorhanden
  lebensversicherungen: [...],  // ✅ Vorhanden (aber als ARRAY, nicht einzeln!)
}
```

### Was im echten Payload ist:
```json
"positionen": {
  "bankUndSparguthaben": [{...}],      // ❌ FEHLT komplett
  "bausparvertraege": [{...}, {...}],  // ✅ Haben wir
  "lebensUndRentenVersicherungen": [{...}, {...}],  // ⚠️ Name anders!
  "sparplaene": [{...}],               // ❌ FEHLT komplett
  "wertpapiere": [{...}],              // ❌ FEHLT komplett
  "sonstigeVermoegen": [{...}]         // ❌ FEHLT komplett
}
```

**Probleme:**
1. ❌ `bankUndSparguthaben` als Array fehlt (wir nutzen einzelne Werte)
2. ⚠️ `lebensUndRentenVersicherungen` vs `lebensversicherungen` (Name!)
3. ❌ `sparplaene` komplett fehlend
4. ❌ `wertpapiere` komplett fehlend
5. ❌ `sonstigeVermoegen` komplett fehlend

---

## ❌ FEHLENDE FELDER - EINNAHMEN (Income)

### Was im echten Payload ist:
```json
"positionen": {
  "kindergeld": [{"einnahmenMonatlich": 510}],
  "einkuenfteAusNebentaetigkeit": [{
    "einnahmenMonatlich": 400,
    "beginnDerNebentaetigkeit": "2022-01-01"
  }],
  "sonstigeEinnahmen": [{"einnahmenMonatlich": 500}],
  "ehegattenUnterhalt": [{"einnahmenMonatlich": 0}],
  "variableEinkuenfte": [{"einnahmenMonatlich": 300}],
  "unbefristeteZusatzRenten": [{"einnahmenMonatlich": 200}]
}
```

**Status:**
- ❌ Kindergeld als separates Array fehlt (wir haben nur kindergeldFuerKinderUnter18 boolean)
- ⚠️ `einkuenfteAusNebentaetigkeit` - haben wir im Interface, aber mappen wir nicht!
- ❌ `sonstigeEinnahmen` fehlt komplett
- ❌ `ehegattenUnterhalt` fehlt komplett
- ❌ `variableEinkuenfte` fehlt komplett
- ❌ `unbefristeteZusatzRenten` fehlt komplett

---

## ❌ FEHLENDE FELDER - AUSGABEN (Expenses)

### Was im echten Payload ist:
```json
"positionen": {
  "mietAusgaben": [{
    "ausgabenMonatlich": 0,
    "entfallenMitFinanzierung": false
  }],
  "privateKrankenversicherung": [{"ausgabenMonatlich": 450}],
  "sonstigeAusgaben": [{"ausgabenMonatlich": 800}]
}
```

**Status:**
- ⚠️ `mietAusgaben` - haben wir (monatlicheKaltmiete), aber falsche Struktur
- ⚠️ `privateKrankenversicherung` - haben wir, aber nicht als Array
- ⚠️ `sonstigeAusgaben` - haben wir, aber nicht als Array

---

## ❌ FEHLENDE FELDER - VERBINDLICHKEITEN (Liabilities)

### Was im echten Payload ist:
```json
"positionen": {
  "ratenkredite": [
    {
      "glaeubiger": "Commerzbank",
      "laufzeitEnde": "2026-12-31",
      "rateMonatlich": 200,
      "restschuld": 5000,
      "vermoegensTyp": "VERBINDLICHKEIT",
      "zahlungsTyp": "AUSGABE"
    }
  ],
  "privateDarlehen": [{...}],
  "sonstigeVerbindlichkeiten": [{"rateMonatlich": 50}]
}
```

**Status:**
- ✅ `ratenkredite` - HABEN WIR!
- ✅ `privateDarlehen` - HABEN WIR!
- ⚠️ `sonstigeVerbindlichkeiten` - haben wir (sonstigeVerbindlichkeitRateMonatlich), aber nicht als Array

---

## ❌ KRITISCH FEHLEND - BESTEHENDE IMMOBILIEN

### Was im echten Payload ist:
```json
"bestehendeImmobilien": [
  {
    "id": "...",
    "adresse": {
      "hausnummer": "15",
      "ort": "Berlin",
      "postleitzahl": "10179",
      "strasse": "Wohnstraße"
    },
    "bundesland": "BERLIN",
    "grundstueck": {"groesse": 0},
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
        "aktuelleRestschuldWennNichtAbzuloesen": 180000,
        "darlehensArt": "IMMOBILIENDARLEHEN",
        "eingetrageneGrundschuld": 200000,
        "grundschuldArt": "BUCH_GRUNDSCHULD",
        "rateMonatlich": 850,
        "zinsBindungEndetAm": "2028-12-31"
      }
    ],
    "bezeichnung": "Eigentumswohnung Berlin"
  }
]
```

**Status:**
- ❌ **KOMPLETT FEHLEND!** Wir haben `bestehendeImmobilien` im Interface, aber mappen sie NICHT!

---

## ZUSAMMENFASSUNG: WAS FEHLT

### 🔴 KRITISCH (Komplett fehlend):
1. ❌ `bestehendeImmobilien` - GANZE STRUKTUR FEHLT
2. ❌ `kindergeld` als separates Einnahmen-Array
3. ❌ `sparplaene` (Vermögen)
4. ❌ `wertpapiere` (Vermögen)
5. ❌ `sonstigeVermoegen` (Vermögen)
6. ❌ `sonstigeEinnahmen`
7. ❌ `ehegattenUnterhalt`
8. ❌ `variableEinkuenfte`
9. ❌ `unbefristeteZusatzRenten`

### 🟡 VORHANDEN ABER FALSCHE STRUKTUR:
1. ⚠️ `kinder` - verwenden `kinderErfassung` wrapper (evtl. alte API)
2. ⚠️ `bankUndSparguthaben` - als Array statt einzelne Werte
3. ⚠️ `lebensUndRentenVersicherungen` vs `lebensversicherungen` (Name)
4. ⚠️ `mietAusgaben` - haben monatlicheKaltmiete, aber falsche Struktur
5. ⚠️ `einkuenfteAusNebentaetigkeit` - im Interface, aber nicht gemapped

### ✅ KORREKT GEMAPPED:
1. ✅ Antragsteller personal data
2. ✅ Beschäftigung
3. ✅ Bausparverträge
4. ✅ Ratenkredite
5. ✅ Privatdarlehen

---

## NÄCHSTE SCHRITTE

1. **Fix `kinder` Struktur** - Entfernen von `kinderErfassung` wrapper oder prüfen ob beide Versionen unterstützt werden
2. **Add `bestehendeImmobilien` mapping** - KRITISCH!
3. **Add missing Vermögen arrays** - bankUndSparguthaben, sparplaene, wertpapiere, sonstigeVermoegen
4. **Add missing Einnahmen arrays** - kindergeld, sonstigeEinnahmen, ehegattenUnterhalt, variableEinkuenfte, unbefristeteZusatzRenten
5. **Convert existing single values to arrays** where needed
