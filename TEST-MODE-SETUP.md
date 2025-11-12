# Europace TEST_MODUS Setup

## ✅ Current Configuration

We're correctly configured for **TEST_MODUS** (no real business):

```env
EUROPACE_TEST_MODE=true
```

This adds the header: `X-Europace-Vorgang: TEST_MODUS`

---

## What We Still Need

### 1. OAuth2 Test Credentials

Even in TEST_MODUS, we need OAuth2 authentication (not Basic Auth).

**For Testing, you need:**
- OAuth2 Client ID (test environment)
- OAuth2 Client Secret (test environment)
- Access Token with test scopes:
  - `baufinanzierung:echtgeschaeft` (even for test mode)
  - `baufinanzierung:vorgang:schreiben`
  - `unterlagen:dokument:schreiben`

**How to get test credentials:**
1. Go to Europace Developer Portal: https://developer.europace.de/
2. Create a test application
3. Get Client ID and Secret
4. Generate access token

---

## API Endpoints (Same for Test & Production)

### Vorgang Creation
```
POST https://baufinanzierung.api.europace.de/kundenangaben
Authorization: Bearer {test_access_token}
X-Europace-Vorgang: TEST_MODUS
```

### Document Upload
```
POST https://api.europace2.de/v2/dokumente
Authorization: Bearer {test_access_token}
```

---

## Test Mode Behavior

When using `X-Europace-Vorgang: TEST_MODUS`:
- ✅ Creates dummy Vorgänge in test environment
- ✅ No real business impact
- ✅ Can be deleted/modified freely
- ✅ Perfect for development and testing
- ❌ Not visible in production Europace

---

## What Needs to Change in Code

### 1. Switch from Basic Auth to OAuth2

**Current (.env):**
```env
EUROPACE_AUTH_TOKEN=NUdRS1BDRkk2SEhHRlBNNTpsVmZvRC15dllTeEltT2FPdkdBRHluZ2M=
```

**Needed (.env):**
```env
EUROPACE_CLIENT_ID=your_test_client_id
EUROPACE_CLIENT_SECRET=your_test_client_secret
EUROPACE_ACCESS_TOKEN=your_test_access_token
```

### 2. Update Endpoints

**File: `src/europace/kundenangaben.ts`**
- Change URL from `api.europace.de/v2/vorgaenge`
- To: `baufinanzierung.api.europace.de/kundenangaben`

**File: `src/europace/unterlagen.ts`**
- Change URL from `api.europace.de/v2/vorgaenge/{id}/unterlagen`
- To: `api.europace2.de/v2/dokumente`

### 3. Update Request Structure

Add full Kundenangaben structure with:
- `importMetadaten` (with TEST_MODUS context)
- `haushalte` with customer data
- `finanzierungsobjekt` with property details
- `finanzierungsbedarf` with financing needs

---

## Simplified Approach for Testing

Since we're in TEST_MODUS, I recommend **Option A: Minimal Data**:

### Step 1: Create Vorgang with Minimal Test Data
```json
{
  "importMetadaten": {
    "datenkontext": "TEST_MODUS",
    "externeVorgangsId": "SLACK_TEST_{{timestamp}}",
    "importquelle": "Slack Bot Test"
  },
  "kundenangaben": {
    "haushalte": [
      {
        "personen": [
          {
            "personendaten": {
              "vorname": "Test",
              "nachname": "User",
              "geburtsdatum": "1990-01-01"
            }
          }
        ]
      }
    ],
    "finanzierungsbedarf": {
      "finanzierungszweck": "KAUF",
      "kaufpreis": 300000,
      "eigenkapital": 60000
    }
  }
}
```

### Step 2: Upload PDF to Test Vorgang
```
file: (PDF binary)
caseId: (from step 1 response)
category: Selbstauskunft
displayName: Test Upload
```

---

## Next Steps

**To continue testing, we need:**

1. ✅ TEST_MODE configured (already done!)
2. ❌ OAuth2 test credentials
3. ❌ Updated endpoints in code
4. ❌ Updated request structure in code

**Can you:**
- Get OAuth2 test credentials from Europace Developer Portal?
- Or provide existing test Client ID, Secret, and Access Token?

Once we have the OAuth2 credentials, I can update the code and we'll be able to create test Vorgänge!
