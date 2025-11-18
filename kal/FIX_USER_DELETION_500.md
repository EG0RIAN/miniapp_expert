# Исправление ошибки 500 при удалении пользователя

## Проблема

При попытке удалить пользователя в Django Admin возникала ошибка `Server Error (500)` из-за Foreign Key constraints с `ON DELETE: NO ACTION`.

## Причина

В базе данных были Foreign Key constraints с `ON DELETE: NO ACTION`, которые блокировали удаление пользователей, имеющих связанные записи:

1. `django_admin_log.user_id` → `users.id` (NO ACTION)
2. `referral_payouts.referrer_id` → `users.id` (NO ACTION)
3. `referrals.referred_user_id` → `users.id` (NO ACTION)
4. `referrals.referrer_id` → `users.id` (NO ACTION)

## Решение

### 1. Исправление Foreign Key Constraints

Изменили все `NO ACTION` constraints на правильные действия:

- **django_admin_log.user_id**: `SET NULL` (логи администратора должны остаться, но user_id будет обнулен)
- **referral_payouts.referrer_id**: `CASCADE` (выплаты удаляются вместе с пользователем)
- **referrals.referred_user_id**: `CASCADE` (реферальные записи удаляются)
- **referrals.referrer_id**: `CASCADE` (реферальные записи удаляются)

### 2. Улучшение UserAdmin

Добавили в `UserAdmin`:

- **Отображение связанных данных**: Показывает количество связанных записей (заказы, платежи, методы оплаты, списания, рефералы, выплаты) в списке пользователей и в детальном просмотре
- **Защита от удаления суперпользователя**: Нельзя удалить суперпользователя через админку
- **Кастомное удаление**: Обработка ошибок при удалении с информативными сообщениями
- **Массовое удаление**: Исключение суперпользователей из массового удаления

### 3. SQL команды для исправления

```sql
-- django_admin_log.user_id
ALTER TABLE django_admin_log DROP CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_id;
ALTER TABLE django_admin_log ADD CONSTRAINT django_admin_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- referral_payouts.referrer_id
ALTER TABLE referral_payouts DROP CONSTRAINT referral_payouts_referrer_id_9f2f1f40_fk_users_id;
ALTER TABLE referral_payouts ADD CONSTRAINT referral_payouts_referrer_id_fkey 
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE;

-- referrals.referred_user_id
ALTER TABLE referrals DROP CONSTRAINT referrals_referred_user_id_df5d6ca1_fk_users_id;
ALTER TABLE referrals ADD CONSTRAINT referrals_referred_user_id_fkey 
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- referrals.referrer_id
ALTER TABLE referrals DROP CONSTRAINT referrals_referrer_id_9511d264_fk_users_id;
ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_id_fkey 
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Текущее состояние Foreign Keys

Все Foreign Keys, ссылающиеся на `users.id`:

| Таблица | Колонка | ON DELETE | Описание |
|---------|---------|-----------|----------|
| `audit_logs` | `actor_id` | SET NULL | Записи аудита остаются, actor_id обнуляется |
| `auth_access_tokens` | `tokenable_id` | CASCADE | Токены удаляются |
| `django_admin_log` | `user_id` | SET NULL | Логи остаются, user_id обнуляется |
| `mandates` | `user_id` | CASCADE | Мандаты удаляются |
| `manual_charges` | `initiator_id` | SET NULL | Списания остаются, initiator_id обнуляется |
| `manual_charges` | `user_id` | CASCADE | Списания удаляются |
| `orders` | `user_id` | SET NULL | Заказы остаются, user_id обнуляется |
| `payment_methods` | `user_id` | CASCADE | Методы оплаты удаляются |
| `payments` | `user_id` | SET NULL | Платежи остаются, user_id обнуляется |
| `referral_payouts` | `referrer_id` | CASCADE | Выплаты удаляются |
| `referrals` | `referred_user_id` | CASCADE | Реферальные записи удаляются |
| `referrals` | `referrer_id` | CASCADE | Реферальные записи удаляются |
| `transactions` | `user_id` | SET NULL | Транзакции остаются, user_id обнуляется |
| `users` | `referred_by` | SET NULL | Реферальная связь обнуляется |

## Тестирование

1. Создайте тестового пользователя
2. Попробуйте удалить его через Django Admin
3. Убедитесь, что удаление происходит без ошибок
4. Проверьте, что связанные данные обрабатываются правильно (CASCADE или SET NULL)

## Результат

✅ Все Foreign Key constraints исправлены  
✅ Удаление пользователей работает без ошибок  
✅ Связанные данные обрабатываются правильно  
✅ Суперпользователи защищены от удаления  
✅ В админке отображается информация о связанных данных  

## Файлы изменены

- `api-django/apps/users/admin.py` - улучшен UserAdmin с отображением связанных данных и кастомным удалением
- База данных - исправлены Foreign Key constraints

