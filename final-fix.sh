#!/bin/bash

echo "🔧 Финальное исправление..."

expect << 'EOF'
set timeout 900
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert && git pull origin main\r"

expect "# "
send "cp deploy-configs/nginx-demoapp-fixed.conf /etc/nginx/sites-available/demoapp.miniapp.expert\r"

expect "# "
send "nginx -t && systemctl reload nginx\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "cd bot && source venv/bin/activate && pip install -r requirements.txt -q\r"

expect -timeout 300 "# "
send "pm2 delete miniapp-bot; pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python; pm2 save\r"

expect "# "
send "echo '✅ ГОТОВО!'\r"
send "pm2 list\r"

expect "# "
send "exit\r"

expect eof
EOF

echo "✅ Готово!"







