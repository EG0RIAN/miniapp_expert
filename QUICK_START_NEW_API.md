# 🚀 Быстрый Старт - Новый API

## ✅ Статус
**Новый AdonisJS API работает!** 🎉

- **URL:** https://miniapp.expert/api/
- **Регистрация:** ✅ Работает
- **Авторизация:** ✅ Работает
- **База данных:** ✅ Настроена

## 🧪 Быстрый Тест

```bash
# 1. Health check
curl https://miniapp.expert/api/health

# 2. Регистрация
curl -X POST https://miniapp.expert/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'

# 3. Вход
curl -X POST https://miniapp.expert/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

## ⚙️ Доделать за 5 минут

### 1. Email Уведомления
```bash
ssh root@85.198.110.66
cd /home/miniapp_expert

# Добавить SMTP пароль
echo 'SMTP_PASS=ваш_новый_пароль_mailru' >> .env

# Перезапустить API
docker compose restart api
```

### 2. Создать Админа
```bash
# Сделать первого пользователя админом
docker exec miniapp_postgres psql -U miniuser -d miniapp \
  -c "UPDATE users SET role='admin' WHERE id=1;"
```

### 3. T-Bank Платежи
```bash
# Добавить ключи T-Bank в .env
echo 'TBANK_TERMINAL_KEY=ваш_terminal_key' >> .env
echo 'TBANK_PASSWORD=ваш_пароль' >> .env

docker compose restart api
```

## 📋 Основные Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/verify?token=XXX` - Подтверждение email
- `POST /api/auth/password/request-reset` - Сброс пароля

### Клиентский Кабинет
- `GET /api/client/dashboard` - Дашборд
- `GET /api/client/products` - Продукты
- `GET /api/client/payments` - Платежи
- `GET /api/client/referrals` - Рефералы

### Админ Панель
- `GET /api/admin/customers` - Клиенты
- `POST /api/admin/manual-charges` - Ручное списание
- `GET /api/admin/audit-logs` - Журнал

## 🔧 Управление

```bash
# Перезапуск
docker compose restart api

# Логи
docker logs miniapp_api -f

# Статус
docker compose ps
```

## 📖 Полная Документация

- **DEPLOYMENT_SUCCESS.md** - Полный отчёт о деплое
- **ADMIN_CLIENT_SETUP.md** - Админка и ЛК
- **EMAIL_SETUP.md** - Настройка email

---

**Готово!** Новый API работает и готов к использованию! 🎉

