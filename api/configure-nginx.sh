#!/bin/bash

echo "🔧 Configuring Nginx for API proxy..."

# Create nginx configuration file with API proxy
cat > /tmp/miniapp-nginx-with-api.conf << 'NGINXCONF'
upstream miniapp_api {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name miniapp.expert www.miniapp.expert;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name miniapp.expert www.miniapp.expert;
    
    ssl_certificate /etc/letsencrypt/live/miniapp.expert/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miniapp.expert/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/miniapp.expert;
    index index.html;
    
    # API Proxy (IMPORTANT: Must be before location /)
    location /api/ {
        proxy_pass http://miniapp_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
NGINXCONF

echo "✅ Configuration file created: /tmp/miniapp-nginx-with-api.conf"
echo ""
echo "To apply:"
echo "1. Copy to server: scp /tmp/miniapp-nginx-with-api.conf root@85.198.110.66:/etc/nginx/sites-available/miniapp.expert"
echo "2. Test: ssh root@85.198.110.66 'nginx -t'"
echo "3. Reload: ssh root@85.198.110.66 'systemctl reload nginx'"

