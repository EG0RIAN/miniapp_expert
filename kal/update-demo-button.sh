#!/bin/bash

echo "🔄 Обновление страницы с кнопкой демо..."

expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "git pull origin main\r"

expect "# "
send "cp site/real-estate-solution.html /var/www/miniapp.expert/\r"

expect "# "
send "chown -R www-data:www-data /var/www/miniapp.expert/\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo ''\r"
send "echo '✅ Кнопка демо добавлена!'\r"
send "echo ''\r"
send "echo 'Проверьте:'\r"
send "echo 'http://miniapp.expert/real-estate-solution.html'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Готово!"



