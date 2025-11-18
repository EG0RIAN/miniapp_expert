# Руководство по миграции на Django REST Framework

## Подготовка

### 1. Резервное копирование данных

```bash
# Создать бэкап старой БД
pg_dump -h localhost -U miniuser -d miniapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Или через Docker
docker exec miniapp_postgres pg_dump -U miniuser miniapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Установка Django проекта

```bash
cd api-django
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env с настройками вашей БД
```

## Миграция данных

### Вариант 1: Миграция из той же БД (рекомендуется)

Если Django использует ту же БД, что и AdonisJS:

```bash
# 1. Создать миграции Django
python manage.py makemigrations

# 2. Применить миграции (создаст новые таблицы)
python manage.py migrate

# 3. Запустить миграцию данных
python manage.py migrate_from_adonis \
    --old-db-host=localhost \
    --old-db-port=5432 \
    --old-db-name=miniapp \
    --old-db-user=miniuser \
    --old-db-password=minipass

# 4. Пробный запуск (без сохранения)
python manage.py migrate_from_adonis \
    --old-db-host=localhost \
    --old-db-port=5432 \
    --old-db-name=miniapp \
    --old-db-user=miniuser \
    --old-db-password=minipass \
    --dry-run
```

### Вариант 2: Миграция из другой БД

Если данные в другой БД:

```bash
python manage.py migrate_from_adonis \
    --old-db-host=old-server.com \
    --old-db-port=5432 \
    --old-db-name=old_miniapp \
    --old-db-user=old_user \
    --old-db-password=old_password
```

## Настройка на сервере

### 1. Установка зависимостей на сервере

```bash
# На сервере
cd /path/to/project/api-django
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

```bash
# Создать .env файл
cat > .env << EOF
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=miniapp.expert,85.198.110.66

DATABASE_URL=postgresql://miniuser:minipass@localhost:5432/miniapp
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=miniapp
DB_USER=miniuser
DB_PASSWORD=minipass

TBANK_TERMINAL_KEY=your-terminal-key
TBANK_PASSWORD=your-password
TBANK_API_URL=https://securepay.tinkoff.ru/v2

SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USE_TLS=True
SMTP_USER=no-reply@miniapp.expert
SMTP_PASS=your-password
MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>

APP_BASE_URL=https://miniapp.expert
FRONTEND_BASE_URL=https://miniapp.expert
API_BASE_URL=https://miniapp.expert

MAGIC_SECRET=your-magic-secret
CORS_ALLOWED_ORIGINS=https://miniapp.expert
EOF
```

### 3. Применение миграций

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Сбор статических файлов

```bash
python manage.py collectstatic --noinput
```

### 5. Настройка Nginx

```nginx
# /etc/nginx/sites-available/miniapp.expert
server {
    listen 80;
    server_name miniapp.expert;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name miniapp.expert;

    ssl_certificate /etc/letsencrypt/live/miniapp.expert/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miniapp.expert/privkey.pem;

    # Статические файлы
    location /static/ {
        alias /path/to/project/api-django/staticfiles/;
    }

    location /media/ {
        alias /path/to/project/api-django/media/;
    }

    # API и Admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (статический сайт)
    location / {
        root /var/www/miniapp.expert;
        try_files $uri $uri/ /index.html;
    }
}
```

### 6. Настройка systemd service

```bash
# /etc/systemd/system/miniapp-api.service
[Unit]
Description=MiniApp Expert Django API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/project/api-django
Environment="PATH=/path/to/project/api-django/venv/bin"
ExecStart=/path/to/project/api-django/venv/bin/gunicorn miniapp_api.wsgi:application --bind 127.0.0.1:8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Запустить сервис
sudo systemctl daemon-reload
sudo systemctl enable miniapp-api
sudo systemctl start miniapp-api
sudo systemctl status miniapp-api
```

### 7. Использование Docker (альтернатива)

```bash
# Обновить docker-compose.yml
docker-compose -f docker-compose-django.yml down
docker-compose -f docker-compose-django.yml up -d --build

# Проверить логи
docker-compose -f docker-compose-django.yml logs -f api
```

## Проверка после миграции

### 1. Проверка данных

```bash
# Войти в Django shell
python manage.py shell

# Проверить количество пользователей
from apps.users.models import User
print(User.objects.count())

# Проверить количество заказов
from apps.orders.models import Order
print(Order.objects.count())

# Проверить количество платежей
from apps.payments.models import Payment
print(Payment.objects.count())
```

### 2. Проверка API

```bash
# Проверить health endpoint
curl http://localhost:8000/api/auth/login/

# Проверить админку
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/admin/orders/
```

### 3. Проверка Django Admin

Откройте http://miniapp.expert/admin/ и проверьте:
- Пользователи
- Заказы
- Платежи
- Транзакции
- Рефералы

## Откат (если что-то пошло не так)

```bash
# Восстановить бэкап
psql -h localhost -U miniuser -d miniapp < backup_YYYYMMDD_HHMMSS.sql

# Или переключиться обратно на AdonisJS
docker-compose up -d
```

## Полезные команды

```bash
# Создать суперпользователя
python manage.py createsuperuser

# Обновить пароль пользователя
python manage.py changepassword admin

# Очистить сессии
python manage.py clearsessions

# Экспорт данных
python manage.py dumpdata > data.json

# Импорт данных
python manage.py loaddata data.json
```

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверить подключение
psql -h localhost -U miniuser -d miniapp

# Проверить права доступа
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE miniapp TO miniuser;"
```

### Ошибка миграции

```bash
# Откатить миграции
python manage.py migrate app_name zero

# Применить заново
python manage.py migrate
```

### Ошибка статических файлов

```bash
# Пересобрать статические файлы
python manage.py collectstatic --noinput --clear
```

## Следующие шаги

1. ✅ Миграция данных завершена
2. ✅ Django API запущен
3. ✅ Nginx настроен
4. ⏳ Обновить фронтенд для работы с новым API
5. ⏳ Настроить мониторинг
6. ⏳ Настроить бэкапы

