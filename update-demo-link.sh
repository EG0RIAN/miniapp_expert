#!/bin/bash

echo "🔗 Обновление ссылки на демо-приложение..."

expect << 'EOF'
set timeout 180
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
send "echo '✅ Ссылка обновлена!'\r"
send "echo ''\r"
send "echo '🤖 Новая ссылка: https://t.me/MiniAppExpertDemoBot'\r"
send "echo ''\r"
send "echo 'Проверьте на сайте:'\r"
send "echo 'http://miniapp.expert'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Ссылка на демо обновлена!"
echo ""
echo "🤖 Новый бот: @MiniAppExpertDemoBot"
echo "🔗 Ссылка: https://t.me/MiniAppExpertDemoBot"



