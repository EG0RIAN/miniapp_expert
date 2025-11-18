#!/bin/bash

echo "🎨 Обновление сайта с фавиконкой..."

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "git pull origin main\r"

expect "# "
send "echo '=== Копирование статического сайта ==='\r"

expect "# "
send "cp -r site/* /var/www/miniapp.expert/\r"

expect "# "
send "echo '=== Сборка React приложения ==='\r"

expect "# "
send "npm run build\r"

expect -timeout 300 "# "
send "cp -r dist/* /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "chown -R www-data:www-data /var/www/\r"

expect "# "
send "chmod -R 755 /var/www/\r"

expect "# "
send "echo '=== Проверка файлов ==='\r"

expect "# "
send "ls -la /var/www/miniapp.expert/ | grep favicon\r"

expect "# "
send "ls -la /var/www/demoapp.miniapp.expert/ | grep favicon\r"

expect "# "
send "echo ''\r"
send "echo '✅ Фавиконка установлена!'\r"
send "echo ''\r"
send "echo 'Проверьте сайты:'\r"
send "echo 'http://miniapp.expert'\r"
send "echo 'http://demoapp.miniapp.expert'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Сайт обновлён с фавиконкой!"




