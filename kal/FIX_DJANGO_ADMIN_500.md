# Исправление ошибки 500 в Django Admin

## Проблема

При попытке входа в Django Admin (`https://miniapp.expert/admin/login/`) возникала ошибка 500 Server Error.

## Причины

### 1. Отсутствие поля `referred_by_id`

Django автоматически добавляет суффикс `_id` к именам ForeignKey полей, но в базе данных поле называлось `referred_by`.

**Решение:** Добавлен `db_column='referred_by'` в модель User:

```python
referred_by = models.ForeignKey(
    'self', 
    on_delete=models.SET_NULL, 
    null=True, 
    blank=True, 
    related_name='referrals', 
    db_column='referred_by'  # Указываем явное имя колонки в БД
)
```

### 2. Отсутствие поля `phone`

Модель User содержала поле `phone`, но оно не существовало в базе данных.

**Решение:** Добавлено поле в базу данных:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
```

## Выполненные исправления

### 1. Обновлена модель User

**Файл:** `api-django/apps/users/models.py`

```python
referred_by = models.ForeignKey(
    'self', 
    on_delete=models.SET_NULL, 
    null=True, 
    blank=True, 
    related_name='referrals', 
    db_column='referred_by'  # Явное указание имени колонки
)
phone = models.CharField(max_length=20, blank=True, null=True)
```

### 2. Добавлено поле phone в базу данных

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
```

### 3. Проверка работы модели

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py shell
>>> from apps.users.models import User
>>> user = User.objects.first()
>>> print(user.email, user.is_staff, user.is_superuser)
```

## Статус

✅ Ошибка 500 исправлена
✅ Django Admin доступен по адресу `https://miniapp.expert/admin/`
✅ Страница входа загружается корректно
✅ Модель User работает без ошибок

## Проверка

### 1. Проверка страницы входа
```bash
curl -I https://miniapp.expert/admin/login/
# Должен вернуть: HTTP/1.1 200 OK
```

### 2. Проверка модели User
```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.count()
>>> user = User.objects.first()
>>> print(user.email)
```

### 3. Вход в Django Admin

1. Откройте `https://miniapp.expert/admin/` в браузере
2. Войдите с учетными данными:
   - **Email:** `admin@miniapp.expert`
   - **Password:** `admin123` (или установленный пароль)

## Важно

Если возникают ошибки с другими полями, проверьте структуру таблицы:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;
```

И убедитесь, что все поля из модели User существуют в базе данных.

## Следующие шаги

1. ✅ Проверить, что все поля модели существуют в БД
2. ✅ Убедиться, что миграции применены
3. ✅ Проверить права администраторов (`is_staff = TRUE`, `is_superuser = TRUE`)
4. ✅ Создать суперпользователя, если его нет:

```bash
python manage.py createsuperuser
```

