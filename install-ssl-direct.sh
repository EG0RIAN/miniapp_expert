#!/bin/bash

echo "🔒 Попытка установки SSL напрямую на сервере..."

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "echo '=== ПРОВЕРКА DNS НА СЕРВЕРЕ ==='\r"

expect "# "
send "nslookup miniapp.expert\r"

expect "# "
send "echo ''\r"
send "echo '=== ПОПЫТКА УСТАНОВКИ SSL ==='\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "echo ''\r"
send "echo '=== РЕЗУЛЬТАТ ==='\r"

expect "# "
send "certbot certificates\r"

expect "# "
send "echo ''\r"
send "echo '=== ТЕСТ HTTPS ==='\r"

expect "# "
send "curl -I https://miniapp.expert 2>/dev/null | head -5 || echo 'HTTPS не работает'\r"

expect "# "
send "echo ''\r"
send "echo '=== СТАТУС NGINX ==='\r"

expect "# "
send "systemctl status nginx --no-pager | head -5\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ SSL установка завершена!"



