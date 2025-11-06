# 🚀 Быстрое развертывание админки и ЛК

## 1️⃣ Применить миграции БД

```bash
cd /Users/arkhiptsev/dev/rello/api-adonis
node ace migration:run
```

## 2️⃣ Добавить переменные окружения

Добавьте в `/home/miniapp_expert/.env`:

```env
# T-Bank API
TBANK_TERMINAL_KEY=your_terminal_key_here
TBANK_PASSWORD=your_secret_key_here
TBANK_API_URL=https://securepay.tinkoff.ru/v2

# App
APP_BASE_URL=https://miniapp.expert
```

## 3️⃣ Назначить роль администратору

```sql
-- Подключитесь к БД
docker exec -it miniapp_expert-postgres-1 psql -U postgres -d miniapp_expert

-- Назначьте роль
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- Проверьте
SELECT email, role FROM users WHERE role = 'ADMIN';
```

## 4️⃣ Перезапустить API

```bash
cd /home/miniapp_expert
docker compose restart api
```

## 5️⃣ Проверить работу

```bash
# Health check
curl https://miniapp.expert/api/health

# Проверить новые эндпоинты (нужен токен)
curl https://miniapp.expert/api/admin/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Доступные эндпоинты

### Админка
- `GET /api/admin/customers` - список клиентов
- `GET /api/admin/manual-charges` - ручные списания
- `GET /api/admin/mandates` - мандаты РКО
- `GET /api/admin/audit-log` - журнал аудита

### Личный кабинет
- `GET /api/client/dashboard` - дашборд
- `GET /api/client/products` - продукты
- `GET /api/client/payments` - платежи
- `GET /api/client/payment-methods` - способы оплаты
- `GET /api/client/referrals` - реферальная программа
- `GET /api/client/profile` - профиль

## 🔐 Получение токена

```bash
curl -X POST https://miniapp.expert/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}'
```

## 📚 Полная документация

- **ADMIN_CLIENT_SETUP.md** - детальное руководство
- **IMPLEMENTATION_SUMMARY.md** - обзор функционала

## ⚠️ Важно

1. **T-Bank credentials** обязательны для работы платежей
2. **Роль ADMIN** нужна для доступа к админке
3. **2FA** пока не реализован (используйте любой код)
4. **Frontend UI** базовый, требует доработки

## 🆘 Проблемы?

### API не отвечает
```bash
docker compose logs api
docker compose restart api
```

### Миграции не применились
```bash
cd api-adonis
node ace migration:status
node ace migration:run --force
```

### Нет доступа к админке
```sql
-- Проверьте роль
SELECT email, role FROM users WHERE email = 'your@email.com';

-- Назначьте роль
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

**Готово!** 🎉 Теперь у вас есть полноценная админка и личный кабинет.

