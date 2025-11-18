#!/bin/bash

# Финальная установка
SERVER="85.198.110.66"
USER="root"
PASSWORD="h421-5882p7vUqkFn+EF"

echo "🚀 Установка MiniApp Expert на сервер"
echo "======================================"
echo ""

expect << 'EOFMAIN'
set timeout 1800
set SERVER "85.198.110.66"
set USER "root"
set PASSWORD "h421-5882p7vUqkFn+EF"

spawn ssh ${USER}@${SERVER}

expect {
    "password:" { send "${PASSWORD}\r" }
    "yes/no" { send "yes\r"; exp_continue }
}

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "rm -rf temp 2>/dev/null || true\r"

expect "# "
send "git clone https://github.com/EG0RIAN/miniapp_expert.git temp\r"

expect -timeout 300 "# "
send "cp -r temp/* . 2>/dev/null || true\r"

expect "# "
send "cp -r temp/.[!.]* . 2>/dev/null || true\r"

expect "# "
send "rm -rf temp\r"

expect "# "
send "chmod +x deploy-configs/*.sh\r"

expect "# "
send "echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env\r"

expect "# "
send "echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env\r"

expect "# "
send "export DEBIAN_FRONTEND=noninteractive\r"

expect "# "
send "echo ''\r"
send "echo '📦 Установка системных пакетов...'\r"

expect "# "
send "./deploy-configs/full-setup.sh 2>&1 | tail -20\r"

expect -timeout 900 "# "
send "echo ''\r"
send "echo '🌐 Настройка nginx...'\r"

expect "# "
send "./deploy-configs/setup-nginx.sh\r"

expect -timeout 300 "# "
send "echo ''\r"
send "echo '🔒 Настройка SSL...'\r"

expect "# "
send "./deploy-configs/setup-ssl.sh 2>&1 | tail -30\r"

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
send "echo '🌐 Ваши сайты:'\r"
send "echo '   https://miniapp.expert'\r"
send "echo '   https://www.miniapp.expert'\r"
send "echo '   https://demoapp.miniapp.expert'\r"
send "echo ''\r"
send "echo '🔍 Проверка:'\r"

expect "# "
send "systemctl status nginx --no-pager | head -5\r"

expect "# "
send "echo ''\r"

expect "# "
send "pm2 list\r"

expect "# "
send "echo ''\r"
send "echo 'Готово! Проверьте сайты в браузере.'\r"

expect "# "
send "exit\r"

expect eof
EOFMAIN

echo ""
echo "================================"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "================================"
echo ""
echo "🌐 Проверьте сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""

