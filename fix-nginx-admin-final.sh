#!/bin/bash
# Финальное исправление Nginx для Django Admin

set -e

NGINX_CONF="/etc/nginx/sites-available/miniapp.expert"
BACKUP="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Исправление Nginx конфигурации для Django Admin..."

# Создать бэкап
cp "$NGINX_CONF" "$BACKUP"
echo "✅ Бэкап создан: $BACKUP"

# Создать правильную конфигурацию
python3 << 'PYTHON'
import re

conf_file = '/etc/nginx/sites-available/miniapp.expert'

with open(conf_file, 'r') as f:
    content = f.read()

# Найти server блок для HTTPS
server_pattern = r'(server\s*\{[^}]*listen\s+443[^}]*?)(location\s+/\s*\{[^}]*?\})'

# Правильная конфигурация location блоков
new_locations = '''
    # Django API - должен быть первым (более специфичный путь)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_redirect off;
    }

    # Django Admin - должен быть перед location /
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_redirect off;
    }

    # Static files для Django
    location /static/ {
        alias /home/miniapp_expert/api-django/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files для Django
    location /media/ {
        alias /home/miniapp_expert/api-django/media/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Статический сайт - должен быть последним
    location / {
        root /var/www/miniapp.expert;
        try_files $uri $uri/ =404;
        index index.html;
    }
'''

# Удалить все старые location блоки внутри server блока
# Найдем server блок и заменим его содержимое
def replace_server_locations(match):
    server_start = match.group(1)
    # Удалим все location блоки внутри
    server_content = match.group(0)
    # Найдем закрывающую скобку server блока
    # Упростим: найдем последний location / и заменим все location блоки
    return server_start + new_locations + '\n    }\n'

# Более простой подход: найти все location блоки и заменить их
# Удалим все location блоки
content = re.sub(r'\s+location\s+/\s*\{[^}]*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'\s+location\s+/api/\s*\{[^}]*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'\s+location\s+/admin/\s*\{[^}]*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'\s+location\s+/static/\s*\{[^}]*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'\s+location\s+/media/\s*\{[^}]*?\}', '', content, flags=re.DOTALL)

# Добавим новые location блоки перед закрывающей скобкой server блока
# Найдем место перед закрывающей скобкой server блока (после gzip настроек)
gzip_pattern = r'(gzip_types[^;]*;)\s*(\})'

def add_locations_after_gzip(match):
    return match.group(1) + new_locations + match.group(2)

content = re.sub(gzip_pattern, add_locations_after_gzip, content, flags=re.DOTALL)

# Если не нашли gzip, попробуем добавить перед последней закрывающей скобкой server
if 'location /api/' not in content:
    # Найдем последнюю закрывающую скобку перед закрывающей скобкой server
    server_end_pattern = r'(\s+gzip[^}]*?)(\n\s*\})'
    def add_before_server_end(match):
        return match.group(1) + new_locations + match.group(2)
    content = re.sub(server_end_pattern, add_before_server_end, content, flags=re.DOTALL)

with open(conf_file, 'w') as f:
    f.write(content)

print("✅ Конфигурация обновлена")
PYTHON

# Проверить конфигурацию
if nginx -t 2>&1; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    echo "Восстанавливаем бэкап..."
    cp "$BACKUP" "$NGINX_CONF"
    exit 1
fi

echo ""
echo "✅ Готово!"
echo ""
echo "Проверьте:"
echo "  curl -I https://miniapp.expert/admin/"
echo "  curl -I https://miniapp.expert/api/auth/health/"

