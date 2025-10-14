#!/bin/bash

echo "📁 Загрузка файлов на сервер..."

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "echo '=== КОПИРОВАНИЕ СТАТИЧЕСКОГО САЙТА ==='\r"

expect "# "
send "cp -r site/* /var/www/miniapp.expert/\r"

expect "# "
send "echo '=== СБОРКА REACT ПРИЛОЖЕНИЯ ==='\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "npm install\r"

expect -timeout 300 "# "
send "npm run build\r"

expect -timeout 300 "# "
send "cp -r dist/* /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "echo '=== ПРОВЕРКА ФАЙЛОВ ==='\r"

expect "# "
send "ls -la /var/www/miniapp.expert/\r"

expect "# "
send "ls -la /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "echo '=== НАСТРОЙКА ПРАВ ДОСТУПА ==='\r"

expect "# "
send "chown -R www-data:www-data /var/www/\r"

expect "# "
send "chmod -R 755 /var/www/\r"

expect "# "
send "echo '=== ПЕРЕЗАПУСК NGINX ==='\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo '=== ТЕСТ САЙТОВ ==='\r"

expect "# "
send "curl -I http://localhost\r"

expect "# "
send "echo ''\r"
send "echo '✅ ФАЙЛЫ ЗАГРУЖЕНЫ И НАСТРОЕНЫ'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Файлы загружены на сервер!"



