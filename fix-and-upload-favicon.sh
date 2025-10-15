#!/bin/bash

echo "🔧 Исправление и загрузка фавиконок..."

expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "git stash\r"

expect "# "
send "git pull origin main\r"

expect "# "
send "echo '=== Проверка файлов в репозитории ==='\r"

expect "# "
send "ls -la site/ | grep favicon\r"

expect "# "
send "ls -la public/ | grep favicon\r"

expect "# "
send "echo ''\r"
send "echo '=== Копирование фавиконок ==='\r"

expect "# "
send "cp site/favicon.svg /var/www/miniapp.expert/\r"

expect "# "
send "cp public/favicon.svg /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "cp public/favicon.ico /var/www/demoapp.miniapp.expert/ 2>/dev/null || echo 'favicon.ico не найден'\r"

expect "# "
send "chown -R www-data:www-data /var/www/\r"

expect "# "
send "echo '=== Проверка установленных фавиконок ==='\r"

expect "# "
send "ls -lh /var/www/miniapp.expert/favicon*\r"

expect "# "
send "ls -lh /var/www/demoapp.miniapp.expert/favicon*\r"

expect "# "
send "echo ''\r"
send "echo '✅ Фавиконки установлены!'\r"
send "echo ''\r"
send "echo 'Откройте в браузере:'\r"
send "echo 'http://miniapp.expert'\r"
send "echo 'http://demoapp.miniapp.expert'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Готово!"



