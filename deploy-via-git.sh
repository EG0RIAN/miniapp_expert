#!/bin/bash

# Деплой через Git на сервер
SERVER="85.198.110.66"
USER="root"
REMOTE_DIR="/home/miniapp_expert"

echo "🚀 Деплой через Git на сервер"
echo "=============================="
echo ""

# Создаем архив с проектом
echo "📦 Создание архива..."
tar -czf miniapp-git-deploy.tar.gz \
    dist/ \
    site/ \
    bot/ \
    package.json \
    package-lock.json \
    deploy-configs/ \
    bot-env-template

echo "✅ Архив создан: miniapp-git-deploy.tar.gz"
echo ""
echo "📤 Теперь загрузите файл на сервер одним из способов:"
echo ""
echo "Способ 1: SCP (если SSH заработает):"
echo "  scp miniapp-git-deploy.tar.gz ${USER}@${SERVER}:${REMOTE_DIR}/"
echo ""
echo "Способ 2: Через Git репозиторий (если есть GitHub/GitLab):"
echo "  1. Создайте репозиторий на GitHub"
echo "  2. git remote add origin <URL>"
echo "  3. git add ."
echo "  4. git commit -m 'Deploy'"
echo "  5. git push origin main"
echo "  6. На сервере: git clone <URL> /home/miniapp_expert"
echo ""
echo "Способ 3: Через панель хостинга:"
echo "  Загрузите miniapp-git-deploy.tar.gz через файловый менеджер в /home/miniapp_expert/"
echo ""
echo "Способ 4: Через wget на сервере:"
echo "  1. Загрузите файл куда-то (Dropbox, Google Drive, etc)"
echo "  2. На сервере: wget <URL> -O /home/miniapp_expert/miniapp-git-deploy.tar.gz"
echo ""
echo "================================"
echo "После загрузки на сервер выполните:"
echo "================================"
echo ""
cat << 'SERVERCOMMANDS'
cd /home/miniapp_expert
tar -xzf miniapp-git-deploy.tar.gz
chmod +x deploy-configs/*.sh

# Создать .env для бота
echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env
echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env

# Установка
export DEBIAN_FRONTEND=noninteractive
./deploy-configs/full-setup.sh
./deploy-configs/setup-nginx.sh
./deploy-configs/setup-ssl.sh
./deploy-configs/bot-setup.sh

echo "✅ Готово!"
SERVERCOMMANDS

echo ""
echo "================================"
echo "Или используйте одну команду:"
echo "================================"
echo ""
echo "cd /home/miniapp_expert && tar -xzf miniapp-git-deploy.tar.gz && chmod +x deploy-configs/*.sh && echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env && echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env && export DEBIAN_FRONTEND=noninteractive && ./deploy-configs/full-setup.sh && ./deploy-configs/setup-nginx.sh && ./deploy-configs/setup-ssl.sh && ./deploy-configs/bot-setup.sh"
echo ""

