#!/bin/bash
# Быстрое исправление Nginx для Django Admin

set -e

echo "🔧 Быстрое исправление Nginx для Django Admin..."

SERVER="85.198.110.66"
USER="root"

ssh $USER@$SERVER << 'ENDSSH'
NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"

echo "📋 Текущая конфигурация Nginx:"
echo "---"
grep -A 2 "location /" $NGINX_CONF | head -20
echo "---"

# Создать бэкап
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
cp $NGINX_CONF $BACKUP_FILE
echo "✅ Бэкап создан: $BACKUP_FILE"

# Простое решение: использовать sed для добавления location блоков перед location /
# Сначала удалим старые блоки если они есть
sed -i '/location \/api\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/admin\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF

# Теперь добавим новые блоки перед location /
# Используем Python для более надежной вставки
python3 << 'PYTHON'
import re

conf_file = '/etc/nginx/sites-available/miniapp.expert'

with open(conf_file, 'r') as f:
    lines = f.readlines()

# Найти индекс строки с "location / {"
location_root_idx = None
for i, line in enumerate(lines):
    if re.match(r'^\s+location\s+/\s*\{', line):
        location_root_idx = i
        break

if location_root_idx is None:
    print("❌ Не найден location / блок")
    exit(1)

# Конфигурация для Django
django_config = '''    # Django API и Admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /static/ {
        alias /root/rello/api-django/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /root/rello/api-django/media/;
        expires 7d;
    }

'''

# Вставить конфигурацию перед location /
new_lines = lines[:location_root_idx] + [django_config] + lines[location_root_idx:]

with open(conf_file, 'w') as f:
    f.writelines(new_lines)

print("✅ Конфигурация добавлена")
PYTHON

# Проверить конфигурацию
echo ""
echo "🔍 Проверка конфигурации..."
if nginx -t 2>&1; then
    echo "✅ Конфигурация корректна"
    echo ""
    echo "🔄 Перезагрузка Nginx..."
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации!"
    echo "🔄 Восстановление из бэкапа..."
    cp $BACKUP_FILE $NGINX_CONF
    exit 1
fi

echo ""
echo "✅ Готово!"
echo ""
echo "Проверьте:"
echo "1. https://miniapp.expert/admin/ - должна открыться Django Admin"
echo "2. https://miniapp.expert/api/auth/login/ - должен работать API"
echo ""
echo "Если не работает, проверьте логи:"
echo "  docker logs miniapp_api"

ENDSSH

echo ""
echo "🎉 Исправление завершено!"

