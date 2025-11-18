#!/bin/bash

echo "📌 Копирование фавиконок на сервер..."

expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "cp site/favicon.svg /var/www/miniapp.expert/\r"

expect "# "
send "cp public/favicon.svg /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "cp public/favicon.ico /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "chown www-data:www-data /var/www/*/favicon.*\r"

expect "# "
send "echo '=== Проверка фавиконок ==='\r"

expect "# "
send "ls -lh /var/www/miniapp.expert/favicon*\r"

expect "# "
send "ls -lh /var/www/demoapp.miniapp.expert/favicon*\r"

expect "# "
send "echo ''\r"
send "echo '=== Тест фавиконок ==='\r"

expect "# "
send "curl -I http://localhost/favicon.svg | head -5\r"

expect "# "
send "echo ''\r"
send "echo '✅ Фавиконки установлены!'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Фавиконки скопированы!"
echo ""
echo "Проверьте:"
echo "  http://miniapp.expert"
echo "  http://demoapp.miniapp.expert"




