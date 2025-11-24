# Django REST Framework API для MiniAppExpert

## Описание

Backend API на Django REST Framework для управления продажами, транзакциями, пользователями и аффилиатами.

## Основные возможности

### Админка (Django Admin + REST API)

1. **Продажи (Заказы)**
   - Просмотр всех заказов с фильтрацией
   - Статистика по продажам (по периодам, статусам, продуктам)
   - Обновление статусов заказов
   - Поиск по email, телефону, ID заказа

2. **Транзакции**
   - Просмотр всех транзакций
   - Фильтрация по типу (payment/charge/refund/manual_charge)
   - Статистика по транзакциям
   - Связь с заказами и платежами

3. **Платежи**
   - Просмотр всех платежей
   - Фильтрация по статусу, методу оплаты
   - Статистика по платежам
   - Ручные списания (MIT, РКО)

4. **Пользователи**
   - Управление пользователями
   - Статистика по пользователю (заказы, платежи, рефералы)
   - Фильтрация по роли, статусу верификации
   - Просмотр заказов и платежей пользователя

5. **Аффилиаты**
   - Управление реферальной программой
   - Статистика по рефералам
   - Выплаты рефералов
   - Комиссии за заказы

6. **Аудит**
   - Журнал всех действий
   - История изменений
   - Фильтрация по типу сущности, действию, пользователю

## Установка

### Локально

```bash
cd api-django
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Отредактируйте .env с вашими настройками
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Важные переменные окружения

- `API_BASE_URL` — внутренний URL API (используется фронтом и сервисами)
- `PUBLIC_API_BASE_URL` — внешний URL API, доступный из интернета. Используется для формирования webhook-адресов; обязательно указывайте домен (например, `https://miniapp.expert`), если `API_BASE_URL` смотрит на `localhost` или внутреннюю сеть.
- `PAYMENT_NOTIFICATION_URL` — (опционально) полный URL webhook-а T-Bank. Если не задан, собирается как `<PUBLIC_API_BASE_URL>/api/payment/webhook`.

Без корректного `PUBLIC_API_BASE_URL`/`PAYMENT_NOTIFICATION_URL` T-Bank не сможет доставить уведомление об оплате, и привязка карты останется в статусе `pending`.

### Docker

```bash
docker-compose -f docker-compose-django.yml up -d
```

## API Endpoints

### Админка

#### Заказы (Продажи)
- `GET /api/admin/orders/` - Список заказов
- `GET /api/admin/orders/{id}/` - Детали заказа
- `GET /api/admin/orders/statistics/?period=month` - Статистика
- `PUT /api/admin/orders/{id}/` - Обновление заказа

#### Платежи
- `GET /api/admin/payments/` - Список платежей
- `GET /api/admin/payments/{id}/` - Детали платежа
- `GET /api/admin/payments/statistics/?period=month` - Статистика

#### Транзакции
- `GET /api/admin/transactions/` - Список транзакций
- `GET /api/admin/transactions/{id}/` - Детали транзакции
- `GET /api/admin/transactions/statistics/?period=month` - Статистика

#### Ручные списания
- `GET /api/admin/manual-charges/` - Список списаний
- `POST /api/admin/manual-charges/` - Создание списания
- `GET /api/admin/manual-charges/{id}/` - Детали списания

#### Пользователи
- `GET /api/admin/users/` - Список пользователей
- `GET /api/admin/users/{id}/` - Детали пользователя
- `GET /api/admin/users/{id}/statistics/` - Статистика пользователя
- `GET /api/admin/users/{id}/orders/` - Заказы пользователя
- `GET /api/admin/users/{id}/payments/` - Платежи пользователя
- `PUT /api/admin/users/{id}/` - Обновление пользователя

#### Аффилиаты
- `GET /api/admin/referrals/` - Список рефералов
- `GET /api/admin/referrals/statistics/` - Статистика по рефералам
- `GET /api/admin/referral-payouts/` - Выплаты рефералов
- `GET /api/admin/referral-commissions/` - Комиссии рефералов

### Аутентификация

- `POST /api/auth/login/` - Вход (требует email и password)
- `POST /api/auth/register/` - Регистрация
- `GET /api/auth/profile/` - Профиль пользователя (требует токен)

### Платежи

- `POST /api/payment/create` - Создание платежа
- `POST /api/payment/webhook` - Webhook от T-Bank
- `POST /api/payment/status` - Статус платежа

## Django Admin

Доступен по адресу `/admin/` после создания superuser:

```bash
python manage.py createsuperuser
```

Все модели доступны с фильтрацией, поиском и экспортом данных.

## Фильтрация и поиск

Все endpoints поддерживают:

- **Фильтрацию** через query параметры: `?status=CONFIRMED&currency=RUB`
- **Поиск** через параметр `search`: `?search=email@example.com`
- **Сортировку** через параметр `ordering`: `?ordering=-created_at`
- **Пагинацию**: автоматическая пагинация по 20 записей на страницу

## Статистика

Endpoints статистики поддерживают параметр `period`:
- `all` - все время
- `today` - сегодня
- `week` - последние 7 дней
- `month` - последние 30 дней
- `year` - последний год

Пример: `GET /api/admin/orders/statistics/?period=month`

## Права доступа

- **Admin** - полный доступ ко всем endpoints
- **Finance Manager** - доступ к заказам, платежам, транзакциям, ручным списаниям, рефералам
- **Client** - доступ только к своим данным через client endpoints

## Миграция данных

Для миграции данных из старой БД AdonisJS:

1. Экспорт данных из старой БД
2. Импорт в Django через management команды (TODO)
3. Проверка данных в Django Admin

## Следующие шаги

1. Создание миграций: `python manage.py makemigrations`
2. Применение миграций: `python manage.py migrate`
3. Создание superuser: `python manage.py createsuperuser`
4. Тестирование API endpoints
5. Настройка Nginx для проксирования на Django
6. Миграция данных из старой БД

