# 🚀 Как зайти в Django Admin

## Быстрый способ (если Django уже запущен)

### 1. Создать суперпользователя

**На сервере:**
```bash
ssh root@85.198.110.66
docker exec -it miniapp_api python manage.py shell
```

**В Django shell:**
```python
from apps.users.models import User

# Создать или обновить суперпользователя
if User.objects.filter(email='admin@miniapp.expert').exists():
    user = User.objects.get(email='admin@miniapp.expert')
    user.set_password('admin123')
    user.is_staff = True
    user.is_superuser = True
    user.role = 'admin'
    user.save()
    print('✅ Пароль обновлен!')
else:
    User.objects.create_superuser(
        email='admin@miniapp.expert',
        password='admin123',
        name='Admin'
    )
    print('✅ Суперпользователь создан!')
```

**Или одной командой:**
```bash
docker exec miniapp_api python manage.py shell << 'EOF'
from apps.users.models import User
user, created = User.objects.get_or_create(email='admin@miniapp.expert', defaults={'name': 'Admin'})
user.set_password('admin123')
user.is_staff = True
user.is_superuser = True
user.role = 'admin'
user.save()
print('✅ Суперпользователь готов!' if created else '✅ Пароль обновлен!')
EOF
```

### 2. Открыть админку в браузере

```
https://miniapp.expert/admin/
```

### 3. Войти с данными

- **Email:** `admin@miniapp.expert`
- **Password:** `admin123`

## Если админка не открывается

### Проверить, что API запущен

```bash
# На сервере
docker ps | grep miniapp_api
# Должен быть запущен контейнер miniapp_api
```

Если не запущен:
```bash
cd /root/rello
docker-compose up -d api
```

### Проверить Nginx конфигурацию

```bash
# На сервере
cat /etc/nginx/sites-available/miniapp.expert | grep -A 5 "location /admin"
```

Если нет конфигурации для `/admin/`, добавить:
```nginx
location /admin/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Затем перезагрузить Nginx:
```bash
nginx -t && systemctl reload nginx
```

### Проверить логи

```bash
# Логи API
docker logs miniapp_api

# Логи Nginx
tail -f /var/log/nginx/error.log
```

## Что доступно в админке

После входа вы увидите:

### 📊 Основные разделы:

1. **Пользователи (Users)**
   - Все пользователи
   - Роли (admin, finance_manager, client)
   - Реферальная программа
   - Верификация email

2. **Заказы (Orders)**
   - Все продажи
   - Фильтрация по статусу, дате, продукту
   - Поиск по email, телефону, ID заказа

3. **Платежи (Payments)**
   - Все платежи
   - Статусы платежей
   - Методы оплаты

4. **Транзакции (Transactions)**
   - Все транзакции
   - Типы транзакций
   - Связь с заказами и платежами

5. **Ручные списания (Manual Charges)**
   - Ручные списания по MIT и РКО
   - Статусы списаний
   - Инициаторы списаний

6. **Платежные методы (Payment Methods)**
   - Сохраненные карты
   - Статусы карт
   - Маски карт

7. **Мандаты (Mandates)**
   - Мандаты на безакцептное списание
   - Статусы мандатов

8. **Продукты (Products)**
   - Все продукты
   - Типы продуктов (one_time, subscription)
   - Цены и валюты

9. **Рефералы (Referrals)**
   - Реферальная программа
   - Комиссии
   - Статусы рефералов

10. **Выплаты рефералов (Referral Payouts)**
    - Выплаты рефералам
    - Статусы выплат

11. **Журнал аудита (Audit Logs)**
    - Все действия пользователей
    - История изменений
    - IP и user agent

## API Endpoints (альтернатива админке)

Вы также можете использовать REST API:

### 1. Получить токен

```bash
curl -X POST https://miniapp.expert/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miniapp.expert","password":"admin123"}'
```

Ответ:
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@miniapp.expert",
    "role": "admin"
  }
}
```

### 2. Использовать токен для API

```bash
# Получить список заказов
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://miniapp.expert/api/admin/orders/

# Получить статистику
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://miniapp.expert/api/admin/orders/statistics/?period=month

# Получить список пользователей
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://miniapp.expert/api/admin/users/
```

## Изменить пароль

### Через админку

1. Зайти в админку
2. Пользователи → выбрать пользователя
3. Изменить пароль

### Через команду

```bash
docker exec -it miniapp_api python manage.py changepassword admin@miniapp.expert
```

### Через shell

```bash
docker exec -it miniapp_api python manage.py shell
```

```python
from apps.users.models import User
user = User.objects.get(email='admin@miniapp.expert')
user.set_password('новый-пароль')
user.save()
```

## Безопасность

⚠️ **Важно после первого входа:**

1. Измените пароль по умолчанию
2. Используйте сильный пароль (минимум 12 символов)
3. Не делитесь учетными данными
4. Регулярно проверяйте журнал аудита

## Полезные команды

```bash
# Список всех пользователей
docker exec miniapp_api python manage.py shell
>>> from apps.users.models import User
>>> User.objects.all()

# Количество заказов
>>> from apps.orders.models import Order
>>> Order.objects.count()

# Количество платежей
>>> from apps.payments.models import Payment
>>> Payment.objects.count()
```

