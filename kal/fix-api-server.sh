#!/bin/bash
# Скрипт для выполнения на сервере - исправление Django API и Nginx
# Проект находится в /home/miniapp_expert

set -e

echo "🚀 Исправление Django API и Nginx на сервере..."

cd /home/miniapp_expert

# Проверить, существует ли api-django
if [ ! -d "api-django" ]; then
    echo "❌ Директория api-django не найдена"
    echo "Создаю структуру..."
    mkdir -p api-django
fi

# 1. Исправить Nginx конфигурацию
echo "🔧 Исправление Nginx конфигурации..."

NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"

# Создать бэкап
if [ -f "$NGINX_CONF" ]; then
    cp $NGINX_CONF ${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Бэкап создан"
else
    echo "⚠️  Файл $NGINX_CONF не найден"
    exit 1
fi

# Удалить старые location блоки для Django
sed -i '/# Django API/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/api\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/admin\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/static\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/media\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF

# Добавить новые location блоки перед location /
python3 << 'PYTHON'
import re
import sys

conf_file = '/etc/nginx/sites-available/miniapp.expert'

try:
    with open(conf_file, 'r') as f:
        content = f.read()
except Exception as e:
    print(f"Ошибка чтения файла: {e}")
    sys.exit(1)

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
        alias /home/miniapp_expert/api-django/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /home/miniapp_expert/api-django/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

'''

# Найти location / и добавить перед ним
# Ищем паттерн с разными вариантами отступов
patterns = [
    r'(\s+)(location\s+/\s*\{)',
    r'(\s+)(location\s*/\s*\{)',
    r'(location\s+/\s*\{)',
]

new_content = content
inserted = False

for pattern in patterns:
    matches = list(re.finditer(pattern, content))
    if matches:
        # Берем первый match (должен быть location /)
        match = matches[0]
        if len(match.groups()) == 2:
            indent = match.group(1)
            location = match.group(2)
            new_content = content[:match.start()] + django_config + indent + location + content[match.end():]
        else:
            location = match.group(1)
            new_content = content[:match.start()] + django_config + '    ' + location + content[match.end():]
        inserted = True
        break

if not inserted:
    # Если не нашли, попробуем вставить перед последним location /
    lines = content.split('\n')
    for i in range(len(lines) - 1, -1, -1):
        if re.match(r'^\s+location\s+/\s*\{', lines[i]):
            # Найти отступ
            indent = re.match(r'^(\s*)', lines[i]).group(1)
            lines.insert(i, django_config.rstrip())
            new_content = '\n'.join(lines)
            inserted = True
            break

if not inserted:
    print("⚠️  Не удалось найти location /, добавляю в конец server блока")
    # Добавляем перед закрывающей скобкой server блока
    server_pattern = r'(server\s*\{[^}]*)(\s+\})'
    def add_before_close(match):
        return match.group(1) + django_config + match.group(2)
    new_content = re.sub(server_pattern, add_before_close, content, flags=re.DOTALL)

try:
    with open(conf_file, 'w') as f:
        f.write(new_content)
    print("✅ Конфигурация Nginx обновлена")
except Exception as e:
    print(f"❌ Ошибка записи файла: {e}")
    sys.exit(1)
PYTHON

# Проверить и перезагрузить Nginx
echo "🔍 Проверка конфигурации Nginx..."
if nginx -t 2>&1; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    echo "Проверьте файл: $NGINX_CONF"
    exit 1
fi

# 2. Проверить Django API
echo ""
echo "🔍 Проверка Django API..."

# Проверить, запущен ли API через Docker
if docker ps | grep -q miniapp_api; then
    echo "✅ Django API контейнер запущен"
    echo "🔄 Перезапуск API..."
    docker-compose restart api 2>/dev/null || docker restart miniapp_api 2>/dev/null || echo "⚠️  Не удалось перезапустить через docker-compose"
else
    echo "⚠️  Django API контейнер не найден"
    echo "Проверьте, запущен ли API:"
    echo "  docker ps | grep api"
    echo "  или"
    echo "  systemctl status miniapp-api"
fi

# 3. Проверка
echo ""
echo "🔍 Проверка работы API..."
sleep 3

echo "Health check (локально):"
curl -s http://127.0.0.1:8000/api/auth/health/ 2>&1 | head -5 || echo "⚠️  API не отвечает на порту 8000"

echo ""
echo "Health check (через Nginx):"
curl -s https://miniapp.expert/api/auth/health/ 2>&1 | head -5 || echo "⚠️  Nginx не проксирует запросы"

echo ""
echo "✅ Готово!"
echo ""
echo "Проверьте:"
echo "1. https://miniapp.expert/api/auth/health/ - должен вернуть JSON"
echo "2. https://miniapp.expert/admin/ - должна открыться Django Admin"
echo "3. https://miniapp.expert/api/auth/login/ - должен вернуть информацию о POST методе"
echo ""
echo "Если не работает:"
echo "  - Проверьте логи: docker logs miniapp_api"
echo "  - Проверьте, что API запущен: docker ps | grep api"
echo "  - Проверьте конфигурацию Nginx: nginx -t"

