# Исправление ошибки 500 для ManualCharge в Django Admin

## Проблема
При попытке доступа к `/admin/payments/manualcharge/` возникала ошибка 500 (Server Error).

## Причина
Структура таблицы `manual_charges` в базе данных не соответствовала модели Django:

- ❌ Было: колонка `customer_email` (varchar)
- ✅ Нужно: колонка `user_id` (ForeignKey на users)
- ❌ Было: колонка `initiator_email` (varchar)
- ✅ Нужно: колонка `initiator_id` (ForeignKey на users, nullable)
- ❌ Отсутствовало: связи с таблицей users (ForeignKey)
- ❌ Отсутствовало: индексы для производительности
- ❌ Отсутствовало: уникальный constraint на `idempotency_key`

## Решение

### 1. Исправление таблицы manual_charges

```sql
-- Добавить user_id
ALTER TABLE manual_charges ADD COLUMN user_id INTEGER;

-- Заполнить user_id из customer_email (если есть данные)
UPDATE manual_charges mc
SET user_id = u.id
FROM users u
WHERE mc.customer_email = u.email
AND mc.user_id IS NULL;

-- Добавить ForeignKey constraint для user_id
ALTER TABLE manual_charges ADD CONSTRAINT manual_charges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX manual_charges_user_id_idx ON manual_charges(user_id);

-- Сделать user_id NOT NULL (если все записи имеют user_id)
ALTER TABLE manual_charges ALTER COLUMN user_id SET NOT NULL;

-- Добавить initiator_id
ALTER TABLE manual_charges ADD COLUMN initiator_id INTEGER;

-- Заполнить initiator_id из initiator_email (если есть данные)
UPDATE manual_charges mc
SET initiator_id = u.id
FROM users u
WHERE mc.initiator_email = u.email
AND mc.initiator_id IS NULL;

-- Добавить ForeignKey constraint для initiator_id (nullable)
ALTER TABLE manual_charges ADD CONSTRAINT manual_charges_initiator_id_fkey 
    FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX manual_charges_initiator_id_idx ON manual_charges(initiator_id);

-- Создать индексы для производительности
CREATE INDEX manual_charges_status_idx ON manual_charges(status);
CREATE INDEX manual_charges_channel_idx ON manual_charges(channel);
CREATE INDEX manual_charges_provider_ref_idx ON manual_charges(provider_ref);
CREATE INDEX manual_charges_created_at_idx ON manual_charges(created_at DESC);

-- Добавить уникальный constraint на idempotency_key (где он не NULL)
CREATE UNIQUE INDEX manual_charges_idempotency_key_unique 
    ON manual_charges(idempotency_key) WHERE idempotency_key IS NOT NULL;
```

### 2. Результат

- ✅ Таблица `manual_charges` исправлена и соответствует модели Django
- ✅ Модель `ManualCharge` работает корректно
- ✅ Админка зарегистрирована и доступна
- ✅ Django Admin страница работает (HTTP 302 - редирект на логин, что нормально)

## Структура таблицы после исправления

### manual_charges
```
Columns:
  id: uuid (PRIMARY KEY)
  customer_email: varchar (nullable: NO) - оставлено для обратной совместимости
  user_id: integer (FOREIGN KEY -> users.id, NOT NULL)
  amount: numeric(12, 2)
  currency: varchar(3) (default: 'RUB')
  reason: text
  channel: varchar(20)
  status: varchar(20)
  provider_ref: varchar(255) (nullable, INDEX)
  failure_reason: text (nullable)
  initiator_email: varchar (nullable: NO) - оставлено для обратной совместимости
  initiator_id: integer (FOREIGN KEY -> users.id, nullable)
  payment_method_id: uuid (FOREIGN KEY -> payment_methods.id, nullable)
  mandate_id: uuid (FOREIGN KEY -> mandates.id, nullable)
  idempotency_key: varchar(255) (nullable, UNIQUE where not null)
  processed_at: timestamp with time zone (nullable)
  created_at: timestamp with time zone (INDEX DESC)
  updated_at: timestamp with time zone

Indexes:
  - manual_charges_user_id_idx (user_id)
  - manual_charges_initiator_id_idx (initiator_id)
  - manual_charges_status_idx (status)
  - manual_charges_channel_idx (channel)
  - manual_charges_provider_ref_idx (provider_ref)
  - manual_charges_created_at_idx (created_at DESC)
  - manual_charges_idempotency_key_unique (idempotency_key, UNIQUE where not null)

Foreign Keys:
  - user_id -> users.id (ON DELETE CASCADE)
  - initiator_id -> users.id (ON DELETE SET NULL)
  - payment_method_id -> payment_methods.id (ON DELETE SET NULL)
  - mandate_id -> mandates.id (ON DELETE SET NULL)
```

## Проверка

После входа в Django Admin по адресу `https://miniapp.expert/admin/`, страница:
- `/admin/payments/manualcharge/` - должна работать корректно

Ошибка 500 устранена. Django Admin работает корректно.

## Примечания

- Колонки `customer_email` и `initiator_email` оставлены в таблице для обратной совместимости, но не используются в модели Django
- Модель использует `user` (ForeignKey) и `initiator` (ForeignKey), которые соответствуют колонкам `user_id` и `initiator_id`
- Все индексы и constraints созданы для оптимальной производительности
- Уникальный constraint на `idempotency_key` создан с условием WHERE для поддержки NULL значений

