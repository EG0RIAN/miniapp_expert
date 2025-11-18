# Доступ к Django Admin

## Создание суперпользователя

### Вариант 1: Через команду (локально)

```bash
cd api-django
source venv/bin/activate
python manage.py createsuperuser
```

Введите:
- Email: `admin@miniapp.expert` (или любой другой)
- Password: ваш пароль
- Password (again): подтвердите пароль

### Вариант 2: Через Django shell

```bash
python manage.py shell
```

```python
from apps.users.models import User
User.objects.create_superuser(
    email='admin@miniapp.expert',
    password='your-password-here',
    name='Admin'
)
```

### Вариант 3: На сервере через Docker

```bash
# Подключиться к серверу
ssh root@85.198.110.66

# Зайти в контейнер Django
docker exec -it miniapp_api bash

# Создать суперпользователя
python manage.py createsuperuser
```

### Вариант 4: Автоматическое создание через скрипт

```bash
# На сервере
docker exec miniapp_api python manage.py shell << EOF
from apps.users.models import User
if not User.objects.filter(email='admin@miniapp.expert').exists():
    User.objects.create_superuser('admin@miniapp.expert', 'admin123', name='Admin')
    print('Superuser created!')
else:
    print('Superuser already exists!')
EOF
```

## Доступ к админке

### Локально

1. Запустите Django сервер:
   ```bash
   python manage.py runserver
   ```

2. Откройте в браузере:
   ```
   http://localhost:8000/admin/
   ```

3. Войдите с данными суперпользователя:
   - Email: `admin@miniapp.expert`
   - Password: ваш пароль

### На сервере

1. Откройте в браузере:
   ```
   https://miniapp.expert/admin/
   ```

2. Войдите с данными суперпользователя

### Если админка недоступна

Проверьте:

1. **Nginx конфигурация** - должен быть настроен прокси на `/admin/`:
   ```nginx
   location /admin/ {
       proxy_pass http://127.0.0.1:8000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

2. **Django API запущен**:
   ```bash
   docker-compose ps api
   # или
   systemctl status miniapp-api
   ```

3. **ALLOWED_HOSTS в settings.py**:
   ```python
   ALLOWED_HOSTS = ['miniapp.expert', '85.198.110.66', 'localhost']
   ```

## Что доступно в админке

- **Пользователи** - управление пользователями, роли, рефералы
- **Заказы** - все продажи с фильтрацией
- **Платежи** - все платежи и транзакции
- **Транзакции** - все транзакции
- **Ручные списания** - управление списаниями
- **Платежные методы** - сохраненные карты
- **Мандаты** - мандаты на списание
- **Продукты** - управление продуктами
- **Рефералы** - реферальная программа
- **Выплаты рефералов** - управление выплатами
- **Журнал аудита** - все действия пользователей

## Сброс пароля

Если забыли пароль:

```bash
python manage.py changepassword admin@miniapp.expert
```

Или через shell:

```python
from apps.users.models import User
user = User.objects.get(email='admin@miniapp.expert')
user.set_password('new-password')
user.save()
```

## Безопасность

1. **Измените пароль по умолчанию** после первого входа
2. **Используйте сильный пароль** (минимум 12 символов)
3. **Включите 2FA** (если настроено)
4. **Ограничьте доступ** к админке по IP (через Nginx)

## Полезные команды

```bash
# Список всех пользователей
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.all()

# Изменить роль пользователя
>>> user = User.objects.get(email='user@example.com')
>>> user.role = 'admin'
>>> user.save()

# Проверить права доступа
>>> user.is_staff
>>> user.is_superuser
```

