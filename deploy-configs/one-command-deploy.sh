#!/bin/bash

# One command deployment script
# Run this on the server after uploading files

set -e

echo "🚀 MiniApp Expert - One Command Deploy"
echo "======================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (or use sudo)"
    exit 1
fi

# Check if files are extracted
if [ ! -d "/home/miniapp_expert/deploy-configs" ]; then
    echo "❌ deploy-configs directory not found!"
    echo "Please extract miniapp-deploy.tar.gz first:"
    echo "  cd /home/miniapp_expert"
    echo "  tar -xzf miniapp-deploy.tar.gz"
    exit 1
fi

cd /home/miniapp_expert

# Make all scripts executable
chmod +x deploy-configs/*.sh

# Step 1: Full server setup
echo ""
echo "STEP 1/3: Setting up server..."
echo "------------------------------"
./deploy-configs/full-setup.sh

# Step 2: Configure nginx
echo ""
echo "STEP 2/3: Configuring nginx..."
echo "------------------------------"
./deploy-configs/setup-nginx.sh

# Wait a moment for nginx to be ready
sleep 2

# Step 3: Setup SSL certificates
echo ""
echo "STEP 3/3: Setting up SSL certificates..."
echo "----------------------------------------"

# Check if domains are pointing to this server
echo "Checking DNS records..."
SERVER_IP=$(curl -s ifconfig.me)
MINIAPP_IP=$(dig +short miniapp.expert | head -n1)
DEMOAPP_IP=$(dig +short demoapp.miniapp.expert | head -n1)

echo "Server IP: $SERVER_IP"
echo "miniapp.expert points to: $MINIAPP_IP"
echo "demoapp.miniapp.expert points to: $DEMOAPP_IP"

if [ "$SERVER_IP" != "$MINIAPP_IP" ] || [ "$SERVER_IP" != "$DEMOAPP_IP" ]; then
    echo ""
    echo "⚠️  WARNING: DNS records don't match server IP!"
    echo "Make sure these domains point to $SERVER_IP:"
    echo "  - miniapp.expert"
    echo "  - www.miniapp.expert"  
    echo "  - demoapp.miniapp.expert"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment stopped. Fix DNS and try again."
        exit 1
    fi
fi

./deploy-configs/setup-ssl.sh

# Copy files to web directories
echo ""
echo "📋 Copying files to web directories..."
cp -r site/* /var/www/miniapp.expert/
cp -r dist/* /var/www/demoapp.miniapp.expert/
chown -R www-data:www-data /var/www/

# Final nginx reload
systemctl reload nginx

echo ""
echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Your sites are now live:"
echo "  🌐 https://miniapp.expert"
echo "  🌐 https://www.miniapp.expert"
echo "  📱 https://demoapp.miniapp.expert"
echo ""
echo "Next steps:"
echo "1. Visit sites in browser to verify"
echo "2. Setup Telegram bot:"
echo "     cd /home/miniapp_expert/bot"
echo "     nano .env  # Add BOT_TOKEN and WEBAPP_URL"
echo "     cd /home/miniapp_expert"
echo "     ./deploy-configs/bot-setup.sh"
echo ""
echo "Useful commands:"
echo "  systemctl status nginx  - Check nginx status"
echo "  certbot certificates    - Check SSL certificates"
echo "  pm2 status             - Check bot status (after setup)"
echo ""

