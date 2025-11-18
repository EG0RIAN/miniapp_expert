#!/bin/bash

# ========================================
# ВЫПОЛНИТЕ ЭТИ КОМАНДЫ НА СЕРВЕРЕ
# ========================================
# Сервер: 85.198.110.66
# Пользователь: root
# Пароль: h421-5882p7vUqkFn+EF
# ========================================

cd /home/miniapp_expert

# Клонируем репозиторий
git clone https://github.com/EG0RIAN/miniapp_expert.git temp

# Копируем файлы
cp -r temp/* . 2>/dev/null || true
cp -r temp/.* . 2>/dev/null || true
rm -rf temp

# Делаем скрипты исполняемыми
chmod +x deploy-configs/*.sh

# Создаем .env для бота
echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env
echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env

# Устанавливаем всё
export DEBIAN_FRONTEND=noninteractive
./deploy-configs/full-setup.sh
./deploy-configs/setup-nginx.sh  
./deploy-configs/setup-ssl.sh
./deploy-configs/bot-setup.sh

echo ""
echo "================================"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "================================"
echo ""
echo "🌐 Ваши сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""
echo "Проверка:"
echo "  systemctl status nginx"
echo "  certbot certificates"
echo "  pm2 status"
echo ""

