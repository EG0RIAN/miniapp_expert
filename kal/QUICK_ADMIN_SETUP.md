# Быстрый доступ к Django Admin

## 🚀 Быстрый способ (рекомендуется)

### На сервере через Docker

```bash
# 1. Подключиться к серверу
ssh root@85.198.110.66

# 2. Создать суперпользователя
docker exec -it miniapp_api python manage.py shell << EOF
from apps.users.models import User
if not User.objects.filter(email='admin@miniapp.expert').exists():
    User.objects.create_superuser('admin@miniapp.expert', 'admin123', name='Admin')
    print('✅ Суперпользователь создан!')
else:
    user = User.objects.get(email='admin@miniapp.expert')
    user.set_password('admin123')
    user.is_staff = True
    user.is_superuser = True
    user.role = 'admin'
    user.save()
    print('✅ Пароль обновлен!')
EOF
```

### Или использовать скрипт

```bash
# На сервере
cd /root/rello/api-django
docker exec miniapp_api bash -c "cd /app && python manage.py shell < /dev/stdin" << 'EOF'
from apps.users.models import User
User.objects.create_superuser('admin@miniapp.expert', 'admin123', name='Admin')
EOF
```

## 📍 Доступ к админке

1. **Откройте в браузере:**
   ```
   https://miniapp.expert/admin/
   ```

2. **Войдите с данными:**
   - Email: `admin@miniapp.expert`
   - Password: `admin123`

## 🔧 Если админка не открывается

### 1. Проверить, что API запущен

```bash
# На сервере
docker ps | grep miniapp_api
# или
systemctl status miniapp-api
```

### 2. Проверить Nginx конфигурацию

```bash
# На сервере
cat /etc/nginx/sites-available/miniapp.expert | grep -A 10 "location /admin"
```

Должно быть:
```nginx
location /admin/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Если нет - добавить и перезагрузить:
```bash
nginx -t && systemctl reload nginx
```

### 3. Проверить логи

```bash
# Логи API
docker logs miniapp_api

# Логи Nginx
tail -f /var/log/nginx/error.log
```

### 4. Проверить ALLOWED_HOSTS

```bash
# В .env файле должно быть:
ALLOWED_HOSTS=miniapp.expert,85.198.110.66,localhost
```

## 🔐 Изменить пароль

```bash
# Через Docker
docker exec -it miniapp_api python manage.py changepassword admin@miniapp.expert

# Или через shell
docker exec -it miniapp_api python manage.py shell
>>> from apps.users.models import User
>>> user = User.objects.get(email='admin@miniapp.expert')
>>> user.set_password('новый-пароль')
>>> user.save()
```

## 📊 Что доступно в админке

После входа вы увидите:

- **👥 Пользователи** - все пользователи, роли, рефералы
- **📦 Заказы** - все продажи с фильтрацией
- **💳 Платежи** - все платежи и транзакции
- **🔄 Транзакции** - все транзакции
- **💰 Ручные списания** - управление списаниями
- **💳 Платежные методы** - сохраненные карты
- **📄 Мандаты** - мандаты на списание
- **📦 Продукты** - управление продуктами
- **🤝 Рефералы** - реферальная программа
- **💸 Выплаты рефералов** - управление выплатами
- **📋 Журнал аудита** - все действия пользователей

## 🎯 API Endpoints (через браузер или Postman)

После входа в админку, вы также можете использовать API:

1. **Получить токен:**
   ```bash
   curl -X POST https://miniapp.expert/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@miniapp.expert","password":"admin123"}'
   ```

2. **Использовать токен для API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://miniapp.expert/api/admin/orders/
   ```

## ⚠️ Безопасность

**Важно:** После первого входа измените пароль по умолчанию!

```bash
# В админке: Пользователи → выбрать пользователя → Изменить пароль
# Или через команду:
docker exec -it miniapp_api python manage.py changepassword admin@miniapp.expert
```

## 🆘 Проблемы и решения

### Ошибка "CSRF verification failed"

Решение: Убедитесь, что используете HTTPS и правильный домен

### Ошибка "404 Not Found"

Решение: Проверьте, что Nginx правильно проксирует `/admin/` на Django

### Ошибка "500 Internal Server Error"

Решение: Проверьте логи Django:
```bash
docker logs miniapp_api
```

### Не могу войти (неверный пароль)

Решение: Сбросить пароль:
```bash
docker exec -it miniapp_api python manage.py changepassword admin@miniapp.expert
```

