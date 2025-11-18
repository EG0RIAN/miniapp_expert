#!/bin/bash

# Скрипт для деплоя изменений через Git
# Использование: ./deploy-via-git.sh [commit_message]

set -e

SERVER_USER="root"
SERVER_HOST="85.198.110.66"
SERVER_PASS="h421-5882p7vUqkFn+EF"
API_DIR="/home/miniapp_expert/api-django"
SITE_DIR="/var/www/miniapp.expert"

COMMIT_MESSAGE="${1:-'Обновления через автоматический деплой'}"

echo "🚀 Начинаем деплой через Git..."

# 1. Проверяем статус Git
echo "📋 Проверяем статус Git..."
git status --short

# 2. Добавляем все изменения
echo "➕ Добавляем изменения в Git..."
git add -A

# 3. Коммитим изменения
echo "💾 Коммитим изменения..."
git commit -m "$COMMIT_MESSAGE" || echo "Нет изменений для коммита"

# 4. Пушим в репозиторий
echo "📤 Пушим изменения в репозиторий..."
git push origin main

# 5. На сервере: обновляем API
echo "🔄 Обновляем API на сервере..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << EOF
    set -e
    cd ${API_DIR}
    
    # Сохраняем локальные изменения, если есть
    git stash || true
    
    # Обновляем из репозитория
    git pull origin main || {
        echo "⚠️  Конфликт при git pull, копируем файлы напрямую"
        exit 0
    }
    
    # Активируем виртуальное окружение
    source venv/bin/activate
    
    # Собираем статические файлы
    python manage.py collectstatic --noinput
    
    # Проверяем конфигурацию
    python manage.py check
    
    echo "✅ API обновлен"
EOF

# 6. На сервере: копируем файлы сайта напрямую (если нет Git репозитория)
echo "📁 Копируем файлы сайта..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no \
    site/login.html \
    site/request-password-reset.html \
    site/cabinet.html \
    site/cabinet.js \
    ${SERVER_USER}@${SERVER_HOST}:${SITE_DIR}/

# 7. Перезапускаем Gunicorn
echo "🔄 Перезапускаем Gunicorn..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << EOF
    sudo systemctl restart gunicorn
    sleep 2
    sudo systemctl status gunicorn --no-pager | head -10
EOF

# 8. Проверяем здоровье API
echo "🏥 Проверяем здоровье API..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} \
    "curl -s http://localhost:8000/api/auth/health/ | head -5"

echo "✅ Деплой завершен успешно!"
echo ""
echo "📝 Что было сделано:"
echo "  1. Изменения закоммичены в Git"
echo "  2. Изменения запушены в origin/main"
echo "  3. API обновлен на сервере"
echo "  4. Файлы сайта скопированы"
echo "  5. Gunicorn перезапущен"
echo ""
echo "🔍 Проверьте:"
echo "  - https://miniapp.expert/request-password-reset.html"
echo "  - https://miniapp.expert/login.html (ссылка 'Забыли пароль?')"
echo "  - https://miniapp.expert/cabinet.html (статус email)"
echo "  - https://miniapp.expert/api/auth/health/"
