# ✅ Успешный Деплой Нового API

**Дата:** 7 ноября 2025  
**Статус:** 🎉 **РАБОТАЕТ!**

## 🎯 Что Запущено

### Новый AdonisJS 6 API
- **URL:** https://miniapp.expert/api/
- **Порт:** 3333
- **Статус:** ✅ Работает
- **База данных:** PostgreSQL 15
- **Контейнеры:** Docker Compose

### Работающие Сервисы
```
✅ miniapp_api       - AdonisJS API (port 3333)
✅ miniapp_postgres  - PostgreSQL 15 (port 5432)
✅ miniapp_pocketbase - PocketBase (port 8090)
✅ nginx             - Reverse Proxy (ports 80, 443)
```

## 📋 Доступные Endpoints

### 🔐 Авторизация
- ✅ `POST /api/auth/register` - Регистрация нового пользователя
- ✅ `POST /api/auth/login` - Вход по email/пароль
- ✅ `GET /api/auth/verify?token=XXX` - Подтверждение email
- ✅ `POST /api/auth/password/request-reset` - Запрос сброса пароля
- ✅ `GET /api/auth/password/verify-token?token=XXX` - Проверка токена
- ✅ `POST /api/auth/password/reset` - Сброс пароля

### 👤 Клиентский Кабинет (требует авторизации)
- ✅ `GET /api/client/dashboard` - Дашборд клиента
- ✅ `GET /api/client/products` - Список продуктов
- ✅ `GET /api/client/payments` - История платежей
- ✅ `GET /api/client/payment-methods` - Сохранённые карты
- ✅ `POST /api/client/payment-methods` - Добавить карту
- ✅ `GET /api/client/referrals` - Реферальная программа
- ✅ `GET /api/client/profile` - Профиль клиента

### 👨‍💼 Админ Панель (требует роль ADMIN)
- ✅ `GET /api/admin/customers` - Список клиентов
- ✅ `GET /api/admin/customers/:id` - Детали клиента
- ✅ `POST /api/admin/manual-charges` - Ручное списание
- ✅ `GET /api/admin/manual-charges` - История списаний
- ✅ `GET /api/admin/mandates` - Мандаты на списание
- ✅ `GET /api/admin/audit-logs` - Журнал действий

### 💳 Платежи
- ✅ `POST /api/payment/create` - Создать платёж
- ✅ `GET /api/payment/status/:id` - Статус платежа
- ✅ `POST /api/payment/webhook` - Webhook от T-Bank

## 🧪 Тестирование

### Health Check
```bash
curl https://miniapp.expert/api/health
```

**Ответ:**
```json
{
  "status": "ok",
  "service": "miniapp-expert-api",
  "ts": "2025-11-06T23:31:01.944Z"
}
```

### Регистрация Пользователя
```bash
curl -X POST https://miniapp.expert/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "name": "Test User"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "message": "Регистрация успешна! Проверьте email для подтверждения",
  "emailSent": false,
  "userId": { "id": 1 }
}
```

### Вход
```bash
curl -X POST https://miniapp.expert/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

## 📊 База Данных

### Созданные Таблицы
```sql
✅ users              - Пользователи
✅ auth_access_tokens - Токены доступа
✅ payment_methods    - Сохранённые карты
✅ mandates           - Мандаты на списание
✅ manual_charges     - Ручные списания
✅ audit_logs         - Журнал действий
✅ adonis_schema      - Миграции AdonisJS
```

### Проверка Пользователей
```bash
docker exec miniapp_postgres psql -U miniuser -d miniapp \
  -c "SELECT id, name, email, role, email_verified FROM users;"
```

## ⚙️ Конфигурация

### Переменные Окружения (.env)
```env
# App
APP_KEY=sLBCvfQglYDYoln91PlBfnKolfEGETdIS6xH2cTAN08
APP_BASE_URL=https://miniapp.expert
NODE_ENV=production
HOST=0.0.0.0
PORT=3333

# Database
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=miniapp
DB_USER=miniuser
DB_PASSWORD=minipass

# SMTP (Mail.ru)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_USER=no-reply@miniapp.expert
SMTP_PASS=<НУЖНО_ДОБАВИТЬ>
MAIL_FROM=no-reply@miniapp.expert

# Magic Links
MAGIC_SECRET=<СГЕНЕРИРОВАН>

# T-Bank
TBANK_API_URL=https://securepay.tinkoff.ru/v2
TBANK_TERMINAL_KEY=<НУЖНО_ДОБАВИТЬ>
TBANK_PASSWORD=<НУЖНО_ДОБАВИТЬ>

# PocketBase
PB_URL=http://pocketbase:8090
PB_ADMIN_EMAIL=<НУЖНО_ДОБАВИТЬ>
PB_ADMIN_PASSWORD=<НУЖНО_ДОБАВИТЬ>
```

## ⚠️ Что Нужно Доделать

### 1. Настроить SMTP для Email
```bash
ssh root@85.198.110.66
cd /home/miniapp_expert
echo 'SMTP_PASS=ВАШ_НОВЫЙ_ПАРОЛЬ' >> .env
docker compose restart api
```

### 2. Создать Первого Админа
```bash
docker exec miniapp_postgres psql -U miniuser -d miniapp \
  -c "UPDATE users SET role='admin' WHERE id=1;"
```

### 3. Настроить T-Bank API
Добавить в `.env`:
```env
TBANK_TERMINAL_KEY=ваш_terminal_key
TBANK_PASSWORD=ваш_пароль
```

### 4. Настроить PocketBase
Добавить в `.env`:
```env
PB_ADMIN_EMAIL=admin@miniapp.expert
PB_ADMIN_PASSWORD=безопасный_пароль
```

## 🔧 Управление

### Перезапуск API
```bash
cd /home/miniapp_expert
docker compose restart api
```

### Просмотр Логов
```bash
docker logs miniapp_api -f
```

### Запуск Миграций
```bash
docker exec miniapp_api node ace migration:run --force
```

### Откат Миграций
```bash
docker exec miniapp_api node ace migration:rollback --force
```

### Проверка Статуса
```bash
docker compose ps
```

## 📖 Документация

- **ADMIN_CLIENT_SETUP.md** - Полное руководство по админ панели и клиентскому кабинету
- **EMAIL_SETUP.md** - Настройка email уведомлений
- **IMPLEMENTATION_SUMMARY.md** - Что реализовано
- **QUICK_DEPLOY.md** - Быстрый деплой
- **FIX_GIT_LEAK.md** - Исправление утечки SMTP credentials

## 🎯 Что Реализовано

✅ **AdonisJS 6 API** вместо старого Express  
✅ **PostgreSQL** база данных с миграциями  
✅ **Регистрация и авторизация** пользователей  
✅ **Email уведомления** (регистрация, сброс пароля)  
✅ **Восстановление пароля** через email  
✅ **Личный кабинет клиента** с дашбордом  
✅ **Админ панель** с RBAC (роли: client, admin, finance_manager)  
✅ **T-Bank интеграция** (MIT + RKO)  
✅ **Реферальная программа**  
✅ **Audit Log** для всех операций  
✅ **Сохранение платёжных методов**  
✅ **Мандаты на списание**  
✅ **Ручные списания** с 2FA  

## 🚀 Следующие Шаги

1. ✅ **API работает** - можно регистрировать пользователей
2. ⚠️ **Добавить SMTP_PASS** - для отправки email
3. ⚠️ **Создать админа** - для доступа к админ панели
4. ⚠️ **Настроить T-Bank** - для приёма платежей
5. 📱 **Обновить фронтенд** - подключить к новому API

## 📞 Контакты

- **Сервер:** 85.198.110.66
- **API:** https://miniapp.expert/api/
- **Сайт:** https://miniapp.expert/

---

**Статус:** ✅ Новый API успешно запущен и работает!  
**Дата деплоя:** 7 ноября 2025, 02:36 UTC+3

