# Установка пароля администратора

## Выполнено

Пароль `admin123` установлен для всех администраторов в системе.

## Учетные данные для входа

**Email:** `admin@miniapp.expert`  
**Password:** `admin123`

## Администраторы в системе

Все пользователи с правами администратора (`is_superuser=True`) имеют пароль `admin123`:

- `admin@miniapp.expert` - основной администратор
- `admin1762473418@miniapp.expert`
- `superadmin@miniapp.expert`
- `user1762472175@miniapp.expert`

## Доступ к Django Admin

1. Откройте `https://miniapp.expert/admin/` в браузере
2. Введите:
   - **Email:** `admin@miniapp.expert`
   - **Password:** `admin123`
3. Нажмите "Войти"

## Проверка пароля

Пароль установлен через Django `set_password()`, который правильно хэширует пароль используя PBKDF2.

## Изменение пароля

Если нужно изменить пароль:

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py shell
```

```python
from apps.users.models import User
admin = User.objects.get(email='admin@miniapp.expert')
admin.set_password('новый_пароль')
admin.save()
```

Или использовать команду:

```bash
python manage.py changepassword admin@miniapp.expert
```

## Безопасность

⚠️ **Важно:** Пароль `admin123` является слабым и используется только для начальной настройки. Рекомендуется изменить его на более надежный пароль после первого входа.

## Создание нового администратора

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py createsuperuser
```

Или через Django shell:

```python
from apps.users.models import User
User.objects.create_superuser(
    email='newadmin@miniapp.expert',
    password='strong_password',
    name='New Admin'
)
```

