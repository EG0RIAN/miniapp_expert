#!/bin/bash

echo "🔍 Проверка фавиконки на сервере..."

expect << 'EOF'
set timeout 180
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "echo '=== Проверка HTML файлов ==='\r"

expect "# "
send "grep -n favicon /var/www/miniapp.expert/index.html | head -5\r"

expect "# "
send "echo ''\r"
send "grep -n favicon /var/www/demoapp.miniapp.expert/index.html | head -5\r"

expect "# "
send "echo ''\r"
send "echo '=== Проверка файлов ==='\r"

expect "# "
send "ls -lh /var/www/miniapp.expert/ | grep -E 'favicon|index'\r"

expect "# "
send "echo ''\r"
send "ls -lh /var/www/demoapp.miniapp.expert/ | grep -E 'favicon|index'\r"

expect "# "
send "echo ''\r"
send "echo '=== Тест доступности через curl ==='\r"

expect "# "
send "curl -I http://localhost/favicon.svg 2>&1 | head -5\r"

expect "# "
send "echo ''\r"
send "echo '=== Содержимое favicon.svg ==='\r"

expect "# "
send "cat /var/www/miniapp.expert/favicon.svg | head -10\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Проверка завершена!"



