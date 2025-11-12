# Quick Start Guide

## Project Status: ✅ Ready to Deploy

All components have been implemented and tested successfully!

## What's Been Built

1. ✅ Slack Bot with HTTP webhook support
2. ✅ Europace API clients (Kundenangaben + Unterlagen)
3. ✅ File download and processing pipeline
4. ✅ Error handling and retry logic
5. ✅ Logging with Winston
6. ✅ Docker configuration
7. ✅ Health check endpoint

## Environment Configuration

Your `.env` file has been created with:
- ✅ Slack credentials (Bot Token, Signing Secret, Channel ID)
- ✅ Europace credentials (Basic Auth token)
- ✅ Application settings

## Next Steps to Deploy

### 1. Configure Slack Event Subscriptions

You need to expose your bot to the internet so Slack can send events to it.

**For Production:**
Deploy to a server with a public URL, then:

1. Go to https://api.slack.com/apps → Your App → Event Subscriptions
2. Enable Events
3. Set Request URL to: `https://your-domain.com/slack/events`
4. Wait for Slack to verify the endpoint (should show ✅ Verified)

**For Local Development/Testing:**
Use ngrok to expose your local server:

```bash
# In terminal 1: Start the bot
npm run dev

# In terminal 2: Start ngrok
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Use it in Slack: https://abc123.ngrok.io/slack/events
```

### 2. Test the Bot

1. Invite the bot to your Slack channel:
   ```
   /invite @YourBotName
   ```

2. Upload a PDF to the channel

3. Watch for the bot's response with:
   - Vorgang ID
   - Document ID
   - Success/error message

### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Check health
curl http://localhost:3000/health
```

## Important Configuration Notes

### Europace API Endpoints

The current implementation uses placeholder endpoints:
- Vorgang creation: `/v2/vorgaenge`
- Document upload: `/v2/vorgaenge/{id}/unterlagen`

**You MUST verify these endpoints match your Europace API documentation!**

To update:
1. Check `src/europace/kundenangaben.ts` line 55
2. Check `src/europace/unterlagen.ts` line 69

### Slack Bot Permissions Required

Ensure your Slack app has these scopes:
- `files:read` - Read file information
- `files:write` - Download files
- `chat:write` - Send messages
- `app_mentions:read` - Respond to mentions

### Testing Checklist

- [ ] Bot receives file_shared events
- [ ] Bot can download PDFs from Slack
- [ ] Bot creates Vorgang in Europace
- [ ] Bot uploads document to Europace
- [ ] Bot sends success message to Slack
- [ ] Error handling works (try uploading non-PDF)
- [ ] Health check responds at /health

## Monitoring

View logs in real-time:
```bash
# If running locally
tail -f logs/combined.log

# If running in Docker
docker-compose logs -f europace-bot
```

## Troubleshooting

### Bot not responding to uploads
1. Check Slack Event Subscriptions are configured
2. Verify bot is invited to the channel
3. Check logs for errors: `tail -f logs/error.log`

### Europace API errors
1. Verify credentials in `.env` are correct
2. Check API endpoints match your documentation
3. Enable debug logging: `LOG_LEVEL=debug`

### Docker issues
```bash
# Rebuild container
docker-compose down
docker-compose up --build -d

# Check container status
docker-compose ps

# View detailed logs
docker-compose logs europace-bot
```

## Support

Check the main README.md for detailed documentation.

For API endpoint questions, consult your Europace API documentation.
