# Production Deployment Guide

Complete guide for deploying the ZinsBoutique Slack Bot to Digital Ocean for 24/7 operation.

## Prerequisites

- DigitalOcean account
- Domain name (or subdomain)
- GitHub repository access
- Slack App credentials
- Europace API credentials
- Anthropic API key

## Quick Start

### 1. Create Digital Ocean Droplet

1. Go to: https://cloud.digitalocean.com/droplets/new
2. **Image:** Ubuntu 24.04 LTS
3. **Plan:** Basic - $6/month (1 GB RAM, 1 CPU)
4. **Datacenter:** Frankfurt (Germany) - for DSGVO compliance
5. **Authentication:** SSH keys (recommended)
6. **Hostname:** `zinsboutique-slack-bot`
7. Create Droplet → Note the IP address (e.g., `159.89.123.45`)

### 2. Configure DNS

Add an A record in your domain DNS:
```
Type: A
Name: europace-bot (or slack-bot)
Value: 159.89.123.45
TTL: 3600
```

Result: `europace-bot.yourdomain.com` → Your droplet

Wait 5-10 minutes for DNS propagation.

### 3. Connect to Your Server

```bash
ssh root@159.89.123.45
```

Or if using SSH keys:
```bash
ssh -i ~/.ssh/your-key root@159.89.123.45
```

### 4. Run Deployment Script

```bash
# Download and run the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/ZinsbouGIT/zinsboutique-slack-sa-europace-upload/main/deploy-to-production.sh

# Edit the script to set your domain
nano deploy.sh
# Change: DOMAIN="YOUR_DOMAIN_HERE"
# To: DOMAIN="europace-bot.yourdomain.com"

# Make executable and run
chmod +x deploy.sh
./deploy.sh
```

The script will pause and ask you to create the `.env` file.

### 5. Create Environment File

When prompted, create `/opt/zinsboutique-slack-bot/.env`:

```bash
sudo nano /opt/zinsboutique-slack-bot/.env
```

Add your credentials:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
SLACK_SIGNING_SECRET=your-actual-signing-secret
SLACK_CHANNEL_ID=C123456789

# Europace API Configuration
EUROPACE_API_URL=https://api.europace.de
EUROPACE_AUTH_TOKEN=your-base64-encoded-token

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

Save and exit (Ctrl+X, Y, Enter).

Press Enter in the deployment script to continue.

### 6. Update Slack App Request URL

1. Go to: https://api.slack.com/apps
2. Select your Slack App
3. Go to **Event Subscriptions**
4. Update **Request URL** to: `https://europace-bot.yourdomain.com/slack/events`
5. Verify the URL (should show ✓ Verified)
6. Save Changes

### 7. Test the Deployment

Upload a PDF to your Slack channel and watch it process!

## Manual Deployment (Alternative)

If you prefer step-by-step manual setup:

### 1. Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PM2

```bash
sudo npm install -g pm2
```

### 4. Install Nginx

```bash
sudo apt-get install -y nginx
```

### 5. Install Certbot (SSL)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 6. Setup Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 7. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/ZinsbouGIT/zinsboutique-slack-sa-europace-upload.git zinsboutique-slack-bot
cd zinsboutique-slack-bot
sudo chown -R $USER:$USER /opt/zinsboutique-slack-bot
```

### 8. Install Dependencies

```bash
npm install
```

### 9. Create .env File

```bash
nano .env
# Add your credentials (see above)
```

### 10. Build TypeScript

```bash
npm run build
```

### 11. Start with PM2

Using the ecosystem config:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy the command PM2 outputs and run it with sudo.

### 12. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/zinsboutique-slack-bot
```

Add:

```nginx
server {
    listen 80;
    server_name europace-bot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /slack/events {
        proxy_pass http://localhost:3000/slack/events;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/zinsboutique-slack-bot /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 13. Setup SSL Certificate

```bash
sudo certbot --nginx -d europace-bot.yourdomain.com
```

Follow the prompts:
- Email: your@email.com
- Agree to terms: Y
- Redirect HTTP to HTTPS: Y (recommended)

## Maintenance Commands

### Check Application Status

```bash
pm2 status
```

### View Logs

```bash
# Live logs
pm2 logs zinsboutique-slack-bot

# Last 100 lines
pm2 logs zinsboutique-slack-bot --lines 100

# Error logs only
pm2 logs zinsboutique-slack-bot --err

# Application logs (in logs/ directory)
tail -f /opt/zinsboutique-slack-bot/logs/combined.log
```

### Restart Application

```bash
pm2 restart zinsboutique-slack-bot
```

### Stop Application

```bash
pm2 stop zinsboutique-slack-bot
```

### Update Application

```bash
cd /opt/zinsboutique-slack-bot
git pull origin main
npm install
npm run build
pm2 restart zinsboutique-slack-bot
```

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### Monitor Server Resources

```bash
# CPU and memory usage
pm2 monit

# System resources
htop

# Disk usage
df -h
```

## Troubleshooting

### Bot Not Receiving Events

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs zinsboutique-slack-bot
   ```

2. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   tail -f /var/log/nginx/error.log
   ```

3. **Test endpoint:**
   ```bash
   curl https://europace-bot.yourdomain.com/health
   ```

4. **Verify Slack URL:**
   - Must be HTTPS
   - Must end with `/slack/events`
   - Check for SSL certificate errors

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Out of Memory

If the bot crashes with memory issues:

1. **Increase PM2 memory limit:**
   ```bash
   # Edit ecosystem.config.js
   max_memory_restart: '1G'  # Instead of 500M
   pm2 restart zinsboutique-slack-bot
   ```

2. **Upgrade droplet:**
   - Go to DigitalOcean dashboard
   - Resize droplet to 2GB RAM ($12/month)

### PDF Processing Failures

Check logs for API errors:

```bash
pm2 logs zinsboutique-slack-bot --lines 200 | grep ERROR
```

Common issues:
- Invalid Anthropic API key
- Europace API authentication failure
- Network connectivity issues

## Security Best Practices

### 1. Restrict SSH Access

```bash
# Disable password authentication (SSH keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 2. Setup Fail2Ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
# Setup automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. Monitor Failed Login Attempts

```bash
sudo journalctl -u ssh -n 50
```

## DSGVO Compliance Notes

- Server located in Frankfurt, Germany (EU)
- Logs stored for maximum 30 days (logrotate configured)
- PDF files processed in memory, not saved to disk
- Ensure .env file permissions: `chmod 600 .env`
- No PII in application logs (pseudonymization required - see README.md)

## Cost Estimate

- **DigitalOcean Droplet:** $6/month (1GB RAM)
- **Domain (if needed):** ~$12/year
- **Total:** ~$7/month

## Support

For issues:
- Check logs: `pm2 logs zinsboutique-slack-bot`
- Check application logs: `/opt/zinsboutique-slack-bot/logs/`
- Review README.md for troubleshooting
- GitHub repository: https://github.com/ZinsbouGIT/zinsboutique-slack-sa-europace-upload
