#!/bin/bash

echo "🔍 Проверка DNS записей..."
echo ""

# Проверка DNS
MINIAPP=$(dig +short miniapp.expert | head -1)
WWW=$(dig +short www.miniapp.expert | head -1)
DEMOAPP=$(dig +short demoapp.miniapp.expert | head -1)

echo "miniapp.expert → $MINIAPP"
echo "www.miniapp.expert → $WWW"
echo "demoapp.miniapp.expert → $DEMOAPP"
echo ""

if [ "$MINIAPP" != "85.198.110.66" ] || [ "$WWW" != "85.198.110.66" ] || [ "$DEMOAPP" != "85.198.110.66" ]; then
    echo "❌ DNS записи ещё не настроены или не распространились!"
    echo ""
    echo "Нужно добавить в DNS:"
    echo "  @ (miniapp.expert) → A → 85.198.110.66"
    echo "  www → A → 85.198.110.66"
    echo "  demoapp → A → 85.198.110.66"
    echo ""
    echo "После настройки подождите 5-30 минут и запустите скрипт снова."
    exit 1
fi

echo "✅ DNS записи настроены правильно!"
echo ""
echo "🔒 Установка SSL сертификатов..."
echo ""

expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "systemctl reload nginx\r"

expect "# "
send "echo ''\r"
send "echo '================================'\r"
send "echo '✅ SSL УСТАНОВЛЕН!'\r"
send "echo '================================'\r"
send "echo ''\r"
send "certbot certificates\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ SSL сертификаты установлены!"
echo ""
echo "🌐 Ваши сайты с HTTPS:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""







