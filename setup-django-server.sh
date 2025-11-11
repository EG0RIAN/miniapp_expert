#!/bin/bash
# Скрипт для настройки Django API на сервере

set -e

echo "🚀 Настройка Django API на сервере..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Переменные
PROJECT_DIR="/path/to/project"
API_DIR="$PROJECT_DIR/api-django"
VENV_DIR="$API_DIR/venv"
USER="www-data"

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Пожалуйста, запустите скрипт от root${NC}"
    exit 1
fi

# 1. Установка зависимостей системы
echo -e "${YELLOW}1. Установка зависимостей системы...${NC}"
apt-get update
apt-get install -y python3 python3-pip python3-venv postgresql-client nginx

# 2. Создание виртуального окружения
echo -e "${YELLOW}2. Создание виртуального окружения...${NC}"
cd $API_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Настройка переменных окружения
echo -e "${YELLOW}3. Настройка переменных окружения...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}Файл .env не найден! Создайте его вручную.${NC}"
    exit 1
fi

# 4. Применение миграций
echo -e "${YELLOW}4. Применение миграций...${NC}"
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate

# 5. Создание суперпользователя (если не существует)
echo -e "${YELLOW}5. Создание суперпользователя...${NC}"
python manage.py createsuperuser --noinput || echo "Суперпользователь уже существует"

# 6. Сбор статических файлов
echo -e "${YELLOW}6. Сбор статических файлов...${NC}"
python manage.py collectstatic --noinput

# 7. Установка прав доступа
echo -e "${YELLOW}7. Установка прав доступа...${NC}"
chown -R $USER:$USER $API_DIR
chmod -R 755 $API_DIR

# 8. Создание systemd service
echo -e "${YELLOW}8. Создание systemd service...${NC}"
cat > /etc/systemd/system/miniapp-api.service << EOF
[Unit]
Description=MiniApp Expert Django API
After=network.target postgresql.service

[Service]
User=$USER
Group=$USER
WorkingDirectory=$API_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/gunicorn miniapp_api.wsgi:application --bind 127.0.0.1:8000 --workers 4 --timeout 120
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Установка Gunicorn (если не установлен)
echo -e "${YELLOW}9. Установка Gunicorn...${NC}"
source venv/bin/activate
pip install gunicorn

# 10. Запуск сервиса
echo -e "${YELLOW}10. Запуск сервиса...${NC}"
systemctl daemon-reload
systemctl enable miniapp-api
systemctl start miniapp-api
systemctl status miniapp-api

# 11. Настройка Nginx (базовая конфигурация)
echo -e "${YELLOW}11. Настройка Nginx...${NC}"
cat > /etc/nginx/sites-available/miniapp-api << EOF
# API endpoints
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 120s;
}

# Django Admin
location /admin/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

# Static files
location /static/ {
    alias $API_DIR/staticfiles/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Media files
location /media/ {
    alias $API_DIR/media/;
    expires 7d;
    add_header Cache-Control "public";
}
EOF

echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Добавьте конфигурацию Nginx в основной конфиг сайта"
echo "2. Перезапустите Nginx: systemctl reload nginx"
echo "3. Проверьте статус API: systemctl status miniapp-api"
echo "4. Проверьте логи: journalctl -u miniapp-api -f"

