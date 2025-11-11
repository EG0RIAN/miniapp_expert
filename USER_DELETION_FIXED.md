# Исправление ошибки 500 при удалении пользователя

## Проблема

При попытке удалить пользователя в Django Admin возникала ошибка `Server Error (500)`.

## Причины

1. **Foreign Key constraints с `ON DELETE: NO ACTION`** - блокировали удаление пользователей
2. **Отсутствие ManyToMany таблиц** - `users_groups`, `users_user_permissions`
3. **Конфликт структуры таблицы `user_products`** - старая структура из AdonisJS не соответствовала Django модели

## Решение

### 1. Исправление Foreign Key Constraints

Изменили все `NO ACTION` constraints на правильные действия:

- `django_admin_log.user_id`: `SET NULL` (логи остаются)
- `referral_payouts.referrer_id`: `CASCADE` (выплаты удаляются)
- `referrals.referred_user_id`: `CASCADE` (реферальные записи удаляются)
- `referrals.referrer_id`: `CASCADE` (реферальные записи удаляются)

### 2. Создание ManyToMany таблиц

Создали таблицы для ManyToMany отношений:

- `users_groups`: Связь пользователей с группами Django
- `users_user_permissions`: Связь пользователей с правами доступа

### 3. Исправление таблицы user_products

**Старая структура (из AdonisJS):**
- `email` (text)
- `items` (jsonb)

**Новая структура (Django модель):**
- `id` (UUID)
- `user_id` (ForeignKey to User)
- `product_id` (ForeignKey to Product)
- `status` (CharField)
- `start_date` (DateTimeField)
- `end_date` (DateTimeField)
- `renewal_price` (DecimalField)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

**Действия:**
1. Переименовали старую таблицу в `user_products_old_adonis`
2. Создали новую таблицу `user_products` с правильной структурой

### 4. Улучшение UserAdmin

Добавили в `UserAdmin`:

- **Отображение связанных данных**: Показывает количество связанных записей в списке и детальном просмотре
- **Защита от удаления суперпользователя**: Нельзя удалить суперпользователя через админку
- **Кастомное удаление**: Обработка ошибок с информативными сообщениями
- **Массовое удаление**: Исключение суперпользователей из массового удаления

## Результат

✅ Все Foreign Key constraints исправлены  
✅ ManyToMany таблицы созданы  
✅ Таблица `user_products` пересоздана с правильной структурой  
✅ Удаление пользователей работает без ошибок  
✅ Связанные данные обрабатываются правильно (CASCADE или SET NULL)  
✅ Суперпользователи защищены от удаления  
✅ В админке отображается информация о связанных данных  

## Тестирование

Удаление пользователя теперь работает корректно:

```python
# Тест удаления пользователя
user = User.objects.get(email='test@example.com')
user.delete()  # ✅ Работает без ошибок
```

## Файлы изменены

- `api-django/apps/users/admin.py` - улучшен UserAdmin
- База данных - исправлены Foreign Key constraints, созданы ManyToMany таблицы, пересоздана таблица `user_products`

## Примечания

- Старая таблица `user_products_old_adonis` сохранена для возможной миграции данных
- Все Foreign Keys теперь имеют правильные действия `ON DELETE`
- Удаление пользователя автоматически обрабатывает связанные данные в зависимости от настроек

