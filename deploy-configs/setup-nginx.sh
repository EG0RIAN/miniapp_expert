#!/bin/bash

# Setup nginx configurations
# Run this script on the server after deployment

set -e

echo "🔧 Setting up nginx configurations..."

# Copy nginx configurations
echo "📋 Copying nginx configurations..."
cp /home/miniapp_expert/deploy-configs/nginx-miniapp.conf /etc/nginx/sites-available/miniapp.expert
cp /home/miniapp_expert/deploy-configs/nginx-demoapp.conf /etc/nginx/sites-available/demoapp.miniapp.expert

# Remove default nginx site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removing default nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# Create symbolic links
echo "🔗 Creating symbolic links..."
ln -sf /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/demoapp.miniapp.expert /etc/nginx/sites-enabled/

# Test nginx configuration
echo "✅ Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Enable nginx to start on boot
systemctl enable nginx

echo ""
echo "✅ Nginx configured successfully!"
echo ""
echo "Sites configured:"
echo "  - http://miniapp.expert"
echo "  - http://www.miniapp.expert"
echo "  - http://demoapp.miniapp.expert"
echo ""
echo "Next: Run setup-ssl.sh to configure HTTPS with certbot"

