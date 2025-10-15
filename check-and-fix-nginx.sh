#!/bin/bash

echo "🔧 Проверка и настройка nginx на сервере..."

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "echo '=== СТАТУС NGINX ==='\r"

expect "# "
send "systemctl status nginx --no-pager | head -10\r"

expect "# "
send "echo ''\r"
send "echo '=== ПРОВЕРКА КОНФИГУРАЦИИ ==='\r"

expect "# "
send "nginx -t\r"

expect "# "
send "echo ''\r"
send "echo '=== СОДЕРЖИМОЕ САЙТОВ ==='\r"

expect "# "
send "ls -la /var/www/\r"

expect "# "
send "echo ''\r"
send "echo '=== КОНФИГУРАЦИИ NGINX ==='\r"

expect "# "
send "ls -la /etc/nginx/sites-enabled/\r"

expect "# "
send "echo ''\r"
send "echo '=== СОДЕРЖИМОЕ ДИРЕКТОРИЙ САЙТОВ ==='\r"

expect "# "
send "ls -la /var/www/miniapp.expert/ | head -10\r"

expect "# "
send "ls -la /var/www/demoapp.miniapp.expert/ | head -10\r"

expect "# "
send "echo ''\r"
send "echo '=== ПРОВЕРКА ПОРТОВ ==='\r"

expect "# "
send "netstat -tlnp | grep :80\r"

expect "# "
send "netstat -tlnp | grep :443\r"

expect "# "
send "echo ''\r"
send "echo '=== ПЕРЕЗАПУСК NGINX ==='\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "systemctl status nginx --no-pager | head -5\r"

expect "# "
send "echo ''\r"
send "echo '=== ТЕСТ ДОСТУПНОСТИ ==='\r"

expect "# "
send "curl -I http://localhost\r"

expect "# "
send "echo ''\r"
send "echo '=== ПРОВЕРКА ЛОГОВ ==='\r"

expect "# "
send "tail -10 /var/log/nginx/error.log\r"

expect "# "
send "echo ''\r"
send "echo '✅ NGINX ПРОВЕРЕН И НАСТРОЕН'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Проверка nginx завершена!"





