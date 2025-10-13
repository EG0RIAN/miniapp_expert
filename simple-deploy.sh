#!/bin/bash

# Простая автоматическая установка
SERVER="195.2.73.224"
USER="root"
PASSWORD="h374w#54EeCTWYLu_qRA"

echo "🚀 Установка MiniApp Expert"
echo "=============================="
echo ""

# Шаг 1: Загрузка
echo "📤 Загрузка файлов на сервер..."
expect << EOF
set timeout 300
spawn scp miniapp-deploy.tar.gz ${USER}@${SERVER}:/home/miniapp_expert/
expect {
    "password:" { send "${PASSWORD}\r" }
    "yes/no" { send "yes\r"; exp_continue }
}
expect eof
EOF

echo "✅ Файлы загружены"
echo ""

# Шаг 2: Установка
echo "🔧 Установка (это займет 5-10 минут)..."
echo ""

ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} << 'ENDSSH'
cd /home/miniapp_expert
tar -xzf miniapp-deploy.tar.gz
chmod +x deploy-configs/*.sh

# Создаем .env для бота
echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env
echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env

echo "📦 Установка системных пакетов..."
./deploy-configs/full-setup.sh

echo ""
echo "🌐 Настройка nginx..."
./deploy-configs/setup-nginx.sh

echo ""
echo "🔒 Настройка SSL..."
./deploy-configs/setup-ssl.sh

echo ""
echo "🤖 Запуск бота..."
./deploy-configs/bot-setup.sh

echo ""
echo "================================"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "================================"
echo ""
echo "Ваши сайты:"
echo "🌐 https://miniapp.expert"
echo "🌐 https://www.miniapp.expert"
echo "📱 https://demoapp.miniapp.expert"
echo ""
echo "Проверка:"
systemctl status nginx --no-pager -l | head -5
echo ""
pm2 list
echo ""

ENDSSH

echo ""
echo "✅ Готово!"

