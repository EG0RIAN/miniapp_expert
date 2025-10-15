#!/bin/bash

echo "✏️ Добавление фавиконки в HTML..."

expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /var/www/miniapp.expert\r"

expect "# "
send "echo '=== Добавление в статический сайт ==='\r"

expect "# "
send "sed -i 's|<meta charset=\"UTF-8\">|<meta charset=\"UTF-8\">\\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />|' index.html\r"

expect "# "
send "cd /var/www/demoapp.miniapp.expert\r"

expect "# "
send "echo '=== Добавление в React приложение ==='\r"

expect "# "
send "sed -i 's|<meta charset=\"UTF-8\" />|<meta charset=\"UTF-8\" />\\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />\\n    <link rel=\"alternate icon\" href=\"/favicon.ico\" />|' index.html\r"

expect "# "
send "echo ''\r"
send "echo '=== Проверка результатов ==='\r"

expect "# "
send "grep -A 2 charset /var/www/miniapp.expert/index.html | head -5\r"

expect "# "
send "echo ''\r"
send "grep -A 3 charset /var/www/demoapp.miniapp.expert/index.html | head -6\r"

expect "# "
send "echo ''\r"
send "echo '=== Перезагрузка nginx ==='\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo ''\r"
send "echo '✅ Фавиконка добавлена в HTML!'\r"
send "echo ''\r"
send "echo 'Откройте сайты (нажмите Ctrl+F5 для очистки кэша):'\r"
send "echo '  http://miniapp.expert'\r"
send "echo '  http://demoapp.miniapp.expert'\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Готово! Обновите страницу с Ctrl+F5"



