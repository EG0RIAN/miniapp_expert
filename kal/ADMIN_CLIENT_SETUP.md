# Руководство по развертыванию админки и личного кабинета

## 📋 Обзор

Реализована полная система управления клиентами с:
- ✅ Админ-панель с управлением клиентами, платежами, мандатами
- ✅ Ручные списания через T-Bank (MIT и РКО)
- ✅ Личный кабинет клиента с продуктами, платежами, рефералами
- ✅ RBAC и аудит всех действий
- ✅ Интеграция с T-Bank API

## 🗄️ База данных

### Применение миграций

```bash
cd /Users/arkhiptsev/dev/rello/api-adonis
node ace migration:run
```

### Созданные таблицы

1. **payment_methods** - сохранённые карты клиентов
2. **mandates** - мандаты на безакцептное списание (РКО)
3. **manual_charges** - ручные списания
4. **audit_logs** - журнал всех действий

## 🔧 Настройка переменных окружения

Добавьте в `.env` файл:

```env
# T-Bank API
TBANK_TERMINAL_KEY=your_terminal_key
TBANK_PASSWORD=your_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=miniapp_expert

# App
APP_BASE_URL=https://miniapp.expert
NODE_ENV=production
```

## 🚀 API Endpoints

### Client Portal (`/api/client/*`)

Требуют авторизации клиента.

- `GET /api/client/dashboard` - дашборд клиента
- `GET /api/client/products` - список продуктов
- `POST /api/client/products/:id/renew` - продлить продукт
- `GET /api/client/payments` - история платежей
- `GET /api/client/payments/:id/receipt` - квитанция
- `GET /api/client/payment-methods` - платёжные методы
- `POST /api/client/payment-methods` - добавить карту
- `DELETE /api/client/payment-methods/:id` - удалить карту
- `GET /api/client/referrals` - реферальная программа
- `POST /api/client/referrals/request-payout` - запрос выплаты
- `GET /api/client/profile` - профиль
- `PATCH /api/client/profile` - обновить профиль
- `POST /api/client/profile/accept-offer` - принять оферту

### Admin Panel (`/api/admin/*`)

Требуют роль `ADMIN` или `FINANCE_MANAGER`.

- `GET /api/admin/customers` - список клиентов
- `GET /api/admin/customers/:id` - детали клиента
- `PATCH /api/admin/customers/:id` - обновить клиента
- `GET /api/admin/manual-charges` - ручные списания
- `POST /api/admin/manual-charges` - создать списание
- `GET /api/admin/manual-charges/:id` - детали списания
- `POST /api/admin/manual-charges/:id/cancel` - отменить списание
- `GET /api/admin/mandates` - список мандатов
- `POST /api/admin/mandates` - создать мандат
- `GET /api/admin/mandates/:id` - детали мандата
- `PATCH /api/admin/mandates/:id` - обновить мандат
- `POST /api/admin/mandates/:id/revoke` - отозвать мандат
- `GET /api/admin/audit-log` - журнал аудита
- `GET /api/admin/audit-log/stats` - статистика аудита

## 🔐 RBAC и безопасность

### Роли пользователей

В таблице `users` добавьте поле `role`:

```sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'CLIENT';
```

Доступные роли:
- `CLIENT` - обычный клиент (доступ к `/api/client/*`)
- `ADMIN` - администратор (полный доступ)
- `FINANCE_MANAGER` - финансовый менеджер (доступ к админке)

### 2FA для ручных списаний

Все ручные списания требуют 2FA код. Реализуйте:

1. Установите библиотеку для TOTP:
```bash
npm install otplib
```

2. Добавьте в таблицу `users`:
```sql
ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255);
```

3. Генерируйте QR-код при включении 2FA для администраторов.

## 💳 T-Bank интеграция

### MIT (Merchant Initiated Transaction)

1. Клиент привязывает карту через CIT (Customer Initiated Transaction)
2. Система сохраняет `rebill_id` в `payment_methods`
3. Админ может списать средства через MIT без участия клиента

### РКО (Расчётно-кассовое обслуживание)

1. Создайте мандат в админке (`/api/admin/mandates`)
2. Загрузите PDF договора или укажите номер мандата
3. Создайте списание через РКО канал
4. Система генерирует платёжное требование (CSV)

## 🎨 Frontend (React)

### Структура компонентов

```
src/
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── ManualCharges.tsx
│   │   ├── Mandates.tsx
│   │   └── AuditLog.tsx
│   └── client/
│       ├── Dashboard.tsx
│       ├── Products.tsx
│       ├── Payments.tsx
│       ├── PaymentMethods.tsx
│       ├── Referrals.tsx
│       └── Profile.tsx
├── components/
│   ├── admin/
│   │   └── ManualChargeModal.tsx
│   └── client/
│       └── AddCardModal.tsx
└── services/
    └── api.ts
```

### Установка зависимостей

```bash
npm install react-router-dom
```

### Добавление роутов

В `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/admin/Dashboard'
import ClientDashboard from './pages/client/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/client" element={<ClientDashboard />} />
        {/* Добавьте остальные роуты */}
      </Routes>
    </BrowserRouter>
  )
}
```

## 🧪 Тестирование

### Проверка API

```bash
# Health check
curl https://miniapp.expert/api/health

# Login (получить токен)
curl -X POST https://miniapp.expert/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Client dashboard (с токеном)
curl https://miniapp.expert/api/client/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin customers (с токеном админа)
curl https://miniapp.expert/api/admin/customers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Проверка ручного списания (MIT)

```bash
curl -X POST https://miniapp.expert/api/admin/manual-charges \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "client@example.com",
    "amount": 100,
    "currency": "RUB",
    "reason": "Тестовое списание",
    "channel": "tinkoff_mit",
    "paymentMethodId": "uuid-of-payment-method",
    "twoFactorCode": "123456"
  }'
```

## 📊 Мониторинг

### Audit Log

Все действия логируются в `audit_logs`:

```sql
SELECT * FROM audit_logs 
WHERE entity = 'manual_charge' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Статистика списаний

```sql
SELECT 
  channel,
  status,
  COUNT(*) as count,
  SUM(amount) as total
FROM manual_charges
GROUP BY channel, status;
```

## 🔄 Развертывание

### 1. Backend (AdonisJS)

```bash
cd /Users/arkhiptsev/dev/rello/api-adonis
npm install
node ace migration:run
node ace build
cd build
npm ci --production
node bin/server.js
```

### 2. Frontend (React)

```bash
cd /Users/arkhiptsev/dev/rello
npm install
npm run build
# Скопируйте dist/ на сервер
```

### 3. Docker Compose

```bash
cd /Users/arkhiptsev/dev/rello
docker compose up -d
```

## 📝 Чеклист готовности

- [ ] Миграции применены
- [ ] Переменные окружения настроены
- [ ] T-Bank credentials добавлены
- [ ] Роли пользователей настроены
- [ ] 2FA включен для админов
- [ ] Frontend собран и развёрнут
- [ ] API endpoints доступны
- [ ] Webhook T-Bank настроен
- [ ] Audit log работает
- [ ] Тестовое списание MIT прошло успешно
- [ ] Тестовый мандат РКО создан

## 🆘 Troubleshooting

### Ошибка "Unauthorized" при доступе к админке

Проверьте роль пользователя:
```sql
SELECT email, role FROM users WHERE email = 'your@email.com';
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### T-Bank возвращает ошибку подписи

Проверьте `TBANK_PASSWORD` в `.env` - это секретный ключ терминала.

### Ручное списание не проходит

1. Проверьте статус `payment_method`:
```sql
SELECT * FROM payment_methods WHERE customer_email = 'client@example.com';
```

2. Проверьте логи T-Bank в `audit_logs`:
```sql
SELECT * FROM audit_logs WHERE entity = 'manual_charge' ORDER BY created_at DESC LIMIT 5;
```

## 📚 Дополнительные ресурсы

- [T-Bank API Documentation](https://www.tbank.ru/kassa/develop/api/)
- [AdonisJS Documentation](https://docs.adonisjs.com/)
- [React Router Documentation](https://reactrouter.com/)

---

**Статус:** ✅ Backend готов, Frontend базовый UI создан  
**Дата:** 6 ноября 2025  
**Версия:** 1.0.0

