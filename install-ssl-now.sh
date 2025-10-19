#!/bin/bash

echo "🔒 Установка SSL сертификатов..."

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 {
    "Congratulations" {
        send "echo '✅ SSL СЕРТИФИКАТЫ УСТАНОВЛЕНЫ!'\r"
    }
    "Some challenges have failed" {
        send "echo '❌ Ошибка установки SSL'\r"
    }
    "# " {
        send "echo 'Установка завершена'\r"
    }
}

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo ''\r"
send "echo '=== СЕРТИФИКАТЫ ==='\r"

expect "# "
send "certbot certificates\r"

expect "# "
send "echo ''\r"
send "echo '=== ПРОВЕРКА HTTPS ==='\r"

expect "# "
send "curl -I https://miniapp.expert 2>&1 | head -10\r"

expect "# "
send "echo ''\r"
send "curl -I https://demoapp.miniapp.expert 2>&1 | head -10\r"

expect "# "
send "echo ''\r"
send "echo 'Сайты с HTTPS:'\r"
send "echo 'https://miniapp.expert'\r"
send "echo 'https://www.miniapp.expert'\r"
send "echo 'https://demoapp.miniapp.expert'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ SSL установка завершена!"




