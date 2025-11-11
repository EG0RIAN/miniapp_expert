#!/bin/bash
# Скрипт для исправления Nginx конфигурации для Django Admin

set -e

echo "🔧 Исправление Nginx конфигурации для Django Admin..."

SERVER="85.198.110.66"
USER="root"
NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"

ssh $USER@$SERVER << 'ENDSSH'
# Создать бэкап конфига
cp /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-available/miniapp.expert.backup.$(date +%Y%m%d_%H%M%S)

# Проверить, есть ли уже конфигурация для /admin/ и /api/
if grep -q "location /admin/" /etc/nginx/sites-available/miniapp.expert; then
    echo "⚠️  Конфигурация для /admin/ уже существует, обновляю..."
    # Удалить старую конфигурацию
    sed -i '/location \/admin\/ {/,/^[[:space:]]*}$/d' /etc/nginx/sites-available/miniapp.expert
fi

if grep -q "location /api/" /etc/nginx/sites-available/miniapp.expert; then
    echo "⚠️  Конфигурация для /api/ уже существует, обновляю..."
    # Удалить старую конфигурацию для /api/ (но не для статических файлов)
    sed -i '/location \/api\/ {/,/^[[:space:]]*}$/d' /etc/nginx/sites-available/miniapp.expert
fi

# Найти блок server и добавить конфигурацию ПЕРЕД location / 
# (чтобы /admin/ и /api/ имели приоритет над статическими файлами)

# Временный файл для новой конфигурации
TMP_FILE=$(mktemp)

# Читаем конфиг и добавляем location блоки перед последним location /
python3 << 'PYTHON'
import re
import sys

with open('/etc/nginx/sites-available/miniapp.expert', 'r') as f:
    content = f.read()

# Найти блок server
server_block_pattern = r'(server\s*\{[^}]*?)(location\s+/\s*\{[^}]*?\})'

def add_locations(match):
    server_content = match.group(1)
    root_location = match.group(2)
    
    # Добавить location блоки для API и Admin перед root location
    api_admin_config = '''
    # Django API и Admin
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
    
    return server_content + api_admin_config + '\n    ' + root_location

# Заменить в блоке server
new_content = re.sub(server_block_pattern, add_locations, content, flags=re.DOTALL)

# Если не нашли через regex, добавим вручную перед location /
if new_content == content:
    # Найти последний location / перед закрывающей скобкой server
    pattern = r'(\s+)(location\s+/\s*\{[^}]*?root[^}]*?\})'
    def add_before_root(match):
        indent = match.group(1)
        root_loc = match.group(2)
        
        api_admin = '''
    # Django API и Admin
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
        return api_admin + indent + root_loc
    
    new_content = re.sub(pattern, add_before_root, content, flags=re.DOTALL)

with open('/etc/nginx/sites-available/miniapp.expert', 'w') as f:
    f.write(new_content)

print("✅ Конфигурация обновлена")
PYTHON

# Проверить конфигурацию
if nginx -t; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

ENDSSH

echo "✅ Готово! Теперь /admin/ должен проксироваться на Django API"

