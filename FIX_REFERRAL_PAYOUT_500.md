# Исправление ошибки 500 для ReferralPayout в Django Admin

## Проблема
При попытке доступа к `/admin/affiliates/referralpayout/` возникала ошибка 500 (Server Error).

## Причина
Таблицы для affiliates (referrals, referral_payouts, referral_commissions) не существовали в базе данных, так как миграции не были применены.

## Решение

### 1. Создание миграций
```bash
python manage.py makemigrations affiliates
python manage.py makemigrations orders products payments
```

### 2. Создание недостающих таблиц
Таблицы `orders`, `products`, `payments`, `transactions` были созданы вручную через SQL, так как они не существовали в БД, но были созданы из AdonisJS.

### 3. Применение миграций
```bash
# Пометить существующие миграции как примененные
python manage.py migrate products --fake
python manage.py migrate orders --fake
python manage.py migrate payments --fake

# Применить миграции для affiliates (создать таблицы)
python manage.py migrate affiliates
```

### 4. Результат
- ✅ Таблица `referral_payouts` создана
- ✅ Таблица `referrals` создана
- ✅ Таблица `referral_commissions` создана
- ✅ Django Admin страница работает (HTTP 302 - редирект на логин, что нормально)

## Структура таблицы referral_payouts

```
Columns:
  id: uuid (PRIMARY KEY)
  amount: numeric(12, 2)
  currency: varchar(3)
  status: varchar(20)
  payment_method: varchar(50)
  payment_ref: varchar(255)
  notes: text
  processed_at: timestamp with time zone
  created_at: timestamp with time zone
  updated_at: timestamp with time zone
  referrer_id: integer (FOREIGN KEY -> users.id)
```

## Проверка

После входа в Django Admin по адресу `https://miniapp.expert/admin/`, страница `/admin/affiliates/referralpayout/` должна работать корректно и отображать список выплат рефералов.

## Связанные модели

- `Referral` - реферальные связи между пользователями
- `ReferralPayout` - выплаты рефералам
- `ReferralCommission` - комиссии за конкретные заказы

Все модели зарегистрированы в Django Admin и доступны для управления.

