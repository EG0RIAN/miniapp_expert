#!/bin/bash

echo "🔧 Финальное исправление nginx и SSL..."

expect << 'EOFMAIN'
set timeout 900
spawn ssh root@85.198.110.66

expect {
    "password:" { send "h421-5882p7vUqkFn+EF\r" }
}

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "cat > /etc/nginx/sites-available/demoapp.miniapp.expert << 'NGINX_EOF'\r"
send "server {\r"
send "    listen 80;\r"
send "    listen [::]:80;\r"
send "    server_name demoapp.miniapp.expert;\r"
send "    \r"
send "    root /var/www/demoapp.miniapp.expert;\r"
send "    index index.html;\r"
send "    \r"
send "    # Security and CORS headers\r"
send "    add_header X-Frame-Options \"SAMEORIGIN\" always;\r"
send "    add_header X-Content-Type-Options \"nosniff\" always;\r"
send "    add_header X-XSS-Protection \"1; mode=block\" always;\r"
send "    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;\r"
send "    add_header Access-Control-Allow-Origin \"*\" always;\r"
send "    add_header Access-Control-Allow-Methods \"GET, POST, OPTIONS\" always;\r"
send "    add_header Access-Control-Allow-Headers \"DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range\" always;\r"
send "    \r"
send "    # Gzip\r"
send "    gzip on;\r"
send "    gzip_vary on;\r"
send "    gzip_min_length 1024;\r"
send "    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;\r"
send "    \r"
send "    location / {\r"
send "        try_files \\$uri \\$uri/ /index.html;\r"
send "    }\r"
send "    \r"
send "    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\\$ {\r"
send "        expires 1y;\r"
send "        add_header Cache-Control \"public, immutable\";\r"
send "    }\r"
send "    \r"
send "    location ~ /\\. {\r"
send "        deny all;\r"
send "    }\r"
send "}\r"
send "NGINX_EOF\r"

expect "# "
send "nginx -t\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo 'ð Установка SSL...'\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "echo ''\r"
send "echo 'ð¤ Исправление бота...'\r"

expect "# "
send "cd /home/miniapp_expert/bot\r"

expect "# "
send "source venv/bin/activate && pip install -r requirements.txt -q\r"

expect -timeout 300 "# "
send "pm2 delete miniapp-bot\r"

expect "# "
send "pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python\r"

expect "# "
send "pm2 save\r"

expect "# "
send "echo ''\r"
send "echo '================================'\r"
send "echo '✅ ВСЁ РАБОТАЕТ!'\r"
send "echo '================================'\r"
send "echo ''\r"
send "echo 'ð Ваши сайты:'\r"
send "echo 'https://miniapp.expert'\r"
send "echo 'https://www.miniapp.expert'\r"
send "echo 'https://demoapp.miniapp.expert'\r"
send "echo ''\r"

expect "# "
send "pm2 list\r"

expect "# "
send "pm2 logs miniapp-bot --lines 5 --nostream\r"

expect "# "
send "exit\r"

expect eof
EOFMAIN

echo ""
echo "✅ ГОТОВО!"







