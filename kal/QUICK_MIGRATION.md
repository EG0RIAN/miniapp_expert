# Быстрая миграция на Django

## Автоматическая миграция (рекомендуется)

```bash
# Запустить скрипт миграции
./migrate-to-django.sh
```

Скрипт выполнит:
1. ✅ Остановку старого API
2. ✅ Создание бэкапа БД
3. ✅ Загрузку кода Django на сервер
4. ✅ Настройку окружения
5. ✅ Применение миграций
6. ✅ Миграцию данных (опционально)
7. ✅ Запуск нового API
8. ✅ Обновление Nginx

## Ручная миграция

### 1. На сервере

```bash
# Подключиться к серверу
ssh root@85.198.110.66

# Перейти в директорию проекта
cd /root/rello

# Остановить старый API
docker-compose down api

# Создать бэкап БД
docker exec miniapp_postgres pg_dump -U miniuser miniapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Загрузить Django код

```bash
# С локальной машины
rsync -avz --exclude 'venv' --exclude '__pycache__' ./api-django/ root@85.198.110.66:/root/rello/api-django/
```

### 3. Настроить Django на сервере

```bash
# На сервере
cd /root/rello/api-django

# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Создать .env файл
cp .env.example .env
# Отредактировать .env с вашими настройками

# Применить миграции
python manage.py makemigrations
python manage.py migrate

# Создать суперпользователя
python manage.py createsuperuser

# Собрать статические файлы
python manage.py collectstatic --noinput
```

### 4. Мигрировать данные

```bash
# Пробный запуск
python manage.py migrate_from_adonis \
    --old-db-host=postgres \
    --old-db-port=5432 \
    --old-db-name=miniapp \
    --old-db-user=miniuser \
    --old-db-password=minipass \
    --dry-run

# Реальная миграция
python manage.py migrate_from_adonis \
    --old-db-host=postgres \
    --old-db-port=5432 \
    --old-db-name=miniapp \
    --old-db-user=miniuser \
    --old-db-password=minipass
```

### 5. Запустить через Docker

```bash
# Обновить docker-compose.yml
cp docker-compose-django.yml docker-compose.yml

# Запустить
docker-compose up -d --build api

# Проверить логи
docker-compose logs -f api
```

### 6. Обновить Nginx

```bash
# Добавить в /etc/nginx/sites-available/miniapp.expert
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

# Перезагрузить Nginx
nginx -t && systemctl reload nginx
```

## Проверка

```bash
# Проверить API
curl https://miniapp.expert/api/auth/login/

# Проверить админку
curl https://miniapp.expert/admin/

# Проверить логи
docker-compose logs -f api
```

## Откат (если что-то пошло не так)

```bash
# Восстановить старый API
docker-compose down api
docker-compose up -d api  # Запустит старый AdonisJS API

# Восстановить БД из бэкапа
docker exec -i miniapp_postgres psql -U miniuser miniapp < backup_YYYYMMDD_HHMMSS.sql
```

## Проблемы и решения

### Ошибка подключения к БД

```bash
# Проверить, что PostgreSQL запущен
docker-compose ps postgres

# Проверить подключение
docker exec miniapp_postgres psql -U miniuser -d miniapp -c "SELECT 1"
```

### Ошибка миграции

```bash
# Проверить логи
docker-compose logs api

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

