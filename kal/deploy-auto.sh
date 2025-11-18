#!/bin/bash

# Автоматическая установка с автоответами
SERVER="85.198.110.66"
USER="root"
PASSWORD="h421-5882p7vUqkFn+EF"

echo "🚀 Продолжение установки MiniApp Expert"
echo "========================================"
echo ""

# Загрузка пакета
echo "📤 Загрузка пакета..."
expect << EOF
set timeout 300
spawn scp miniapp-deploy.tar.gz ${USER}@${SERVER}:/home/miniapp_expert/
expect {
    "password:" { send "${PASSWORD}\r" }
    "yes/no" { send "yes\r"; exp_continue }
}
expect eof
EOF

echo "✅ Пакет загружен"
echo ""
echo "🔧 Установка на сервере..."
echo ""

# Установка через SSH с автоответами
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
send "export DEBIAN_FRONTEND=noninteractive\r"

expect "# "
send "export NEEDRESTART_MODE=a\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "tar -xzf miniapp-deploy.tar.gz 2>/dev/null || echo 'Already extracted'\r"

expect "# "
send "chmod +x deploy-configs/*.sh\r"

expect "# "
send "echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env\r"

expect "# "
send "echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env\r"

expect "# "
send "echo ''\r"
send "echo '📦 Обновление системы...'\r"

expect "# "
send "apt-get update -qq\r"

expect "# "
send "apt-get upgrade -y -qq -o Dpkg::Options::=\"--force-confdef\" -o Dpkg::Options::=\"--force-confold\"\r"

expect -timeout 600 "# "
send "echo ''\r"
send "echo '📦 Установка пакетов...'\r"

expect "# "
send "apt-get install -y -qq curl wget git nginx certbot python3-certbot-nginx ufw\r"

expect -timeout 600 "# "
send "echo ''\r"
send "echo '📦 Установка Node.js...'\r"

expect "# "
send "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -\r"

expect -timeout 600 "# "
send "apt-get install -y -qq nodejs\r"

expect -timeout 600 "# "
send "npm install -g pm2\r"

expect -timeout 600 "# "
send "echo ''\r"
send "echo '🔥 Настройка файрвола...'\r"

expect "# "
send "ufw --force enable\r"

expect "# "
send "ufw default deny incoming\r"

expect "# "
send "ufw default allow outgoing\r"

expect "# "
send "ufw allow ssh\r"

expect "# "
send "ufw allow 'Nginx Full'\r"

expect "# "
send "ufw allow 80/tcp\r"

expect "# "
send "ufw allow 443/tcp\r"

expect "# "
send "echo ''\r"
send "echo '📁 Создание директорий...'\r"

expect "# "
send "mkdir -p /var/www/miniapp.expert\r"

expect "# "
send "mkdir -p /var/www/demoapp.miniapp.expert\r"

expect "# "
send "cp -r site/* /var/www/miniapp.expert/\r"

expect "# "
send "cp -r dist/* /var/www/demoapp.miniapp.expert/\r"

expect "# "
send "chown -R www-data:www-data /var/www/\r"

expect "# "
send "echo ''\r"
send "echo '🌐 Настройка nginx...'\r"

expect "# "
send "cp deploy-configs/nginx-miniapp.conf /etc/nginx/sites-available/miniapp.expert\r"

expect "# "
send "cp deploy-configs/nginx-demoapp.conf /etc/nginx/sites-available/demoapp.miniapp.expert\r"

expect "# "
send "rm -f /etc/nginx/sites-enabled/default\r"

expect "# "
send "ln -sf /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-enabled/\r"

expect "# "
send "ln -sf /etc/nginx/sites-available/demoapp.miniapp.expert /etc/nginx/sites-enabled/\r"

expect "# "
send "nginx -t\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "systemctl enable nginx\r"

expect "# "
send "echo ''\r"
send "echo '🔒 Установка SSL сертификатов...'\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 600 "# "
send "certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 600 "# "
send "systemctl enable certbot.timer\r"

expect "# "
send "systemctl start certbot.timer\r"

expect "# "
send "echo ''\r"
send "echo '🤖 Настройка бота...'\r"

expect "# "
send "cd /home/miniapp_expert/bot\r"

expect "# "
send "python3 -m venv venv 2>/dev/null || echo 'venv exists'\r"

expect "# "
send "source venv/bin/activate && pip install --upgrade pip -q && pip install -r requirements.txt -q\r"

expect -timeout 600 "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "pm2 delete miniapp-bot 2>/dev/null || echo 'No existing bot'\r"

expect "# "
send "cd bot && pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python\r"

expect "# "
send "pm2 save\r"

expect "# "
send "pm2 startup systemd -u root --hp /root\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
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
echo "🌐 Сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""
echo "🤖 Бот запущен с PM2"
echo ""

