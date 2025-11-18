#!/bin/bash

SERVER="85.198.110.66"
USER="root"
PASSWORD="h421-5882p7vUqkFn+EF"

echo "🚀 Продолжение установки..."
echo ""

expect << 'EOFMAIN'
set timeout 1800
spawn ssh root@85.198.110.66

expect {
    "password:" { send "h421-5882p7vUqkFn+EF\r" }
    "yes/no" { send "yes\r"; exp_continue }
}

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "ls -la | head -20\r"

expect "# "
send "chmod +x deploy-configs/*.sh 2>/dev/null || true\r"

expect "# "
send "mkdir -p bot 2>/dev/null\r"

expect "# "
send "echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env\r"

expect "# "
send "echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env\r"

expect "# "
send "export DEBIAN_FRONTEND=noninteractive\r"

expect "# "
send "export NEEDRESTART_MODE=a\r"

expect "# "
send "echo '📦 Установка системных пакетов...'\r"

expect "# "
send "./deploy-configs/full-setup.sh\r"

expect -timeout 900 "# "
send "echo ''\r"
send "echo '🌐 Настройка nginx...'\r"

expect "# "
send "./deploy-configs/setup-nginx.sh\r"

expect -timeout 300 "# "
send "echo ''\r"
send "echo '🔒 Установка SSL...'\r"

expect "# "
send "./deploy-configs/setup-ssl.sh\r"

expect -timeout 900 "# "
send "echo ''\r"
send "echo '🤖 Запуск бота...'\r"

expect "# "
send "./deploy-configs/bot-setup.sh\r"

expect -timeout 600 "# "
send "echo ''\r"
send "echo '================================'\r"
send "echo '✅ УСТАНОВКА ЗАВЕРШЕНА!'\r"
send "echo '================================'\r"
send "echo ''\r"

expect "# "
send "systemctl status nginx --no-pager | head -5\r"

expect "# "
send "echo ''\r"
send "pm2 list\r"

expect "# "
send "echo ''\r"
send "echo 'Сайты готовы:'\r"
send "echo 'https://miniapp.expert'\r"
send "echo 'https://www.miniapp.expert'\r"
send "echo 'https://demoapp.miniapp.expert'\r"
send "exit\r"

expect eof
EOFMAIN

echo ""
echo "✅ Готово!"

