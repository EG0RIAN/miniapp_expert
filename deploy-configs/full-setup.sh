#!/bin/bash

# Complete server setup script
# Run this on the server to do everything at once

set -e

echo "🚀 Starting complete server setup..."
echo ""

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

# Create web directories
echo "📁 Creating web directories..."
mkdir -p /var/www/miniapp.expert
mkdir -p /var/www/demoapp.miniapp.expert
mkdir -p /home/miniapp_expert/deploy-configs

# Set permissions
chown -R www-data:www-data /var/www
chown -R root:root /home/miniapp_expert

echo ""
echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Upload your project files to /home/miniapp_expert/"
echo "2. Run setup-nginx.sh to configure nginx"
echo "3. Run setup-ssl.sh to configure SSL certificates"
echo "4. Setup and start the Telegram bot"

