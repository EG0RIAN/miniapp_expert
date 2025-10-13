#!/bin/bash

# Quick connect and deploy script
# This script will SSH to the server and run all setup steps

SERVER="195.2.73.224"
USER="root"
PASSWORD="h374w#54EeCTWYLu_qRA"

echo "🚀 MiniApp Expert - Quick Deploy"
echo "================================="
echo ""
echo "This script will:"
echo "1. Build your app locally"
echo "2. Connect to the server"
echo "3. Upload and configure everything"
echo "4. Setup SSL certificates"
echo ""
echo "Server: $SERVER"
echo "User: $USER"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Build locally
echo ""
echo "📦 Building React app locally..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deploy-configs
tar -czf miniapp-deploy.tar.gz \
    dist/ \
    site/ \
    bot/ \
    package.json \
    package-lock.json \
    deploy-configs/

echo ""
echo "📤 Ready to upload!"
echo ""
echo "Next: Copy the files to server using SCP"
echo ""
echo "Run these commands:"
echo ""
echo "# Upload the package"
echo "scp miniapp-deploy.tar.gz $USER@$SERVER:/home/miniapp_expert/"
echo ""
echo "# Connect to server"
echo "ssh $USER@$SERVER"
echo ""
echo "# On the server, run:"
echo "cd /home/miniapp_expert"
echo "tar -xzf miniapp-deploy.tar.gz"
echo "chmod +x deploy-configs/*.sh"
echo "./deploy-configs/full-setup.sh"
echo "./deploy-configs/setup-nginx.sh"
echo "./deploy-configs/setup-ssl.sh"
echo ""
echo "📝 Note: Password is: $PASSWORD"
echo ""

