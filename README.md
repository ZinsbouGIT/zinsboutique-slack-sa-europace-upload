# ZB-SA-SLACK-EUROPACE-UPLOAD

**ZinsBoutique Selbstauskunft Slack → Europace Upload Automation**

Automated Slack bot that monitors a dedicated channel for PDF uploads (Selbstauskunft) and automatically uploads them to Europace by creating a new Vorgang and attaching the document.

## Features

- 🤖 Automated Slack file monitoring
- 📄 PDF validation and download
- 🏦 Automatic Europace Vorgang creation
- 📎 Document upload to Europace
- ✅ Real-time status updates in Slack
- 🔄 Retry logic with exponential backoff
- 📝 Comprehensive logging
- 🐳 Docker deployment ready

## Architecture

```
Slack Channel (PDF Upload)
    ↓
Slack Bot (Event Listener)
    ↓
Download PDF from Slack
    ↓
Europace Kundenangaben API (Create Vorgang)
    ↓
Europace Unterlagen API (Upload Document)
    ↓
Success/Error Message → Slack Thread
```

## Prerequisites

- Node.js 20+ (or Docker)
- Slack App with Bot Token
- Europace API credentials
- Public URL for Slack webhooks (or ngrok for development)

## Setup

### 1. Clone and Install

```bash
cd /path/to/zinsboutique-sa-europace-upload
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

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

### 3. Slack App Configuration

1. Go to https://api.slack.com/apps
2. Select your app (or create a new one)
3. **OAuth & Permissions:**
   - Add Bot Token Scopes:
     - `files:read` - Read file information
     - `files:write` - Download files
     - `chat:write` - Send messages
     - `app_mentions:read` - Respond to mentions
   - Install app to workspace
   - Copy Bot User OAuth Token to `SLACK_BOT_TOKEN`

4. **Event Subscriptions:**
   - Enable Events
   - Set Request URL to: `https://your-domain.com/slack/events`
   - Subscribe to bot events:
     - `file_shared` - Triggered when files are uploaded
     - `app_mention` - For help/debug messages

5. **Basic Information:**
   - Copy Signing Secret to `SLACK_SIGNING_SECRET`

### 4. Europace API Setup

Your Europace credentials use Basic Authentication. The `EUROPACE_AUTH_TOKEN` should be base64 encoded in the format:

```
Authorization: Basic <base64(username:password)>
```

## Running the Application

### Local Development

```bash
# Build TypeScript
npm run build

# Start the bot
npm start

# Or run in development mode with auto-reload
npm run dev
```

### Docker Deployment

```bash
# Build and start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Or build manually:

```bash
# Build image
docker build -t europace-bot .

# Run container
docker run -d \
  --name europace-bot \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  europace-bot
```

## Usage

1. Upload a PDF to the monitored Slack channel
2. The bot will automatically:
   - Detect the PDF upload
   - Download the file
   - Create a new Vorgang in Europace
   - Upload the document to that Vorgang
   - Send a success message with Vorgang ID and Document ID

Example success message:
```
✅ Successfully uploaded to Europace
📄 File: Selbstauskunft_MusterKunde.pdf
🆔 Vorgang ID: `V12345678`
📎 Document ID: `D98765432`
⏰ Processed at: 2025-10-25T14:30:00.000Z
```

## Project Structure

```
zinsboutique-sa-europace-upload/
├── src/
│   ├── slack/
│   │   ├── bot.ts           # Slack Bot setup and event handlers
│   │   └── handlers.ts      # File upload handler logic
│   ├── europace/
│   │   ├── kundenangaben.ts # Europace Vorgang creation API
│   │   └── unterlagen.ts    # Europace document upload API
│   ├── services/
│   │   └── processor.ts     # Main orchestration service
│   ├── utils/
│   │   ├── config.ts        # Configuration management
│   │   └── logger.ts        # Winston logger setup
│   └── index.ts             # Application entry point
├── logs/                    # Application logs (auto-generated)
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (gitignored)
└── README.md              # This file
```

## API Endpoints

The application exposes the following endpoints:

- `POST /slack/events` - Slack event webhook
- `GET /health` - Health check endpoint (returns `200 OK`)

## Monitoring and Logs

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (with colors)

Log levels: `error`, `warn`, `info`, `debug`

Set `LOG_LEVEL=debug` in `.env` for verbose logging.

## Error Handling

The bot handles errors gracefully:
- API failures are retried up to 3 times with exponential backoff
- Errors are logged with full context
- User receives error message in Slack thread
- Non-PDF files are rejected with a warning message

## Customization

### Adjusting Europace API Endpoints

The Europace API clients use placeholder endpoints. Adjust these in:
- `src/europace/kundenangaben.ts:55` - Vorgang creation endpoint
- `src/europace/unterlagen.ts:69` - Document upload endpoint

### Changing Document Type

Update the document type in `src/europace/unterlagen.ts:64`:
```typescript
formData.append('dokumentart', 'SELBSTAUSKUNFT'); // Change as needed
```

## Troubleshooting

### Bot not receiving events
- Verify Event Subscriptions URL is correct
- Check Slack signing secret matches `.env`
- Ensure bot is invited to the channel
- Check logs for authentication errors

### Upload failures
- Verify Europace credentials are correct
- Check Europace API documentation for correct endpoints
- Enable debug logging: `LOG_LEVEL=debug`
- Review logs in `logs/error.log`

### Docker issues
- Check container logs: `docker-compose logs -f`
- Verify `.env` file exists and is readable
- Ensure port 3000 is not in use
- Check health endpoint: `curl http://localhost:3000/health`

## Security Notes

- Never commit `.env` file to version control
- Store credentials securely
- Use HTTPS for production webhook URLs
- Rotate Slack tokens regularly
- Restrict Slack app permissions to minimum required

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run build
```

## License

ISC

## Support

For issues or questions, please contact the development team or check the logs at `logs/combined.log`.
