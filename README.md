# ZinsBoutique Selbstauskunft Slack → Europace Automation

**DSGVO-compliant Slack bot that extracts financial data from Selbstauskunft PDFs using Claude AI and automatically uploads structured data to Europace Kundenangaben API.**

## Overview

This bot monitors a Slack channel for Selbstauskunft PDF uploads, uses Claude AI to intelligently extract all financial data, and creates complete customer profiles in Europace with proper field mapping.

## ✅ Current Status: v1.0 - ANTRAGSTELLER Complete

**Fully implemented and verified:**
- **All ANTRAGSTELLER tab fields (Blocks 1-11)** mapped and tested
- **21/21 Block 7 critical fields** verified working
- AI extraction with temperature 0 for deterministic results
- Conditional field mapping (only populates found fields)
- Dual applicant support (Antragsteller 1 & 2)

**Pending implementation:**
- IMMOBILIE tab (Block 12) - Property/collateral data
- VORHABEN tab - Financing details

## Features

- 🤖 **AI-Powered PDF Extraction** - Claude Sonnet 4 intelligently extracts all financial data
- 📊 **Comprehensive Field Mapping** - All personal, employment, and financial fields
- 👥 **Dual Applicant Support** - Handles both Antragsteller 1 and Antragsteller 2
- 💰 **Complete Financial Data** (Block 7):
  - Assets: Bank accounts, securities, building savings, life insurance, other assets
  - Income: Employment, side income, pensions, alimony, variable income
  - Expenses: Rent, living costs, insurance, maintenance obligations
  - Liabilities: Installment loans, private loans, credit cards
- 🔍 **Field Verification System** - Automated validation of AI extraction vs. mapper
- 🔒 **DSGVO-Ready** - Prepared for compliant production deployment
- ✅ **Real-time Slack Updates** - Status messages in thread
- 🐳 **Docker Deployment Ready**

## Architecture

```
Slack Channel (PDF Upload)
    ↓
Slack Bot (Event Listener)
    ↓
Download PDF from Slack
    ↓
Claude AI PDF Extraction (50+ fields)
    ↓
TypeScript Mapper (conditional field mapping)
    ↓
Europace Kundenangaben API (Create/Update)
    ↓
Success/Error Message → Slack Thread
```

## Field Mapping Coverage

### Blocks 1-4: Personal Data
- Name, titles, contact information
- Address (current and previous)
- Nationality, residency status, birth country
- Marital status, family details

### Block 5: Retirement Situation
- Retirement start date
- Public and private pension amounts
- Post-retirement income

### Block 6: Children
- Number of children
- Child details (name, birth date, living situation)
- Child support payments

### Block 7: Financial Details (21 Critical Fields)

**Assets (Vermögen):**
- Bank and savings account balances with interest
- Securities/depot with dividends
- Building savings contracts (up to 3)
- Life insurance policies
- Other assets

**Income (Einnahmen):**
- Employment income (handled separately in Block 9)
- Side job income with descriptions
- Pensions and annuities
- Alimony received
- Variable income
- Other monthly income

**Expenses (Ausgaben):**
- Monthly rent/housing costs
- Living expenses (Lebenshaltungskosten)
- Private health insurance
- Maintenance obligations
- Other monthly expenses

**Liabilities (Verbindlichkeiten):**
- Installment loans with full details
- Private loans
- Credit cards

### Block 8: Bank Account
- IBAN and BIC for Europace payments

### Block 9: Employment
- Employment status (@type: "ANGESTELLTER")
- Employer details
- Income (net monthly, annual net/gross)
- Employment dates

### Block 10-11: Second Applicant
- Complete mapping of all 20+ fields for Antragsteller 2
- Same comprehensive coverage as primary applicant

## Prerequisites

- **Node.js 20+** (or Docker)
- **Slack App** with Bot Token and file permissions
- **Europace API credentials** (OAuth2)
- **Anthropic API Key** for Claude AI
- **Public URL** for Slack webhooks (Cloudflare Tunnel for development)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/Tim-Logiscale/zinsboutique-slack-sa-europace-upload.git
cd zinsboutique-slack-sa-europace-upload
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=C123456789

# Europace API Configuration
EUROPACE_API_URL=https://api.europace.de
EUROPACE_AUTH_TOKEN=your-base64-encoded-token

# Anthropic Claude AI
ANTHROPIC_API_KEY=your-anthropic-api-key

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
PORT=3000
```

### 3. Slack App Configuration

1. Go to https://api.slack.com/apps
2. **OAuth & Permissions** - Add Bot Token Scopes:
   - `files:read` - Read file information
   - `files:write` - Download files
   - `chat:write` - Send messages
3. **Event Subscriptions:**
   - Enable Events
   - Set Request URL: `https://your-tunnel-url.com/slack/events`
   - Subscribe to `file_shared` event
4. Install app to workspace
5. Copy credentials to `.env`

### 4. Europace API Setup

Get OAuth2 credentials from Europace and encode as Base64:

```bash
echo -n "username:password" | base64
```

Set as `EUROPACE_AUTH_TOKEN` in `.env`

## Running the Application

### Local Development with Cloudflare Tunnel

```bash
# Terminal 1: Start Cloudflare tunnel
cloudflare tunnel --url http://localhost:3000

# Terminal 2: Start the bot
npx ts-node src/index.ts
```

Update Slack Event Subscriptions URL with the Cloudflare URL.

### Production

```bash
# Build TypeScript
npm run build

# Start the bot
npm start
```

### Docker Deployment

```bash
docker-compose up -d
docker-compose logs -f
```

## Project Structure

```
zinsboutique-slack-sa-europace-upload/
├── src/
│   ├── slack/
│   │   ├── bot.ts              # Slack Bot setup
│   │   └── handlers.ts         # File upload handlers
│   ├── europace/
│   │   ├── kundenangaben.ts    # Europace customer data API
│   │   ├── unterlagen.ts       # Document upload API
│   │   └── oauth.ts            # OAuth2 authentication
│   ├── services/
│   │   ├── aiPdfParser.ts      # Claude AI PDF extraction
│   │   ├── europaceMapper.ts   # Data transformation (AI → Europace)
│   │   ├── pdfParser.ts        # PDF type definitions
│   │   ├── processor.ts        # Main orchestration
│   │   ├── europaceEnums.ts    # Europace API enums
│   │   └── enumMappers.ts      # Value mapping helpers
│   └── utils/
│       ├── config.ts           # Configuration management
│       └── logger.ts           # Logging setup
├── ANTRAGSTELLER-MAPPING-COMPLETE.md  # Field mapping documentation
├── EUROPACE-VOLLSTAENDIGE-JSON-STRUKTUR.json  # Reference payload
├── verify-field-mapping.ts     # Field verification script
├── .env.example                # Environment template
└── README.md                   # This file
```

## Usage

1. **Upload PDF** to monitored Slack channel
2. **Bot processes:**
   - Detects PDF upload
   - Downloads file from Slack
   - Extracts 50+ fields using Claude AI
   - Maps to Europace structure
   - Creates/updates Vorgang in Europace
3. **Receives confirmation** in Slack thread with Vorgang ID

Example success message:
```
✅ Successfully processed Selbstauskunft
👤 Applicant: Max Mustermann
🆔 Vorgang ID: V12345678
📊 Fields extracted: 32
✨ Processing time: 8.2s
```

## Field Verification

Run the verification script to ensure all AI-extracted fields are mapped:

```bash
npx ts-node verify-field-mapping.ts
```

This validates:
- All fields extracted by AI are used in the mapper
- All mapper fields are defined in AI extraction
- Block 7 critical fields checklist (21 fields)

## Development Workflow

### Adding New Fields

1. **Update AI Parser** (`src/services/aiPdfParser.ts`)
   - Add field to prompt with description and examples
   - Include German search terms

2. **Update TypeScript Interface** (`src/services/pdfParser.ts`)
   - Add field to `SelbstauskunftData` interface

3. **Update Mapper** (`src/services/europaceMapper.ts`)
   - Add conditional mapping: `...(extractedData.field && { ... })`

4. **Verify** with `verify-field-mapping.ts`

### Testing

Test with reference payload:
```bash
npx ts-node test-vollstaendige-payload.ts
```

## API Reference

### Europace Kundenangaben API

The mapper creates payloads matching the Europace Kundenangaben API structure with proper `@type` discriminators:

- Employment: `@type: "ANGESTELLTER"`
- Children: `@type: "VORHANDENE_KINDER"`
- Residency: `@type: "EU_BUERGER"`

Reference: `EUROPACE-VOLLSTAENDIGE-JSON-STRUKTUR.json`

## Conditional Field Mapping

**Important:** The mapper only populates fields that were found in the PDF. If Claude AI doesn't extract a field, it won't be included in the Europace payload.

This ensures:
- No false/empty data in Europace
- Respects what applicant provided
- Clean, accurate data submission

## Monitoring and Logs

Logs written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (with colors)

Set `LOG_LEVEL=debug` for verbose AI extraction logging.

## Error Handling

- API failures retried with exponential backoff
- AI extraction errors logged with full context
- User receives detailed error messages in Slack
- Non-PDF files rejected with warning

## DSGVO Compliance

**Prepared for compliant deployment:**
- Logger must pseudonymize PII (not yet implemented)
- PDF retention: Max 24 hours
- Log retention: Max 6 months
- AVV contracts required: Anthropic, Slack, Europace
- Server location: Germany/EU (recommend Hetzner Nürnberg)
- Claude AI EU-Region available from August 19, 2025

See deployment plan in previous project notes for full DSGVO setup.

## Troubleshooting

### Bot not receiving events
- Check Cloudflare tunnel is running
- Verify Slack Event Subscriptions URL
- Ensure bot is in the monitored channel

### AI extraction failing
- Verify `ANTHROPIC_API_KEY` is valid
- Check Claude AI API quota
- Enable debug logging: `LOG_LEVEL=debug`

### Field mapping errors
- Run `verify-field-mapping.ts`
- Check TypeScript compilation: `npm run build`
- Review `europaceMapper.ts` for typos

### Europace API errors
- Verify OAuth token is valid and not expired
- Check payload structure matches API requirements
- Enable detailed logging for API responses

## Security Notes

- Never commit `.env` file
- Use environment variables for all secrets
- Rotate API keys regularly
- Use HTTPS for production webhooks
- Review logs for PII before sharing

## Contributing

When adding new features:
1. Update field mapping for new Europace tabs
2. Run verification script
3. Update this README
4. Test with real PDFs
5. Commit with detailed message

## Support

For issues:
1. Check logs: `logs/combined.log`
2. Run verification: `verify-field-mapping.ts`
3. Enable debug logging
4. Review Europace API documentation

## License

ISC

## Credits

Built with Claude Code
https://claude.com/claude-code
