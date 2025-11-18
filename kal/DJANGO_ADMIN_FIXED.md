# Django Admin - Исправлено ✅

## Проблема

При обращении к `https://miniapp.expert/admin/` открывалась главная страница сайта вместо Django Admin.

## Причина

1. **Конфликт статических файлов**: Файл `/var/www/miniapp.expert/admin.html` перехватывал запросы
2. **Неправильный симлинк**: Файл в `/etc/nginx/sites-enabled/miniapp.expert` был обычным файлом, а не симлинком на `/etc/nginx/sites-available/miniapp.expert`
3. **Старая конфигурация**: Nginx использовал старую конфигурацию с `proxy_pass http://miniapp_api/api/` (старый AdonisJS API на порту 3333)

## Решение

### 1. Удаление конфликтующих файлов
```bash
cd /var/www/miniapp.expert
rm -f admin.html admin.html.old
```

### 2. Исправление конфигурации Nginx
Создан правильный конфигурационный файл `/etc/nginx/sites-available/miniapp.expert`:

```nginx
server {
    listen 443 ssl;
    server_name miniapp.expert www.miniapp.expert;
    
    ssl_certificate /etc/letsencrypt/live/miniapp.expert-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miniapp.expert-0001/privkey.pem;
    
    root /var/www/miniapp.expert;
    index index.html;
    
    # Django API - ПЕРВЫМ
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # Django Admin - ПЕРЕД location / (используем ^~ для приоритета)
    location ^~ /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # Редирект /admin на /admin/
    location = /admin {
        return 301 /admin/;
    }

    # Static files для Django
    location /static/ {
        alias /home/miniapp_expert/api-django/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files для Django
    location /media/ {
        alias /home/miniapp_expert/api-django/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Статический сайт - ПОСЛЕДНИМ
    location / {
        root /var/www/miniapp.expert;
        try_files $uri $uri/ =404;
        index index.html;
    }
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

### 3. Исправление симлинка
```bash
rm -f /etc/nginx/sites-enabled/miniapp.expert
ln -s /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-enabled/miniapp.expert
nginx -t
systemctl reload nginx
```

## Важные моменты

1. **Порядок location блоков**: `/api/` и `/admin/` должны быть ПЕРЕД `location /`
2. **Приоритет `^~`**: Использование `location ^~ /admin/` гарантирует, что этот блок имеет приоритет над `location /`
3. **Статические файлы Django**: Путь к staticfiles должен быть правильным (`/home/miniapp_expert/api-django/staticfiles/`)
4. **Django API**: Должен быть запущен на `127.0.0.1:8000` через Gunicorn

## Проверка

```bash
# Проверка редиректа
curl -I https://miniapp.expert/admin/
# Должен вернуть: HTTP/1.1 302 Found
# Location: /admin/login/?next=/admin/

# Проверка страницы входа
curl -L https://miniapp.expert/admin/ | head -20
# Должна быть страница входа Django Admin

# Проверка API
curl https://miniapp.expert/api/auth/health/
# Должен вернуть JSON с статусом "ok"
```

## Доступ к Django Admin

1. Откройте `https://miniapp.expert/admin/` в браузере
2. Войдите с учетными данными суперпользователя:
   - Email: `admin@miniapp.expert`
   - Password: `admin123` (или тот, который был установлен)

## Создание суперпользователя

Если суперпользователь не создан:

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py createsuperuser
```

## Статус

✅ Django Admin доступен по адресу `https://miniapp.expert/admin/`
✅ Django API работает на `https://miniapp.expert/api/`
✅ Статический сайт доступен на `https://miniapp.expert/`

