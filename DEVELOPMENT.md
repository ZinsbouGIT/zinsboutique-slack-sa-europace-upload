# Development & Update Guide

Complete guide for working on, testing, and deploying updates to the ZinsBoutique Slack Bot.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Development Setup](#development-setup)
3. [Making Changes](#making-changes)
4. [Testing Locally](#testing-locally)
5. [Deploying to Server](#deploying-to-server)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Update Server (Production/PM2)
```bash
# On your server
cd /opt/zinsboutique-slack-bot
git pull origin main
npm install
npm run build
pm2 restart 0
pm2 logs 0 --lines 50
```

### Update Server (Docker)
```bash
# On your server
cd /path/to/zinsboutique-sa-europace-upload
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
docker-compose logs -f
```

### Local Development
```bash
# On your local machine
git pull origin main
npm install
npm run build
npm run dev  # or: npx ts-node src/index.ts
```

---

## Development Setup

### 1. Prerequisites

- **Node.js 20+** installed locally
- **Git** configured with GitHub access
- **Code editor** (VS Code recommended)
- Access to:
  - GitHub repository
  - Server (SSH access)
  - Slack workspace (for testing)
  - Anthropic API key
  - Europace API credentials

### 2. Clone Repository

```bash
git clone https://github.com/ZinsbouGIT/zinsboutique-slack-sa-europace-upload.git
cd zinsboutique-sa-europace-upload
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

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
EUROPACE_API_URL=https://baufinanzierung.api.europace.de
EUROPACE_TOKEN_URL=https://api.europace.de/auth/token
EUROPACE_CLIENT_ID=your-client-id
EUROPACE_CLIENT_SECRET=your-client-secret
EUROPACE_TEST_MODE=true  # ← Set to false for ECHT_GESCHAEFT

# AI Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your-key

# Application Configuration
NODE_ENV=development
LOG_LEVEL=debug  # Use 'debug' for development
PORT=3000
```

### 5. Build TypeScript

```bash
npm run build
```

### 6. Run Locally

```bash
# Development with auto-reload
npm run dev

# Or manually
npx ts-node src/index.ts
```

---

## Making Changes

### Workflow Overview

```
1. Create/switch to feature branch
2. Make code changes
3. Test locally
4. Commit changes
5. Push to GitHub
6. Deploy to server
7. Test in production
8. Monitor logs
```

### Step-by-Step

#### 1. Create Feature Branch (Optional but Recommended)

```bash
git checkout -b feature/your-feature-name
```

Or work directly on `main` for quick fixes.

#### 2. Make Code Changes

**Key files to know:**

- **AI Extraction Prompts:** `src/services/aiPdfParser.ts`
  - Update field descriptions
  - Add new fields to extract
  - Modify extraction instructions

- **Data Mapping:** `src/services/europaceMapper.ts`
  - Map extracted data to Europace structure
  - Add conditional field logic
  - Clean and transform data

- **Type Definitions:** `src/services/pdfParser.ts`
  - Add new field types
  - Update interfaces

- **Enum Mappers:** `src/services/enumMappers.ts`
  - Convert German values to Europace enums
  - Date formatting functions
  - Number parsing functions

#### 3. Common Change Types

##### Adding a New Field

**Example:** Add `hausnummer` (house number) extraction

1. **Update AI Parser** (`src/services/aiPdfParser.ts`):
   ```typescript
   "hausnummer": "House number (e.g., 42, 10a, 15-17)",
   ```

2. **Update Interface** (`src/services/pdfParser.ts`):
   ```typescript
   export interface SelbstauskunftData {
     // ...
     hausnummer?: string;
     // ...
   }
   ```

3. **Update Mapper** (`src/services/europaceMapper.ts`):
   ```typescript
   anschrift: {
     strasse: extractedData.strasse,
     ...(extractedData.hausnummer && { hausnummer: extractedData.hausnummer }),
     // ...
   }
   ```

##### Fixing Date Format Issues

Edit `src/services/aiPdfParser.ts` and strengthen the instruction:

```typescript
"beschaeftigtSeit": "🔴 CRITICAL: Employed since YYYY-MM-DD (PDF shows DD.MM.YYYY - FIRST number is DAY! Example: 01.07.2023 means 1st of JULY → 2023-07-01, NOT January!)",
```

##### Improving AI Extraction Accuracy

Add more context and examples:

```typescript
// BEFORE:
"familienstand": "Marital status",

// AFTER:
"familienstand": "🔴 CRITICAL: LEDIG/VERHEIRATET/GESCHIEDEN/VERWITWET - Look VERY CAREFULLY at which checkbox is MARKED (✓ or X). If unmarried/single, it is LEDIG, NOT VERHEIRATET!",
```

#### 4. Build and Test

```bash
# Compile TypeScript
npm run build

# Check for errors
npx tsc --noEmit
```

---

## Testing Locally

### 1. Local Testing with Cloudflare Tunnel

**Terminal 1: Start Cloudflare Tunnel**
```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the generated URL (e.g., `https://random-name.trycloudflare.com`)

**Terminal 2: Start the Bot**
```bash
npx ts-node src/index.ts
```

**Update Slack Event URL:**
1. Go to https://api.slack.com/apps
2. Select your app
3. **Event Subscriptions** → Update Request URL
4. Set to: `https://random-name.trycloudflare.com/slack/events`
5. Verify (should show ✓)

**Test:** Upload a PDF to your Slack channel.

### 2. Test Specific Functions

#### Test cleanPayload Function

Create `test-cleanup.js`:
```javascript
const { cleanPayload } = require('./dist/services/europaceMapper');

const test = {
  bausparvertraege: [{}],
  ratenkredite: [{ restschuld: 5000 }, {}]
};

console.log('Result:', JSON.stringify(cleanPayload(test), null, 2));
```

Run:
```bash
node test-cleanup.js
```

#### Test Date Parsing

```typescript
import { normalizeDate } from './src/services/enumMappers';

console.log(normalizeDate('01.07.2023')); // Should output: 2023-07-01
console.log(normalizeDate('15.03.1985')); // Should output: 1985-03-15
```

### 3. Verify Field Mapping

Run the verification script:
```bash
npx ts-node verify-field-mapping.ts
```

Expected output:
```
✅ All AI fields are used in mapper
✅ All mapper fields are defined in AI
✅ Block 7 critical fields: 21/21
```

---

## Deploying to Server

### Prerequisites

- SSH access to server
- Server is running Ubuntu with PM2 or Docker
- Git configured on server

### Deployment Method 1: PM2 (Current Setup)

#### Step 1: Commit and Push to GitHub

```bash
# Check what changed
git status

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "fix: Improve German date parsing for beschaeftigtSeit field

- Strengthen AI instructions with explicit DD.MM.YYYY format
- Add example: 01.07.2023 → 2023-07-01 (NOT 2023-01-07)
- Emphasize FIRST number is DAY, not month

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

#### Step 2: SSH into Server

```bash
ssh root@zb-sa-slack-europace-upload
```

Or using hostname:
```bash
ssh root@your-server.yourdomain.com
```

#### Step 3: Update Application

```bash
# Navigate to project directory
cd /opt/zinsboutique-slack-bot

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Build TypeScript
npm run build

# Restart the application
pm2 restart 0

# Verify it's running
pm2 status
```

#### Step 4: Monitor Deployment

```bash
# Watch live logs
pm2 logs 0 --lines 50

# Or check specific logs
tail -f logs/combined.log
```

#### Step 5: Test in Production

Upload a test PDF to your Slack channel and verify:
1. Bot processes the file
2. No errors in logs
3. Data is correctly extracted
4. Europace Vorgang is created

### Deployment Method 2: Docker

#### Step 1: Commit and Push (Same as PM2)

```bash
git add -A
git commit -m "Your commit message"
git push origin main
```

#### Step 2: SSH into Server

```bash
ssh your-user@your-server
```

#### Step 3: Update Docker Container

```bash
# Navigate to project directory
cd /path/to/zinsboutique-sa-europace-upload

# Pull latest changes
git pull origin main

# Stop current containers
docker-compose down

# Rebuild images with new code
docker-compose build

# Start containers in detached mode
docker-compose up -d

# Check status
docker-compose ps
```

#### Step 4: Monitor Deployment

```bash
# Watch live logs
docker-compose logs -f

# Or specific container
docker-compose logs -f app

# Check last 100 lines
docker-compose logs --tail=100
```

---

## Monitoring & Debugging

### Check Application Status

#### PM2:
```bash
# Application status
pm2 status

# Detailed info
pm2 info 0

# Memory and CPU usage
pm2 monit
```

#### Docker:
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Container health
docker inspect zinsboutique-slack-bot
```

### View Logs

#### PM2:
```bash
# Live logs (all)
pm2 logs 0

# Last 100 lines
pm2 logs 0 --lines 100

# Error logs only
pm2 logs 0 --err

# Application logs
tail -f /opt/zinsboutique-slack-bot/logs/combined.log
tail -f /opt/zinsboutique-slack-bot/logs/error.log
```

#### Docker:
```bash
# Live logs
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50

# Specific container
docker-compose logs -f app
```

### Debug Mode

Enable detailed logging:

1. **Edit `.env` on server:**
   ```bash
   nano /opt/zinsboutique-slack-bot/.env
   ```

2. **Change LOG_LEVEL:**
   ```env
   LOG_LEVEL=debug
   ```

3. **Restart:**
   ```bash
   pm2 restart 0
   # or
   docker-compose restart
   ```

### Search Logs for Errors

```bash
# PM2
pm2 logs 0 --lines 500 | grep ERROR
pm2 logs 0 --lines 500 | grep "failed"

# Docker
docker-compose logs --tail=500 | grep ERROR

# Application logs
grep ERROR /opt/zinsboutique-slack-bot/logs/combined.log
```

---

## Common Tasks

### 1. Switch Between TEST_MODUS and ECHT_GESCHAEFT

#### Check Current Mode

On server:
```bash
cat /opt/zinsboutique-slack-bot/.env | grep EUROPACE_TEST_MODE
```

#### Switch to TEST_MODUS (Safe Testing)

```bash
nano /opt/zinsboutique-slack-bot/.env
```

Set:
```env
EUROPACE_TEST_MODE=true
```

Restart:
```bash
pm2 restart 0
```

#### Switch to ECHT_GESCHAEFT (Real Transactions)

⚠️ **WARNING: Only use for production!**

```bash
nano /opt/zinsboutique-slack-bot/.env
```

Set:
```env
EUROPACE_TEST_MODE=false
```

Restart:
```bash
pm2 restart 0
```

### 2. Update Node.js Dependencies

```bash
cd /opt/zinsboutique-slack-bot

# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (be careful!)
npm update

# Rebuild and restart
npm run build
pm2 restart 0
```

### 3. View Europace Payload

Check what JSON was sent to Europace:

Look for uploaded JSON files in Slack thread (bot uploads payload for debugging).

Or check logs:
```bash
pm2 logs 0 --lines 200 | grep "payload"
```

### 4. Roll Back to Previous Version

```bash
cd /opt/zinsboutique-slack-bot

# Check commit history
git log --oneline -10

# Roll back to specific commit
git checkout abc1234

# Rebuild and restart
npm run build
pm2 restart 0

# Return to latest
git checkout main
npm run build
pm2 restart 0
```

### 5. Clear Logs

```bash
# PM2 logs
pm2 flush

# Application logs
rm /opt/zinsboutique-slack-bot/logs/*.log

# Docker logs
docker-compose logs --no-log-prefix > /dev/null
```

### 6. Restart Everything

#### PM2:
```bash
pm2 restart all
pm2 save
```

#### Docker:
```bash
docker-compose restart
```

#### Full Server Reboot:
```bash
sudo reboot
```

---

## Troubleshooting

### Issue: Bot Not Receiving Slack Events

**Symptoms:**
- Upload PDF but bot doesn't respond
- No logs showing file upload

**Solutions:**

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs 0
   ```

2. **Verify Slack Event URL:**
   - Go to https://api.slack.com/apps
   - Check **Event Subscriptions** → Request URL
   - Should be: `https://your-domain.com/slack/events`
   - Must show ✓ Verified

3. **Test endpoint directly:**
   ```bash
   curl https://your-domain.com/health
   ```

4. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 'Nginx Full'
   ```

### Issue: German Date Format Still Wrong

**Symptoms:**
- `01.07.2023` becomes `2023-01-07` (wrong month)

**Solutions:**

1. **Check AI extraction prompt:**
   ```bash
   grep "beschaeftigtSeit" src/services/aiPdfParser.ts
   ```

   Should include explicit example like:
   ```
   Example: 01.07.2023 means 1st of JULY → 2023-07-01, NOT January!
   ```

2. **Test normalizeDate function:**
   ```typescript
   import { normalizeDate } from './src/services/enumMappers';
   console.log(normalizeDate('01.07.2023')); // Should be: 2023-07-01
   ```

3. **Enable debug logging** to see what AI extracted:
   ```env
   LOG_LEVEL=debug
   ```

### Issue: Familienstand Always VERHEIRATET

**Symptoms:**
- AI extracts VERHEIRATET even when person is LEDIG

**Solutions:**

1. **Strengthen AI prompt:**
   ```typescript
   "familienstand": "🔴 CRITICAL: LEDIG/VERHEIRATET/... - Look VERY CAREFULLY at which checkbox is MARKED (✓ or X). If unmarried/single, it is LEDIG, NOT VERHEIRATET!"
   ```

2. **Check PDF quality:**
   - Ensure checkboxes are clear
   - Verify PDF is not scanned at low resolution

3. **Review extraction logs:**
   ```bash
   pm2 logs 0 | grep familienstand
   ```

### Issue: Empty Arrays with [{}]

**Symptoms:**
- Payload contains `"bausparvertraege": [{}]`

**Solutions:**

This should be fixed with the `cleanPayload()` function. Verify:

```bash
grep -A 10 "cleanPayload" src/services/europaceMapper.ts
```

Should filter empty objects from arrays.

### Issue: BIC Not Auto-Looked Up

**Symptoms:**
- IBAN present but BIC missing in payload

**Solutions:**

1. **Check BIC lookup function:**
   ```bash
   grep -A 20 "enrichWithBIC" src/services/europaceMapper.ts
   ```

2. **Test IBAN manually:**
   ```bash
   curl "https://openiban.com/validate/DE89370400440532013000?getBIC=true"
   ```

3. **Check logs for BIC lookup messages:**
   ```bash
   pm2 logs 0 | grep "\[BIC\]"
   ```

### Issue: TypeScript Compilation Errors

**Symptoms:**
- `npm run build` fails with errors

**Solutions:**

1. **Install TypeScript:**
   ```bash
   npm install typescript ts-node --save-dev
   ```

2. **Clean build:**
   ```bash
   rm -rf dist/
   rm -rf node_modules/
   npm install
   npm run build
   ```

3. **Check specific errors:**
   ```bash
   npx tsc --noEmit
   ```

---

## Development Best Practices

### Git Commit Messages

Use clear, descriptive commit messages:

```bash
# Good:
git commit -m "fix: Correct German date parsing for employment start date"
git commit -m "feat: Add automatic BIC lookup from IBAN"
git commit -m "docs: Update deployment guide with Docker instructions"

# Bad:
git commit -m "fixed bug"
git commit -m "update"
git commit -m "changes"
```

### Testing Before Deploy

**Checklist:**
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Changes tested locally with real PDF
- [ ] Logs reviewed for errors
- [ ] Field verification passes (`npx ts-node verify-field-mapping.ts`)
- [ ] Git commit message is descriptive

### Code Review Checklist

Before pushing to production:

- [ ] No sensitive data (API keys, passwords) in code
- [ ] Conditional field mapping used (`&&` checks)
- [ ] German format conversions are correct
- [ ] Enum mappings match Europace API
- [ ] Error handling in place
- [ ] Logging added for debugging

---

## File Structure Reference

```
/opt/zinsboutique-slack-bot/          # Server deployment directory
├── src/
│   ├── services/
│   │   ├── aiPdfParser.ts           # ← Edit AI extraction prompts here
│   │   ├── europaceMapper.ts        # ← Edit data mapping here
│   │   ├── enumMappers.ts           # ← Edit value conversions here
│   │   └── pdfParser.ts             # ← Edit TypeScript interfaces here
│   ├── utils/
│   │   ├── bicLookup.ts             # BIC lookup functionality
│   │   ├── config.ts                # Configuration management
│   │   └── logger.ts                # Logging setup
│   └── index.ts                      # Main entry point
├── dist/                             # Compiled JavaScript (auto-generated)
├── logs/                             # Application logs
│   ├── combined.log                 # All logs
│   └── error.log                    # Errors only
├── .env                              # Environment variables (NEVER commit!)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── ecosystem.config.js               # PM2 config
```

---

## Support & Resources

- **README.md** - Project overview and features
- **DEPLOYMENT.md** - Production deployment guide
- **ANTRAGSTELLER-MAPPING-COMPLETE.md** - Field mapping documentation
- **EUROPACE-VOLLSTAENDIGE-JSON-STRUKTUR.json** - Reference payload

**Need Help?**

1. Check logs first: `pm2 logs 0 --lines 200`
2. Search this guide for your issue
3. Review Europace API documentation
4. Check GitHub issues

---

**Last Updated:** 2025-11-13
**Version:** 1.0
