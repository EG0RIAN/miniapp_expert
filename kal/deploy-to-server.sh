#!/bin/bash

# Deployment script for MiniApp Expert
# Server: 195.2.73.224
# User: root
# Domains:
#   - miniapp.expert (static site)
#   - www.miniapp.expert (static site)
#   - demoapp.miniapp.expert (React app)

set -e

SERVER="195.2.73.224"
USER="root"
REMOTE_DIR="/home/miniapp_expert"

echo "🚀 Starting deployment to $SERVER..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build React app locally
echo -e "${BLUE}📦 Building React app...${NC}"
npm install
npm run build

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
tar -czf deploy.tar.gz \
    dist/ \
    site/ \
    bot/ \
    package.json \
    package-lock.json \
    deploy-configs/

# Upload to server
echo -e "${BLUE}📤 Uploading to server...${NC}"
scp deploy.tar.gz ${USER}@${SERVER}:${REMOTE_DIR}/

# Execute remote deployment script
echo -e "${BLUE}🔧 Executing remote deployment...${NC}"
ssh ${USER}@${SERVER} << 'ENDSSH'
set -e

cd /home/miniapp_expert

# Extract files
echo "📦 Extracting files..."
tar -xzf deploy.tar.gz
rm deploy.tar.gz

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📥 Installing nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📥 Installing certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

# Install PM2 for running the app
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

# Create web directories
echo "📁 Creating web directories..."
mkdir -p /var/www/miniapp.expert
mkdir -p /var/www/demoapp.miniapp.expert

# Copy static site
echo "📋 Copying static site..."
cp -r site/* /var/www/miniapp.expert/

# Copy React app build
echo "📋 Copying React app..."
cp -r dist/* /var/www/demoapp.miniapp.expert/

# Set permissions
chown -R www-data:www-data /var/www/miniapp.expert
chown -R www-data:www-data /var/www/demoapp.miniapp.expert

echo "✅ Files deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure nginx (run setup-nginx.sh)"
echo "2. Setup SSL certificates (run setup-ssl.sh)"
echo "3. Start the bot (cd bot && ./start.sh)"

ENDSSH

# Clean up
rm deploy.tar.gz

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${BLUE}Next: SSH to server and run configuration scripts${NC}"
echo "ssh ${USER}@${SERVER}"

