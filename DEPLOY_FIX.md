# Исправление Django API и Nginx на сервере

## Проблема

Ошибка `{"message":"Cannot GET:/api/auth/login/"}` означает, что:
1. ✅ Nginx правильно проксирует запросы на Django API
2. ✅ Django API запущен
3. ❌ Endpoint `/api/auth/login/` принимает только POST, а не GET

## Решение

### Шаг 1: Загрузить обновленный код на сервер

**С локальной машины:**
```bash
# Использовать sshpass или ввести пароль вручную
sshpass -p 'h421-5882p7vUqkFn+EF' rsync -avz \
  --exclude 'venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'staticfiles' \
  --exclude 'media' \
  ./api-django/ root@85.198.110.66:/root/rello/api-django/
```

**Или через обычный SSH (ввести пароль вручную):**
```bash
rsync -avz --exclude 'venv' --exclude '__pycache__' ./api-django/ root@85.198.110.66:/root/rello/api-django/
```

### Шаг 2: Выполнить скрипт исправления на сервере

**На сервере:**
```bash
ssh root@85.198.110.66

# Загрузить скрипт на сервер (если его там нет)
# Или скопировать содержимое fix-api-on-server.sh и выполнить вручную

# Выполнить скрипт
cd /root/rello
bash fix-api-on-server.sh
```

### Шаг 3: Или выполнить команды вручную

**На сервере:**
```bash
cd /root/rello

# 1. Исправить Nginx
nano /etc/nginx/sites-available/miniapp.expert

# Добавить перед location / {:
#     location /api/ {
#         proxy_pass http://127.0.0.1:8000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_read_timeout 120s;
#     }
#
#     location /admin/ {
#         proxy_pass http://127.0.0.1:8000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_read_timeout 120s;
#     }

# 2. Проверить конфигурацию
nginx -t

# 3. Перезагрузить Nginx
systemctl reload nginx

# 4. Перезапустить API
docker-compose restart api

# 5. Проверить логи
docker logs miniapp_api --tail 50
```

## Проверка

После исправления проверьте:

### 1. Health endpoint (GET)
```bash
curl https://miniapp.expert/api/auth/health/
```

Должен вернуть:
```json
{
  "status": "ok",
  "service": "miniapp-expert-api",
  "version": "1.0.0",
  "timestamp": "2024-..."
}
```

### 2. Login endpoint (GET)
```bash
curl https://miniapp.expert/api/auth/login/
```

Должен вернуть информацию о том, что нужен POST метод.

### 3. Login endpoint (POST)
```bash
curl -X POST https://miniapp.expert/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miniapp.expert","password":"admin123"}'
```

### 4. Django Admin
```
https://miniapp.expert/admin/
```

Должна открыться страница входа в Django Admin.

## Если что-то не работает

### Проверить, что API запущен
```bash
docker ps | grep miniapp_api
```

### Проверить логи
```bash
docker logs miniapp_api --tail 100
```

### Проверить, что API доступен локально
```bash
curl http://127.0.0.1:8000/api/auth/health/
```

### Проверить Nginx конфигурацию
```bash
nginx -t
cat /etc/nginx/sites-available/miniapp.expert | grep -A 10 "location /api"
```

