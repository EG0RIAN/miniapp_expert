#!/bin/bash

echo "📱 Обновление сайта с мобильной версией и SEO..."

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
send "cp -r site/* /var/www/miniapp.expert/\r"

expect "# "
send "chown -R www-data:www-data /var/www/miniapp.expert/\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo ''\r"
send "echo '✅ Сайт обновлён!'\r"
send "echo ''\r"
send "echo '📱 Бургер-меню добавлено'\r"
send "echo '🔧 Мобильная версия исправлена'\r"
send "echo '🎯 SEO оптимизация добавлена'\r"
send "echo ''\r"
send "echo 'Откройте сайт:'\r"
send "echo 'http://miniapp.expert'\r"
send "echo ''\r"
send "echo 'Попробуйте на мобильном устройстве!'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Готово! Проверьте на мобильном устройстве."



