# 📧 Настройка Email уведомлений (Mail.ru SMTP)

## ✅ Что реализовано

### Красивые HTML письма для:
1. **Регистрация** 🎉 - подтверждение email с приветствием
2. **Восстановление пароля** 🔐 - ссылка для сброса пароля (действует 1 час)
3. **Пароль изменён** ✅ - уведомление об успешной смене пароля
4. **Оплата принята** 💳 - magic link для входа в ЛК (уже было)

### Функции mailer service:
- `sendRegistrationEmail()` - отправка письма с подтверждением
- `sendPasswordResetEmail()` - восстановление пароля
- `sendPasswordChangedEmail()` - уведомление о смене пароля
- `sendWelcomeEmail()` - письмо после оплаты

## 🔧 Настройка на сервере

### 1. Добавить в `.env` файл

```bash
# Подключитесь к серверу
ssh root@YOUR_SERVER_IP

# Откройте .env файл
nano /home/miniapp_expert/.env

# Добавьте следующие строки:
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=no-reply@miniapp.expert
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>
APP_BASE_URL=https://miniapp.expert

# Сохраните (Ctrl+O, Enter, Ctrl+X)
```

### 2. Перезапустить API

```bash
cd /home/miniapp_expert
docker compose restart api
```

### 3. Проверить работу

```bash
# Проверить логи
docker compose logs api | grep -i mail

# Должны увидеть что-то вроде:
# "Mail transport initialized: smtp.mail.ru:465"
```

## 📊 API Endpoints

### Регистрация

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Иван Иванов",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "message": "Регистрация успешна! Проверьте email для подтверждения",
  "emailSent": true,
  "userId": "uuid"
}
```

### Подтверждение email

```bash
GET /api/auth/verify?token=VERIFICATION_TOKEN

Response:
{
  "success": true,
  "message": "Email успешно подтверждён! Теперь вы можете войти в систему"
}
```

### Запрос восстановления пароля

```bash
POST /api/auth/password/request-reset
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Если email существует, письмо с инструкциями будет отправлено"
}
```

### Проверка токена сброса

```bash
GET /api/auth/password/verify-token?token=RESET_TOKEN

Response:
{
  "success": true,
  "email": "user@example.com"
}

# Или если токен истёк:
{
  "error": "Неверный или истёкший токен",
  "expired": true
}
```

### Сброс пароля

```bash
POST /api/auth/password/reset
Content-Type: application/json

{
  "token": "RESET_TOKEN",
  "password": "NewSecurePassword123"
}

Response:
{
  "success": true,
  "message": "Пароль успешно изменён! Теперь вы можете войти с новым паролем"
}
```

## 🎨 Дизайн писем

Все письма используют:
- ✅ Современный дизайн с градиентами
- ✅ Адаптивная вёрстка (mobile-friendly)
- ✅ Эмодзи для визуальной привлекательности
- ✅ Яркие CTA кнопки
- ✅ Брендинг MiniAppExpert
- ✅ Футер с копирайтом

### Примеры писем:

#### 1. Регистрация 🎉
- **Тема:** 🎉 Подтвердите регистрацию в MiniAppExpert
- **Цвет:** Зелёный градиент (#10B981)
- **CTA:** "✓ Подтвердить email"
- **Блок:** "Что вас ждёт" (список преимуществ)

#### 2. Восстановление пароля 🔐
- **Тема:** 🔐 Восстановление пароля MiniAppExpert
- **Цвет:** Синий градиент (#3B82F6)
- **CTA:** "🔑 Сбросить пароль"
- **Блок:** Предупреждение о сроке действия (1 час)
- **Блок:** Советы по безопасности

#### 3. Пароль изменён ✅
- **Тема:** ✅ Пароль успешно изменён — MiniAppExpert
- **Цвет:** Зелёный градиент (#10B981)
- **Блок:** Успешное подтверждение
- **Предупреждение:** "Если вы не меняли пароль..."

## 🗄️ Изменения в БД

Нужно добавить поля в таблицу `users`:

```sql
-- Подключитесь к БД
docker exec -it miniapp_expert-postgres-1 psql -U postgres -d miniapp_expert

-- Добавьте поля
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Проверьте
\d users
```

## 🧪 Тестирование

### 1. Тест регистрации

```bash
curl -X POST https://miniapp.expert/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Тестовый Пользователь",
    "password": "TestPassword123"
  }'
```

### 2. Проверить email

Зайдите в почтовый ящик `test@example.com` и найдите письмо от `no-reply@miniapp.expert`.

### 3. Подтвердить email

Скопируйте токен из ссылки в письме и выполните:

```bash
curl "https://miniapp.expert/api/auth/verify?token=YOUR_TOKEN"
```

### 4. Тест восстановления пароля

```bash
curl -X POST https://miniapp.expert/api/auth/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 5. Сбросить пароль

```bash
curl -X POST https://miniapp.expert/api/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "NewPassword123"
  }'
```

## 🔐 Безопасность

### Реализовано:
- ✅ Пароли хешируются с bcrypt (10 раундов)
- ✅ Токены сброса действуют только 1 час
- ✅ Токены одноразовые (удаляются после использования)
- ✅ Email не раскрывается при запросе сброса
- ✅ Уведомление при смене пароля

### Рекомендации:
- Минимальная длина пароля: 8 символов
- Токены подтверждения действуют 24 часа
- Используйте HTTPS для всех запросов

## 📝 Примеры использования в коде

### Отправка письма при регистрации:

```typescript
import { sendRegistrationEmail, createMagicToken } from '#services/mailer'

const verificationToken = createMagicToken({ email, action: 'verify' })

await sendRegistrationEmail({
  to: email,
  name: userName,
  verificationToken,
})
```

### Отправка письма для восстановления пароля:

```typescript
import { sendPasswordResetEmail, createMagicToken } from '#services/mailer'

const resetToken = createMagicToken({ 
  email, 
  action: 'reset_password',
  exp: Date.now() + 60 * 60 * 1000 // 1 час
})

await sendPasswordResetEmail({
  to: email,
  name: userName,
  resetToken,
})
```

## 🆘 Troubleshooting

### Письма не отправляются

1. Проверьте настройки SMTP в `.env`:
```bash
docker exec miniapp_expert-api-1 env | grep SMTP
```

2. Проверьте логи:
```bash
docker compose logs api | grep -i "mail\|smtp"
```

3. Проверьте подключение к SMTP:
```bash
telnet smtp.mail.ru 465
```

### Письма попадают в спам

1. Добавьте SPF запись в DNS:
```
v=spf1 include:_spf.mail.ru ~all
```

2. Добавьте DKIM запись (получите в настройках Mail.ru)

3. Добавьте DMARC запись:
```
v=DMARC1; p=none; rua=mailto:postmaster@miniapp.expert
```

### Токен истёк

Токены сброса пароля действуют 1 час. Попросите пользователя запросить новый токен.

## 📊 Мониторинг

### Логи отправки писем

```bash
# Все письма
docker compose logs api | grep "Mail send"

# Ошибки
docker compose logs api | grep "Mail send error"

# Успешные отправки
docker compose logs api | grep "Mail sent successfully"
```

### Статистика

Можно добавить в `audit_logs`:

```sql
SELECT 
  COUNT(*) as total_emails,
  COUNT(CASE WHEN action = 'email_sent' THEN 1 END) as sent,
  COUNT(CASE WHEN action = 'email_failed' THEN 1 END) as failed
FROM audit_logs
WHERE entity = 'email'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## 🎯 Следующие шаги

### Опционально:
- [ ] Добавить email шаблоны в отдельные файлы
- [ ] Реализовать очередь для отправки писем (Bull/Redis)
- [ ] Добавить rate limiting для регистрации
- [ ] Настроить SPF/DKIM/DMARC записи
- [ ] Добавить аналитику открытий писем
- [ ] Создать админку для просмотра отправленных писем

---

**Статус:** ✅ Готово к использованию  
**Дата:** 6 ноября 2025  
**Версия:** 1.0.0

