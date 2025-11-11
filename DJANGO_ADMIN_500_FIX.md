# Исправление ошибки 500 в Django Admin

## Проблема

При попытке входа в Django Admin (`https://miniapp.expert/admin/login/`) возникала ошибка 500 Server Error.

## Причина

Таблица `users` в базе данных была создана из старой БД AdonisJS и не имела необходимых полей, которые требует Django `AbstractBaseUser` и `PermissionsMixin`:

- `last_login` (timestamp)
- `is_superuser` (boolean)
- `is_staff` (boolean) 
- `is_active` (boolean)
- `username` (varchar, хотя не используется, так как USERNAME_FIELD = 'email')
- `date_joined` (timestamp)

## Решение

### 1. Добавление недостающих полей в таблицу users

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(150) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_joined TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
```

### 2. Создание миграций для apps.users

```bash
cd /home/miniapp_expert/api-django
mkdir -p apps/users/migrations
touch apps/users/migrations/__init__.py
source venv/bin/activate
python manage.py makemigrations users
```

### 3. Помечание миграции как примененной

Так как таблица уже существует, нужно пометить миграцию как примененную:

```sql
INSERT INTO django_migrations (app, name, applied) 
VALUES ('users', '0001_initial', NOW()) 
ON CONFLICT DO NOTHING;
```

### 4. Обновление прав администраторов

```sql
UPDATE users 
SET is_staff = TRUE, is_superuser = TRUE 
WHERE email = 'admin@miniapp.expert' OR role = 'admin';
```

### 5. Перезапуск Django API

```bash
pkill -HUP -f 'gunicorn.*miniapp_api'
# Или
systemctl restart gunicorn  # если используется systemd
```

## Проверка

```bash
# Проверка модели User
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.count()
>>> user = User.objects.first()
>>> print(user.email, user.is_staff, user.is_superuser)

# Проверка доступа к Admin
curl -I https://miniapp.expert/admin/login/
# Должен вернуть: HTTP/1.1 200 OK
```

## Важные замечания

1. **Миграции**: Если таблица `users` уже существует, нужно либо:
   - Добавить поля вручную (как сделано выше)
   - Или использовать `--fake` при применении миграций
   - Или пометить миграцию как примененную в таблице `django_migrations`

2. **Права администраторов**: Убедитесь, что пользователи с ролью `admin` имеют `is_staff = TRUE` и `is_superuser = TRUE`

3. **Пароли**: Если пользователи были созданы в AdonisJS, их пароли нужно обновить через Django:

```bash
python manage.py shell
>>> from apps.users.models import User
>>> user = User.objects.get(email='admin@miniapp.expert')
>>> user.set_password('новый_пароль')
>>> user.save()
```

## Статус

✅ Ошибка 500 исправлена
✅ Django Admin доступен по адресу `https://miniapp.expert/admin/`
✅ Модель User работает корректно

