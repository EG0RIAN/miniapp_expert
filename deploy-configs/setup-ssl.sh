#!/bin/bash

# Setup SSL certificates with Let's Encrypt
# Run this script on the server after nginx is configured

set -e

echo "🔒 Setting up SSL certificates with Let's Encrypt..."

# Make sure nginx is running
systemctl start nginx

# Get certificates for miniapp.expert and www.miniapp.expert
echo ""
echo "📜 Getting certificate for miniapp.expert and www.miniapp.expert..."
certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect

# Get certificate for demoapp.miniapp.expert
echo ""
echo "📜 Getting certificate for demoapp.miniapp.expert..."
certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect

# Setup auto-renewal
echo ""
echo "⏰ Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test auto-renewal
echo ""
echo "✅ Testing auto-renewal..."
certbot renew --dry-run

# Reload nginx with new certificates
echo ""
echo "🔄 Reloading nginx with SSL certificates..."
systemctl reload nginx

echo ""
echo "✅ SSL certificates configured successfully!"
echo ""
echo "Sites are now available at:"
echo "  - https://miniapp.expert ✅"
echo "  - https://www.miniapp.expert ✅"
echo "  - https://demoapp.miniapp.expert ✅"
echo ""
echo "Auto-renewal is configured and will run automatically."
echo ""
echo "To check certificate status:"
echo "  certbot certificates"
echo ""
echo "To manually renew:"
echo "  certbot renew"

