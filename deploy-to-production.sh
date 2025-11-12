#!/bin/bash

#############################################################
# Production Deployment Script for Digital Ocean
# ZinsBoutique Slack SA Europace Upload Bot
#############################################################

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="YOUR_DOMAIN_HERE"  # e.g., europace-bot.zinsboutique.de
APP_NAME="zinsboutique-slack-bot"
REPO_URL="https://github.com/ZinsbouGIT/zinsboutique-slack-sa-europace-upload.git"

echo -e "${GREEN}Step 1: System Update${NC}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "${GREEN}Step 2: Install Node.js 20.x${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo -e "${GREEN}Step 3: Install PM2 (Process Manager)${NC}"
sudo npm install -g pm2

echo -e "${GREEN}Step 4: Install Nginx${NC}"
sudo apt-get install -y nginx

echo -e "${GREEN}Step 5: Install Certbot (for SSL)${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}Step 6: Setup Firewall${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}Step 7: Clone Repository${NC}"
cd /opt
sudo git clone $REPO_URL $APP_NAME
cd $APP_NAME
sudo chown -R $USER:$USER /opt/$APP_NAME

echo -e "${GREEN}Step 8: Install Dependencies${NC}"
npm install

echo -e "${GREEN}Step 9: Setup Environment Variables${NC}"
echo -e "${YELLOW}Please create /opt/$APP_NAME/.env file with your credentials${NC}"
echo -e "${YELLOW}Use: sudo nano /opt/$APP_NAME/.env${NC}"
echo ""
echo "Required variables:"
echo "  SLACK_BOT_TOKEN=xoxb-..."
echo "  SLACK_SIGNING_SECRET=..."
echo "  SLACK_CHANNEL_ID=C..."
echo "  EUROPACE_API_URL=https://api.europace.de"
echo "  EUROPACE_AUTH_TOKEN=..."
echo "  ANTHROPIC_API_KEY=..."
echo "  NODE_ENV=production"
echo "  LOG_LEVEL=info"
echo "  PORT=3000"
echo ""
read -p "Press Enter after you've created the .env file..."

echo -e "${GREEN}Step 10: Build TypeScript${NC}"
npm run build

echo -e "${GREEN}Step 11: Configure PM2${NC}"
pm2 start dist/index.js --name $APP_NAME --env production
pm2 save
pm2 startup | tail -n 1 | sudo bash

echo -e "${GREEN}Step 12: Configure Nginx${NC}"
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Slack events endpoint
    location /slack/events {
        proxy_pass http://localhost:3000/slack/events;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}Step 13: Setup SSL Certificate${NC}"
if [ "$DOMAIN" != "YOUR_DOMAIN_HERE" ]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    echo -e "${GREEN}SSL Certificate installed!${NC}"
else
    echo -e "${YELLOW}Skipping SSL - Please set DOMAIN variable in script${NC}"
fi

echo -e "${GREEN}Step 14: Setup Log Rotation${NC}"
sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
/opt/$APP_NAME/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Update Slack App Request URL to: https://$DOMAIN/slack/events"
echo "2. Check application status: pm2 status"
echo "3. View logs: pm2 logs $APP_NAME"
echo "4. Restart app: pm2 restart $APP_NAME"
echo ""
echo "🔧 Useful Commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs $APP_NAME      - View live logs"
echo "  pm2 restart $APP_NAME   - Restart app"
echo "  pm2 stop $APP_NAME      - Stop app"
echo "  sudo systemctl status nginx - Check nginx status"
echo ""
echo "🌍 Your bot is now running at: https://$DOMAIN"
