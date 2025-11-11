#!/bin/bash
# Быстрый скрипт миграции на Django на сервере

set -e

echo "🚀 Миграция на Django REST Framework..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Параметры
SERVER="85.198.110.66"
USER="root"
PROJECT_DIR="/root/rello"
API_DIR="$PROJECT_DIR/api-django"

echo -e "${YELLOW}Подключение к серверу $SERVER...${NC}"

# 1. Остановить старый API
echo -e "${YELLOW}1. Остановка старого API...${NC}"
ssh $USER@$SERVER "cd $PROJECT_DIR && docker-compose down api || true"

# 2. Создать бэкап БД
echo -e "${YELLOW}2. Создание бэкапа БД...${NC}"
ssh $USER@$SERVER "docker exec miniapp_postgres pg_dump -U miniuser miniapp > /tmp/miniapp_backup_$(date +%Y%m%d_%H%M%S).sql"

# 3. Загрузить код Django на сервер
echo -e "${YELLOW}3. Загрузка кода Django на сервер...${NC}"
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' \
    ./api-django/ $USER@$SERVER:$API_DIR/

# 4. Настройка на сервере
echo -e "${YELLOW}4. Настройка на сервере...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
cd /root/rello/api-django

# Создать виртуальное окружение
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Создать .env если не существует
if [ ! -f .env ]; then
    cat > .env << EOF
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=miniapp.expert,85.198.110.66,localhost

DATABASE_URL=postgresql://miniuser:minipass@postgres:5432/miniapp
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=miniapp
DB_USER=miniuser
DB_PASSWORD=minipass

TBANK_TERMINAL_KEY=${TBANK_TERMINAL_KEY}
TBANK_PASSWORD=${TBANK_PASSWORD}
TBANK_API_URL=https://securepay.tinkoff.ru/v2

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=465
SMTP_USE_TLS=True
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>

APP_BASE_URL=https://miniapp.expert
FRONTEND_BASE_URL=https://miniapp.expert
API_BASE_URL=https://miniapp.expert

MAGIC_SECRET=${MAGIC_SECRET}
CORS_ALLOWED_ORIGINS=https://miniapp.expert
EOF
fi

# Применить миграции
python manage.py makemigrations
python manage.py migrate

# Создать суперпользователя (если не существует)
echo "from apps.users.models import User; User.objects.filter(email='admin@miniapp.expert').exists() or User.objects.create_superuser('admin@miniapp.expert', 'admin123')" | python manage.py shell || true

# Собрать статические файлы
python manage.py collectstatic --noinput

ENDSSH

# 5. Миграция данных (если нужно)
echo -e "${YELLOW}5. Миграция данных из старой БД...${NC}"
read -p "Мигрировать данные из старой БД? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh $USER@$SERVER << 'ENDSSH'
cd /root/rello/api-django
source venv/bin/activate

# Пробный запуск миграции
python manage.py migrate_from_adonis \
    --old-db-host=postgres \
    --old-db-port=5432 \
    --old-db-name=miniapp \
    --old-db-user=miniuser \
    --old-db-password=minipass \
    --dry-run

# Если все OK, запустить реальную миграцию
read -p "Продолжить миграцию? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py migrate_from_adonis \
        --old-db-host=postgres \
        --old-db-port=5432 \
        --old-db-name=miniapp \
        --old-db-user=miniuser \
        --old-db-password=minipass
fi
ENDSSH
fi

# 6. Обновить docker-compose
echo -e "${YELLOW}6. Обновление docker-compose...${NC}"
ssh $USER@$SERVER "cd $PROJECT_DIR && cp docker-compose.yml docker-compose-adonis-backup.yml"
scp docker-compose-django.yml $USER@$SERVER:$PROJECT_DIR/docker-compose.yml

# 7. Запустить новый API
echo -e "${YELLOW}7. Запуск нового API...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
cd /root/rello

# Остановить старый API
docker-compose down api || true

# Запустить новый API через Docker
docker-compose up -d --build api

# Или через systemd (если настроен)
# systemctl restart miniapp-api
ENDSSH

# 8. Обновить Nginx конфигурацию
echo -e "${YELLOW}8. Обновление Nginx...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
# Добавить проксирование на Django API в Nginx конфиг
cat >> /etc/nginx/sites-available/miniapp.expert << 'EOF'

# Django API
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
}
EOF

nginx -t && systemctl reload nginx
ENDSSH

echo -e "${GREEN}✅ Миграция завершена!${NC}"
echo -e "${YELLOW}Проверьте:${NC}"
echo "1. API: https://miniapp.expert/api/admin/orders/"
echo "2. Admin: https://miniapp.expert/admin/"
echo "3. Логи: docker-compose logs -f api"

