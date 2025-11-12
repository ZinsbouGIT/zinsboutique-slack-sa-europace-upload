# ⚠️ CRITICAL: Europace API Implementation Issues

After reviewing the official Europace API documentation, we have **several critical issues** that need to be fixed:

---

## 🔴 Issue #1: Wrong Authentication Method

### Current (WRONG)
```
Authorization: Basic NUdRS1BDRkk2SEhHRlBNNTpsVmZvRC15dllTeEltT2FPdkdBRHluZ2M=
```

### Required (CORRECT)
```
Authorization: Bearer {OAuth2_Access_Token}
```

**Problem:** We're using Basic Auth, but Europace requires **OAuth2 Bearer tokens**.

**Required OAuth2 Scopes:**
- `baufinanzierung:echtgeschaeft` - For production mode
- `baufinanzierung:vorgang:schreiben` - For creating cases
- `unterlagen:dokument:schreiben` - For uploading documents

---

## 🔴 Issue #2: Wrong Endpoints

### Vorgang Creation

**Current (WRONG):**
```
POST https://api.europace.de/v2/vorgaenge
```

**Required (CORRECT):**
```
POST https://baufinanzierung.api.europace.de/kundenangaben
```

### Document Upload

**Current (WRONG):**
```
POST https://api.europace.de/v2/vorgaenge/{id}/unterlagen
```

**Required (CORRECT):**
```
POST https://api.europace2.de/v2/dokumente
```

---

## 🔴 Issue #3: Wrong Request Structure for Vorgang

### Current (WRONG) - Too minimal
```json
{
  "finanzierungsBedarf": {
    "finanzierungszweck": "KAUF"
  }
}
```

### Required (CORRECT) - Full structure
```json
{
  "importMetadaten": {
    "datenkontext": "ECHT_GESCHAEFT",
    "externeVorgangsId": "...",
    "importquelle": "..."
  },
  "kundenangaben": {
    "haushalte": [
      {
        "personen": [
          {
            "personendaten": {
              "vorname": "...",
              "nachname": "...",
              "geburtsdatum": "...",
              "email": "...",
              "telefonnummer": "..."
            }
          }
        ]
      }
    ],
    "finanzierungsobjekt": {
      "adresse": {...},
      "objektart": "EINFAMILIENHAUS"
    },
    "finanzierungsbedarf": {
      "finanzierungszweck": "KAUF",
      "kaufpreis": 0
    }
  }
}
```

---

## 🔴 Issue #4: Wrong Document Upload Format

### Current (WRONG)
```
Form fields: file, dokumentart, name
```

### Required (CORRECT)
```
Form fields: file, caseId, displayName, category
```

**category should be:** `"Selbstauskunft"` (not `dokumentart`)

---

## 📋 What We Need to Do

### 1. Get OAuth2 Credentials
You need to:
- Register an OAuth2 application with Europace
- Get Client ID and Client Secret
- Obtain an access token with the required scopes

### 2. Extract Data from PDF (Selbstauskunft)
The PDF contains customer data we need to extract:
- Name (Vorname, Nachname)
- Geburtsdatum (date of birth)
- Email, Telefonnummer
- Employer (Arbeitgeber)
- Income (Einkommen)
- Address
- Property details
- Financing needs (Kaufpreis, Eigenkapital)

**Options for extraction:**
- **Manual entry** - User provides data separately
- **PDF parsing** - Use a library to extract text from PDF
- **OCR** - Use OCR service for scanned PDFs
- **Minimal approach** - Create Vorgang with minimal data, just upload PDF

### 3. Update Code
Update the following files:
- `src/europace/kundenangaben.ts` - Fix endpoint, auth, request structure
- `src/europace/unterlagen.ts` - Fix endpoint, auth, form fields
- `.env` - Add OAuth2 credentials

---

## 🎯 Recommended Approach

Given the complexity of extracting data from PDFs, I recommend a **simplified approach**:

### Option A: Minimal Vorgang + PDF Upload (Simplest)
1. Create Vorgang with minimal required fields
2. Upload the PDF as "Selbstauskunft" category
3. Let Europace users manually review the PDF and fill in details

### Option B: Manual Data Entry
1. Bot asks user to provide key fields via Slack modal/form
2. Create Vorgang with that data
3. Upload PDF

### Option C: Full PDF Parsing (Most Complex)
1. Parse PDF to extract all customer data
2. Map extracted data to Europace API structure
3. Create fully populated Vorgang
4. Upload PDF as backup

---

## ❓ Next Steps

**Questions for you:**
1. Do you have OAuth2 credentials for Europace API?
2. Which approach do you prefer (A, B, or C)?
3. Should we create Vorgänge with minimal data for now and let users fill in details manually?

**What I can help with:**
- Update the code once we have OAuth2 credentials
- Implement any of the 3 approaches above
- Set up PDF parsing if needed
