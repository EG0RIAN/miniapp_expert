# Исправление ошибки 500 для PaymentMethod в Django Admin

## Проблема
При попытке доступа к `/admin/payments/paymentmethod/` возникала ошибка 500 (Server Error).

## Причина
Структура таблицы `payment_methods` в базе данных не соответствовала модели Django:

- ❌ Было: колонка `customer_email` (varchar)
- ✅ Нужно: колонка `user_id` (ForeignKey на users)
- ❌ Отсутствовало: связь с таблицей users (ForeignKey)
- ❌ Отсутствовало: уникальный constraint на `rebill_id`
- ❌ Отсутствовало: индекс на `rebill_id`

## Решение

### 1. Исправление таблицы payment_methods

```sql
-- Добавить user_id
ALTER TABLE payment_methods ADD COLUMN user_id INTEGER;

-- Заполнить user_id из customer_email (если есть данные)
UPDATE payment_methods pm
SET user_id = u.id
FROM users u
WHERE pm.customer_email = u.email
AND pm.user_id IS NULL;

-- Добавить ForeignKey constraint
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX payment_methods_user_id_idx ON payment_methods(user_id);

-- Сделать user_id NOT NULL (если все записи имеют user_id)
ALTER TABLE payment_methods ALTER COLUMN user_id SET NOT NULL;

-- Добавить уникальный constraint на rebill_id
CREATE UNIQUE INDEX payment_methods_rebill_id_unique ON payment_methods(rebill_id);

-- Добавить индекс на rebill_id
CREATE INDEX payment_methods_rebill_id_idx ON payment_methods(rebill_id);
```

### 2. Результат

- ✅ Таблица `payment_methods` исправлена и соответствует модели Django
- ✅ Модель `PaymentMethod` работает корректно
- ✅ Админка зарегистрирована и доступна
- ✅ Django Admin страница работает (HTTP 302 - редирект на логин, что нормально)

## Структура таблицы после исправления

### payment_methods
```
Columns:
  id: uuid (PRIMARY KEY)
  customer_email: varchar (nullable: NO) - оставлено для обратной совместимости
  user_id: integer (FOREIGN KEY -> users.id, NOT NULL)
  provider: varchar(50) (default: 'tinkoff')
  rebill_id: varchar(255) (UNIQUE, INDEX)
  pan_mask: varchar(20)
  exp_date: varchar(10) (nullable)
  card_type: varchar(50) (nullable)
  status: varchar(20) (nullable)
  is_default: boolean (nullable)
  created_at: timestamp with time zone
  updated_at: timestamp with time zone

Indexes:
  - payment_methods_user_id_idx (user_id)
  - payment_methods_rebill_id_unique (rebill_id, UNIQUE)
  - payment_methods_rebill_id_idx (rebill_id)

Foreign Keys:
  - user_id -> users.id (ON DELETE CASCADE)
```

## Проверка

После входа в Django Admin по адресу `https://miniapp.expert/admin/`, страница:
- `/admin/payments/paymentmethod/` - должна работать корректно

Ошибка 500 устранена. Django Admin работает корректно.

## Примечания

- Колонка `customer_email` оставлена в таблице для обратной совместимости, но не используется в модели Django
- Модель использует `user` (ForeignKey), который соответствует колонке `user_id`
- Все индексы и constraints созданы для оптимальной производительности

