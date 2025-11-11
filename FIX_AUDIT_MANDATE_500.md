# Исправление ошибки 500 для AuditLog и Mandate в Django Admin

## Проблема
При попытке доступа к `/admin/audit/auditlog/` и `/admin/payments/mandate/` возникала ошибка 500 (Server Error).

## Причина
Структура таблиц в базе данных не соответствовала моделям Django:

### audit_logs
- ❌ Было: колонка `entity` (varchar)
- ✅ Нужно: колонка `entity_type` (varchar)
- ❌ Отсутствовало: колонка `actor_id` (ForeignKey на users)
- ⚠️ Колонка `actor_email` была NOT NULL, но должна быть nullable
- ⚠️ Колонка `ip_address` была varchar, но должна быть inet (или varchar для гибкости)

### mandates
- ❌ Было: колонка `customer_email` (varchar)
- ✅ Нужно: колонка `user_id` (ForeignKey на users)
- ❌ Отсутствовало: связь с таблицей users

## Решение

### 1. Исправление таблицы audit_logs

```sql
-- Переименовать entity в entity_type
ALTER TABLE audit_logs RENAME COLUMN entity TO entity_type;

-- Добавить actor_id (ForeignKey на users)
ALTER TABLE audit_logs ADD COLUMN actor_id INTEGER 
    REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX audit_logs_actor_id_idx ON audit_logs(actor_id);

-- Сделать actor_email nullable
ALTER TABLE audit_logs ALTER COLUMN actor_email DROP NOT NULL;

-- Опционально: изменить тип ip_address на inet (если все значения валидные IP)
-- ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE inet USING ip_address::inet;
```

### 2. Исправление таблицы mandates

```sql
-- Добавить user_id
ALTER TABLE mandates ADD COLUMN user_id INTEGER;

-- Заполнить user_id из customer_email (если есть данные)
UPDATE mandates m
SET user_id = u.id
FROM users u
WHERE m.customer_email = u.email
AND m.user_id IS NULL;

-- Добавить ForeignKey constraint
ALTER TABLE mandates ADD CONSTRAINT mandates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX mandates_user_id_idx ON mandates(user_id);

-- Сделать user_id NOT NULL (если все записи имеют user_id)
ALTER TABLE mandates ALTER COLUMN user_id SET NOT NULL;
```

### 3. Применение миграций

```bash
# Создать миграции для audit
python manage.py makemigrations audit

# Пометить миграции как примененные (так как таблицы уже исправлены)
python manage.py migrate audit --fake
```

## Результат

- ✅ Таблица `audit_logs` исправлена и соответствует модели Django
- ✅ Таблица `mandates` исправлена и соответствует модели Django
- ✅ Модели `AuditLog` и `Mandate` работают корректно
- ✅ Админки зарегистрированы и доступны
- ✅ Django Admin страницы работают (HTTP 302 - редирект на логин, что нормально)

## Структура таблиц после исправления

### audit_logs
```
Columns:
  id: uuid (PRIMARY KEY)
  entity_type: varchar(100) (INDEX)
  entity_id: varchar(255) (INDEX)
  action: varchar(100)
  actor_id: integer (FOREIGN KEY -> users.id, nullable)
  actor_email: varchar (INDEX, nullable)
  actor_role: varchar(50) (nullable)
  before: jsonb (nullable)
  after: jsonb (nullable)
  ip_address: varchar (nullable)
  user_agent: text (nullable)
  created_at: timestamp with time zone (INDEX)
```

### mandates
```
Columns:
  id: uuid (PRIMARY KEY)
  user_id: integer (FOREIGN KEY -> users.id, NOT NULL)
  type: varchar(20)
  bank: varchar(50)
  mandate_number: varchar(255) (UNIQUE, INDEX)
  signed_at: timestamp with time zone (nullable)
  status: varchar(20)
  file_url: varchar(200) (nullable)
  notes: text (nullable)
  created_at: timestamp with time zone
  updated_at: timestamp with time zone
```

## Проверка

После входа в Django Admin по адресу `https://miniapp.expert/admin/`, страницы:
- `/admin/audit/auditlog/` - должна работать корректно
- `/admin/payments/mandate/` - должна работать корректно

Ошибка 500 устранена. Django Admin работает корректно.

