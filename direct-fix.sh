#!/bin/bash

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "rm КОМАНДЫ_ДЛЯ_СЕРВЕРА.txt\r"

expect "# "
send "git pull origin main\r"

expect "# "
send "cp deploy-configs/nginx-demoapp-fixed.conf /etc/nginx/sites-available/demoapp.miniapp.expert\r"

expect "# "
send "nginx -t\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "echo '================================'\r"
send "echo '✅ УСТАНОВКА ПОЛНОСТЬЮ ЗАВЕРШЕНА!'\r"
send "echo '================================'\r"
send "echo ''\r"
send "echo 'Проверьте сайты:'\r"
send "curl -I https://miniapp.expert | head -3\r"

expect "# "
send "echo ''\r"
send "curl -I https://demoapp.miniapp.expert | head -3\r"

expect "# "
send "echo ''\r"
send "pm2 list\r"

expect "# "
send "pm2 logs miniapp-bot --lines 10 --nostream\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ ВСЁ ГОТОВО!"
echo ""
echo "🌐 Ваши сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"  
echo "   https://demoapp.miniapp.expert"
echo ""

