# Исправление ошибки 500 при удалении пользователя (финальное)

## Проблема

При попытке удалить пользователя в Django Admin возникала ошибка `Server Error (500)` из-за нескольких проблем:

1. Foreign Key constraints с `ON DELETE: NO ACTION`
2. Отсутствие таблиц ManyToMany (`users_groups`, `users_user_permissions`)
3. Конфликт структуры таблицы `user_products` (старая структура из AdonisJS не соответствовала Django модели)

## Решение

### 1. Исправление Foreign Key Constraints

Изменили все `NO ACTION` constraints на правильные действия:

- **django_admin_log.user_id**: `SET NULL`
- **referral_payouts.referrer_id**: `CASCADE`
- **referrals.referred_user_id**: `CASCADE`
- **referrals.referrer_id**: `CASCADE`

### 2. Создание ManyToMany таблиц

Создали отсутствующие таблицы для ManyToMany отношений:

- **users_groups**: Связь пользователей с группами Django
- **users_user_permissions**: Связь пользователей с правами доступа

```sql
CREATE TABLE users_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

CREATE TABLE users_user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
);
```

### 3. Исправление таблицы user_products

Старая таблица `user_products` из AdonisJS имела структуру:
- `email` (text)
- `items` (jsonb)

Новая Django модель `UserProduct` ожидает:
- `id` (UUID)
- `user_id` (ForeignKey to User)
- `product_id` (ForeignKey to Product)
- `status` (CharField)
- `start_date` (DateTimeField)
- `end_date` (DateTimeField)
- `renewal_price` (DecimalField)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

**Решение:**
1. Переименовали старую таблицу в `user_products_old_adonis`
2. Создали новую таблицу `user_products` через Django миграцию

### 4. Улучшение UserAdmin

Добавили в `UserAdmin`:

- **Отображение связанных данных**: Показывает количество связанных записей
- **Защита от удаления суперпользователя**: Нельзя удалить суперпользователя
- **Кастомное удаление**: Обработка ошибок с информативными сообщениями
- **Массовое удаление**: Исключение суперпользователей из массового удаления

## Текущее состояние Foreign Keys

Все Foreign Keys, ссылающиеся на `users.id`:

| Таблица | Колонка | ON DELETE | Описание |
|---------|---------|-----------|----------|
| `audit_logs` | `actor_id` | SET NULL | Записи аудита остаются |
| `auth_access_tokens` | `tokenable_id` | CASCADE | Токены удаляются |
| `django_admin_log` | `user_id` | SET NULL | Логи остаются |
| `mandates` | `user_id` | CASCADE | Мандаты удаляются |
| `manual_charges` | `initiator_id` | SET NULL | Списания остаются |
| `manual_charges` | `user_id` | CASCADE | Списания удаляются |
| `orders` | `user_id` | SET NULL | Заказы остаются |
| `payment_methods` | `user_id` | CASCADE | Методы оплаты удаляются |
| `payments` | `user_id` | SET NULL | Платежи остаются |
| `referral_payouts` | `referrer_id` | CASCADE | Выплаты удаляются |
| `referrals` | `referred_user_id` | CASCADE | Реферальные записи удаляются |
| `referrals` | `referrer_id` | CASCADE | Реферальные записи удаляются |
| `transactions` | `user_id` | SET NULL | Транзакции остаются |
| `user_products` | `user_id` | CASCADE | Продукты пользователя удаляются |
| `users` | `referred_by` | SET NULL | Реферальная связь обнуляется |
| `users_groups` | `user_id` | CASCADE | Связи с группами удаляются |
| `users_user_permissions` | `user_id` | CASCADE | Связи с правами удаляются |

## Результат

✅ Все Foreign Key constraints исправлены  
✅ ManyToMany таблицы созданы  
✅ Таблица `user_products` пересоздана с правильной структурой  
✅ Удаление пользователей работает без ошибок  
✅ Связанные данные обрабатываются правильно  
✅ Суперпользователи защищены от удаления  
✅ В админке отображается информация о связанных данных  

## Миграция данных (опционально)

Если нужно мигрировать данные из старой таблицы `user_products_old_adonis` в новую `user_products`:

```python
from apps.users.models import User
from apps.products.models import Product, UserProduct
from django.db import connection
import json

cursor = connection.cursor()
cursor.execute('SELECT email, items FROM user_products_old_adonis;')
old_data = cursor.fetchall()

for email, items in old_data:
    try:
        user = User.objects.get(email=email)
        items_list = json.loads(items) if isinstance(items, str) else items
        
        for item in items_list:
            # Create UserProduct records based on old data
            # This is a simplified example - adjust based on your data structure
            product = Product.objects.get(slug=item.get('slug'))
            UserProduct.objects.create(
                user=user,
                product=product,
                status='active',
                # ... other fields
            )
    except User.DoesNotExist:
        print(f'User not found: {email}')
    except Exception as e:
        print(f'Error processing {email}: {e}')
```

## Файлы изменены

- `api-django/apps/users/admin.py` - улучшен UserAdmin
- `api-django/apps/users/models.py` - модель User (без изменений структуры)
- База данных - исправлены Foreign Key constraints, созданы ManyToMany таблицы, пересоздана таблица `user_products`

