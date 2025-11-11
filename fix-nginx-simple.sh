#!/bin/bash
# Простой скрипт для добавления конфигурации Django Admin в Nginx

set -e

SERVER="85.198.110.66"
USER="root"

echo "🔧 Добавление конфигурации Django Admin в Nginx..."

ssh $USER@$SERVER << 'ENDSSH'
NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"

# Создать бэкап
cp $NGINX_CONF ${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Бэкап создан"

# Проверить, что файл существует
if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ Файл $NGINX_CONF не найден"
    exit 1
fi

# Удалить старые location блоки для /admin/ и /api/ если они есть
sed -i '/location \/admin\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/api\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/static\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF
sed -i '/location \/media\/ {/,/^[[:space:]]*}$/d' $NGINX_CONF

# Найти строку с "location /" и добавить перед ней конфигурацию для Django
# Ищем блок server и добавляем перед location /
python3 << 'PYTHON_SCRIPT'
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
# Ищем паттерн: location / с возможными пробелами перед закрывающей скобкой
pattern = r'(location\s+/\s*\{)'

def add_before_location(match):
    return django_config + '    ' + match.group(1)

new_content = re.sub(pattern, add_before_location, content)

# Если не нашлось, попробуем добавить перед закрывающей скобкой server блока
if new_content == content:
    # Найти последнюю строку перед закрывающей скобкой server в HTTPS блоке
    # Ищем server блок с SSL
    ssl_server_pattern = r'(server\s*\{[^}]*listen\s+443[^}]*?)(location\s+/\s*\{[^}]*?\n\s*\})'
    
    def add_in_ssl_server(match):
        server_start = match.group(1)
        location_block = match.group(2)
        return server_start + django_config + '    ' + location_block
    
    new_content = re.sub(ssl_server_pattern, add_in_ssl_server, content, flags=re.DOTALL)

# Если все еще не изменилось, добавляем вручную перед location /
if new_content == content:
    # Просто вставляем перед первым location /
    new_content = content.replace(
        '    location / {',
        django_config + '    location / {'
    )

with open(conf_file, 'w') as f:
    f.write(new_content)

print("✅ Конфигурация добавлена в файл")
PYTHON_SCRIPT

# Проверить конфигурацию
echo "Проверка конфигурации Nginx..."
if nginx -t 2>&1; then
    echo "✅ Конфигурация корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации, восстанавливаем бэкап..."
    cp ${NGINX_CONF}.backup.* $NGINX_CONF
    exit 1
fi

ENDSSH

echo ""
echo "✅ Готово!"
echo ""
echo "Теперь проверьте:"
echo "1. https://miniapp.expert/admin/ - должна открыться Django Admin"
echo "2. https://miniapp.expert/api/auth/login/ - должен работать API"
echo ""
echo "Если не работает, проверьте:"
echo "- docker ps | grep miniapp_api (API должен быть запущен)"
echo "- docker logs miniapp_api (логи API)"

