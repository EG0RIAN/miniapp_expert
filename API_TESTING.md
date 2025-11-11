# Тестирование Django API

## Проблема: "Cannot GET:/api/auth/login/"

Эта ошибка означает, что:
1. ✅ Nginx правильно проксирует запросы на Django API
2. ✅ Django API запущен и работает
3. ❌ Endpoint `/api/auth/login/` принимает только POST, а не GET

## Решение

### 1. Использовать правильный метод (POST)

```bash
# Правильный запрос для входа
curl -X POST https://miniapp.expert/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miniapp.expert","password":"admin123"}'
```

### 2. Проверить health endpoint (GET)

```bash
# Health check endpoint (принимает GET)
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

### 3. Проверить Django Admin

```
https://miniapp.expert/admin/
```

Должна открыться страница входа в Django Admin.

## Endpoints

### Health Check (GET)
```
GET /api/auth/health/
```
Возвращает статус API.

### Login (POST)
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "admin@miniapp.expert",
  "password": "admin123"
}
```

### Register (POST)
```
POST /api/auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### Profile (GET, PATCH)
```
GET /api/auth/profile/
Authorization: Bearer YOUR_TOKEN

PATCH /api/auth/profile/
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "New Name"
}
```

## Проверка работы API

### 1. Health Check

```bash
curl https://miniapp.expert/api/auth/health/
```

### 2. Login

```bash
curl -X POST https://miniapp.expert/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miniapp.expert","password":"admin123"}'
```

### 3. Проверка через браузер

- **Health:** https://miniapp.expert/api/auth/health/
- **Admin:** https://miniapp.expert/admin/
- **Login (POST только):** Не работает через браузер напрямую, нужен POST запрос

## Troubleshooting

### Ошибка "Cannot GET:/api/auth/login/"

**Причина:** Endpoint принимает только POST запросы

**Решение:** Использовать POST метод или проверить health endpoint

### Ошибка "502 Bad Gateway"

**Причина:** Django API не запущен

**Решение:**
```bash
ssh root@85.198.110.66
cd /root/rello
docker-compose up -d api
docker logs miniapp_api
```

### Ошибка "404 Not Found"

**Причина:** Неправильный путь или Nginx не проксирует

**Решение:**
1. Проверить Nginx конфигурацию
2. Проверить, что Django обрабатывает путь
3. Проверить логи: `docker logs miniapp_api`

### Ошибка "500 Internal Server Error"

**Причина:** Ошибка в Django коде

**Решение:**
```bash
docker logs miniapp_api
# Проверить ошибки в логах
```

## Быстрая проверка

```bash
# Запустить скрипт проверки
./test-django-api.sh
```

Или вручную:

```bash
# 1. Health check
curl https://miniapp.expert/api/auth/health/

# 2. Login (POST)
curl -X POST https://miniapp.expert/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miniapp.expert","password":"admin123"}'

# 3. Проверить Admin в браузере
# https://miniapp.expert/admin/
```

