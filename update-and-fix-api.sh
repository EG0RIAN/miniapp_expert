#!/bin/bash
# Обновление Django API и исправление Nginx

set -e

echo "🚀 Обновление Django API и исправление Nginx..."

SERVER="85.198.110.66"
USER="root"
PROJECT_DIR="/root/rello"
API_DIR="$PROJECT_DIR/api-django"

# 1. Загрузить обновленный код
echo "📦 Загрузка обновленного кода..."
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' --exclude 'staticfiles' --exclude 'media' \
    ./api-django/ $USER@$SERVER:$API_DIR/

# 2. Исправить Nginx и перезапустить API
ssh $USER@$SERVER << 'ENDSSH'
cd /root/rello

echo "🔧 Исправление Nginx конфигурации..."

NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"

# Создать бэкап
cp $NGINX_CONF ${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)

# Удалить старые location блоки
sed -i '/location \/api\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/admin\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/static\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/media\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF

# Добавить новые location блоки перед location /
python3 << 'PYTHON'
import re

conf_file = '/etc/nginx/sites-available/miniapp.expert'

with open(conf_file, 'r') as f:
    content = f.read()

# Конфигурация для Django
django_config = '''
    # Django API и Admin (должно быть ПЕРЕД location /)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # Static files для Django
    location /static/ {
        alias /root/rello/api-django/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /root/rello/api-django/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

'''

# Найти location / и добавить перед ним
pattern = r'(\s+)(location\s+/\s*\{)'

def add_before_location(match):
    indent = match.group(1)
    location = match.group(2)
    return django_config + indent + location

new_content = re.sub(pattern, add_before_location, content)

# Если не нашлось, попробуем другой паттерн
if new_content == content:
    # Ищем в блоке server для HTTPS
    ssl_pattern = r'(server\s*\{[^}]*listen\s+443[^}]*?)(\s+location\s+/\s*\{)'
    def add_in_ssl(match):
        return match.group(1) + django_config + match.group(2)
    new_content = re.sub(ssl_pattern, add_in_ssl, content, flags=re.DOTALL)

if new_content == content:
    # Последняя попытка - просто заменить
    new_content = content.replace(
        '    location / {',
        django_config + '    location / {'
    )

with open(conf_file, 'w') as f:
    f.write(new_content)

print("✅ Конфигурация Nginx обновлена")
PYTHON

# Проверить и перезагрузить Nginx
if nginx -t 2>&1; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

echo ""
echo "🔄 Перезапуск Django API..."

# Перезапустить API контейнер
cd /root/rello
docker-compose restart api || docker-compose up -d api

echo "✅ API перезапущен"

echo ""
echo "🔍 Проверка работы API..."
sleep 3

# Проверить health endpoint
echo "Health check:"
curl -s http://127.0.0.1:8000/api/auth/health/ | head -3 || echo "❌ Health check не работает"

echo ""
echo "✅ Готово!"
echo ""
echo "Проверьте:"
echo "1. https://miniapp.expert/api/auth/health/ - должен вернуть JSON"
echo "2. https://miniapp.expert/admin/ - должна открыться Django Admin"
echo "3. https://miniapp.expert/api/auth/login/ - должен вернуть информацию о POST методе"

ENDSSH

echo ""
echo "🎉 Обновление завершено!"

