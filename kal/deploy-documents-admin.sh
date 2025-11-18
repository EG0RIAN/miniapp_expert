#!/bin/bash
# Скрипт для развертывания системы управления документами на сервере

set -e

echo "🚀 Развертывание системы управления документами..."

# Переменные
SERVER_USER="root"
SERVER_HOST="85.198.110.66"
SERVER_PASS="h421-5882p7vUqkFn+EF"
SERVER_PATH="/var/www/miniapp.expert"
API_PATH="$SERVER_PATH/api-django"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Загрузка файлов на сервер...${NC}"

# Загружаем файлы приложения documents
sshpass -p "$SERVER_PASS" scp -r api-django/apps/documents $SERVER_USER@$SERVER_HOST:$API_PATH/apps/

# Загружаем обновленные файлы
sshpass -p "$SERVER_PASS" scp api-django/miniapp_api/admin.py $SERVER_USER@$SERVER_HOST:$API_PATH/miniapp_api/admin.py
sshpass -p "$SERVER_PASS" scp api-django/miniapp_api/settings.py $SERVER_USER@$SERVER_HOST:$API_PATH/miniapp_api/settings.py
sshpass -p "$SERVER_PASS" scp api-django/miniapp_api/urls.py $SERVER_USER@$SERVER_HOST:$API_PATH/miniapp_api/urls.py

# Загружаем шаблоны
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_HOST "mkdir -p $API_PATH/templates/documents"
sshpass -p "$SERVER_PASS" scp api-django/templates/documents/document.html $SERVER_USER@$SERVER_HOST:$API_PATH/templates/documents/document.html

echo -e "${GREEN}✅ Файлы загружены${NC}"

echo -e "${YELLOW}🔧 Выполнение миграций...${NC}"

# Выполняем миграции на сервере
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /var/www/miniapp.expert/api-django
source venv/bin/activate 2>/dev/null || true

# Создаем миграции
echo "Создание миграций для documents..."
python manage.py makemigrations documents

# Применяем миграции
echo "Применение миграций..."
python manage.py migrate

# Создаем базовые документы
echo "Создание базовых документов..."
python manage.py import_documents

# Очищаем кеш Python
echo "Очистка кеша..."
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo "✅ Миграции выполнены"
ENDSSH

echo -e "${YELLOW}🔄 Перезапуск Gunicorn...${NC}"

# Перезапускаем Gunicorn
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_HOST "sudo systemctl restart gunicorn || sudo systemctl restart gunicorn-miniapp || true"

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${YELLOW}📝 Проверьте админку: https://miniapp.expert/admin/${NC}"
echo -e "${YELLOW}📝 Должен появиться раздел 'ДОКУМЕНТЫ'${NC}"

