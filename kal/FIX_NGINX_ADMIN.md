# Исправление Nginx для Django Admin

## Проблема

При открытии `https://miniapp.expert/admin/` открывается главная страница сайта вместо Django Admin.

## Причина

Nginx не настроен для проксирования запросов `/admin/` и `/api/` на Django API (порт 8000).

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

```bash
# Запустить скрипт исправления
./fix-nginx-simple.sh
```

### Вариант 2: Ручное исправление

#### 1. Подключиться к серверу

```bash
ssh root@85.198.110.66
```

#### 2. Создать бэкап конфига

```bash
cp /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-available/miniapp.expert.backup.$(date +%Y%m%d_%H%M%S)
```

#### 3. Отредактировать конфиг

```bash
nano /etc/nginx/sites-available/miniapp.expert
```

#### 4. Найти блок `server` для HTTPS (порт 443) и добавить ПЕРЕД `location / {`:

```nginx
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

# Статический сайт (должен быть последним)
location / {
    root /var/www/miniapp.expert;
    try_files $uri $uri/ /index.html;
}
```

#### 5. Важно: порядок location блоков!

Location блоки должны быть в таком порядке:
1. `/api/` - первый
2. `/admin/` - второй
3. `/static/` - третий
4. `/media/` - четвертый
5. `/` - последний (catch-all)

Это важно, потому что Nginx проверяет location блоки в порядке их объявления, и если `/` будет первым, он перехватит все запросы.

#### 6. Проверить конфигурацию

```bash
nginx -t
```

Должно быть: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

#### 7. Перезагрузить Nginx

```bash
systemctl reload nginx
```

### Вариант 3: Через скрипт на сервере

```bash
# На сервере
cd /root/rello

# Скачать правильный конфиг
cat > /tmp/nginx-django-locations.conf << 'EOF'
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
EOF

# Вставить перед location / в конфиге
# (нужно вручную отредактировать файл)
nano /etc/nginx/sites-available/miniapp.expert
```

## Проверка

### 1. Проверить, что API запущен

```bash
docker ps | grep miniapp_api
# Должен быть запущен контейнер

# Проверить логи
docker logs miniapp_api
```

### 2. Проверить, что API доступен локально

```bash
curl http://127.0.0.1:8000/admin/
# Должен вернуть HTML страницу Django Admin

curl http://127.0.0.1:8000/api/auth/login/
# Должен вернуть JSON ответ
```

### 3. Проверить через браузер

```
https://miniapp.expert/admin/
```

Должна открыться страница входа в Django Admin, а не главная страница сайта.

### 4. Проверить API

```
https://miniapp.expert/api/auth/login/
```

Должен вернуть JSON ответ, а не HTML страницу.

## Откат (если что-то пошло не так)

```bash
# Восстановить бэкап
cp /etc/nginx/sites-available/miniapp.expert.backup.* /etc/nginx/sites-available/miniapp.expert

# Перезагрузить Nginx
systemctl reload nginx
```

## Troubleshooting

### Ошибка "502 Bad Gateway"

**Причина:** Django API не запущен или недоступен на порту 8000

**Решение:**
```bash
# Проверить, запущен ли API
docker ps | grep miniapp_api

# Если не запущен, запустить
cd /root/rello
docker-compose up -d api

# Проверить логи
docker logs miniapp_api
```

### Ошибка "404 Not Found"

**Причина:** Неправильный путь в proxy_pass или API не обрабатывает этот путь

**Решение:**
1. Проверить, что в конфиге правильно указан `proxy_pass http://127.0.0.1:8000;`
2. Проверить, что Django API обрабатывает путь `/admin/`
3. Проверить логи Django: `docker logs miniapp_api`

### Ошибка "CSRF verification failed"

**Причина:** Django требует правильные заголовки для CSRF

**Решение:** Убедиться, что в конфиге есть:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

### Админка открывается, но без стилей (CSS)

**Причина:** Статические файлы не собираны или неправильный путь

**Решение:**
```bash
# Собрать статические файлы
docker exec miniapp_api python manage.py collectstatic --noinput

# Проверить, что файлы на месте
ls -la /root/rello/api-django/staticfiles/

# Проверить, что Nginx правильно настроен для /static/
```

## Полный пример конфига

```nginx
server {
    listen 443 ssl http2;
    server_name miniapp.expert;

    ssl_certificate /etc/letsencrypt/live/miniapp.expert/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miniapp.expert/privkey.pem;

    # Django API - ПЕРВЫМ!
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Django Admin - ВТОРЫМ!
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Static files - ТРЕТЬИМ!
    location /static/ {
        alias /root/rello/api-django/staticfiles/;
        expires 30d;
    }

    # Media files - ЧЕТВЕРТЫМ!
    location /media/ {
        alias /root/rello/api-django/media/;
        expires 7d;
    }

    # Статический сайт - ПОСЛЕДНИМ!
    location / {
        root /var/www/miniapp.expert;
        try_files $uri $uri/ /index.html;
    }
}
```

