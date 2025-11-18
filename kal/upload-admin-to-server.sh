#!/bin/bash

echo "🚀 Загрузка админки на сервер..."

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
send "echo '✅ Админка установлена!'\r"
send "echo ''\r"
send "echo '📱 Доступ к админке:'\r"
send "echo 'http://miniapp.expert/admin-login.html'\r"
send "echo ''\r"
send "echo '🔑 Тестовые данные:'\r"
send "echo 'Логин: admin'\r"
send "echo 'Пароль: admin123'\r"
send "echo ''\r"
send "echo '⚠️ Не забудьте изменить пароль после входа!'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Готово!"
echo ""
echo "📋 Информация:"
echo "   • Админка: http://miniapp.expert/admin-login.html"
echo "   • Логин: admin"
echo "   • Пароль: admin123"
echo ""
echo "📖 Полная инструкция: ADMIN_GUIDE.md"



