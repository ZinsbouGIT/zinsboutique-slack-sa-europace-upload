# Europace Document Upload Request

## Overview
Document uploads use **multipart/form-data** (not JSON) because we're uploading binary PDF files.

## Step 2: Upload Document to Vorgang

### Endpoint
```
POST https://api.europace.de/v2/vorgaenge/{vorgangsnummer}/unterlagen
```

### Headers
```
Authorization: Basic NUdRS1BDRkk2SEhHRlBNNTpsVmZvRC15dllTeEltT2FPdkdBRHluZ2M=
X-Europace-Vorgang: TEST_MODUS
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Accept: application/json
```

### Request Body (multipart/form-data)
```
------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="Riemer Selbstauskunft_youfinance.pdf"
Content-Type: application/pdf

[Binary PDF data here...]
------WebKitFormBoundary...
Content-Disposition: form-data; name="dokumentart"

SELBSTAUSKUNFT
------WebKitFormBoundary...
Content-Disposition: form-data; name="name"

Riemer Selbstauskunft_youfinance.pdf
------WebKitFormBoundary...--
```

### Form Fields
| Field | Value | Description |
|-------|-------|-------------|
| `file` | (binary) | The PDF file content |
| `dokumentart` | `SELBSTAUSKUNFT` | Type of document |
| `name` | (string) | File name |

### Example with curl
```bash
curl -X POST \
  https://api.europace.de/v2/vorgaenge/ABC123/unterlagen \
  -H "Authorization: Basic YOUR_TOKEN" \
  -H "X-Europace-Vorgang: TEST_MODUS" \
  -F "file=@/path/to/file.pdf" \
  -F "dokumentart=SELBSTAUSKUNFT" \
  -F "name=file.pdf"
```

### Expected Response
```json
{
  "dokumentId": "DOC_12345",
  "status": "uploaded",
  "fileName": "Riemer Selbstauskunft_youfinance.pdf"
}
```

## Current Implementation Summary

1. **Vorgang Creation** (JSON)
   - Endpoint: `POST /v2/vorgaenge`
   - Body: `{"finanzierungsBedarf": {"finanzierungszweck": "KAUF"}}`
   - Returns: `{"vorgangsnummer": "ABC123"}`

2. **Document Upload** (multipart/form-data)
   - Endpoint: `POST /v2/vorgaenge/ABC123/unterlagen`
   - Body: multipart with PDF file + metadata
   - Returns: `{"dokumentId": "DOC_12345"}`

## Notes
- The document upload endpoint requires a valid `vorgangsnummer` from step 1
- `dokumentart` can be different types: SELBSTAUSKUNFT, EINKOMMENSNACHWEIS, etc.
- File must be in PDF format
- Maximum file size depends on your Europace API limits
