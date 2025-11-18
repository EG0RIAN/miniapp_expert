# Миграция на Django REST Framework

## Обзор

Проект был переписан с AdonisJS на Django REST Framework для улучшения администрирования продаж, транзакций, пользователей и аффилиатов.

## Структура проекта

```
api-django/
├── manage.py
├── requirements.txt
├── Dockerfile
├── miniapp_api/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── users/          # Пользователи
    ├── products/       # Продукты
    ├── orders/         # Заказы (продажи)
    ├── payments/       # Платежи и транзакции
    ├── affiliates/     # Аффилиаты и рефералы
    └── audit/          # Аудит действий
```

## Модели данных

### Users (Пользователи)
- Email, имя, роль (client/admin/finance_manager)
- Реферальная программа
- Верификация email

### Products (Продукты)
- Название, описание, цена
- Тип (one_time/subscription)
- Период подписки

### Orders (Заказы/Продажи)
- Связь с пользователем и продуктом
- Статус заказа
- Информация о клиенте
- Платежная информация

### Payments (Платежи)
- Связь с заказом
- Статус платежа
- Метод оплаты (card/MIT/RKO)
- Референс провайдера

### Transactions (Транзакции)
- Общая модель для всех транзакций
- Тип (payment/charge/refund/manual_charge)
- Связь с заказом/платежом

### ManualCharges (Ручные списания)
- Списание по MIT или РКО
- Канал списания
- Инициатор
- Статус обработки

### Referrals (Рефералы)
- Связь реферера и реферала
- Комиссия
- Статус

### AuditLog (Журнал аудита)
- Все действия пользователей
- Изменения данных
- IP и user agent

## API Endpoints

### Админка (требует роль admin/finance_manager)

#### Заказы (Продажи)
- `GET /api/admin/orders/` - Список заказов
- `GET /api/admin/orders/{id}/` - Детали заказа
- `GET /api/admin/orders/statistics/` - Статистика по продажам
- `PUT /api/admin/orders/{id}/` - Обновление заказа

#### Платежи
- `GET /api/admin/payments/` - Список платежей
- `GET /api/admin/payments/{id}/` - Детали платежа
- `GET /api/admin/payments/statistics/` - Статистика по платежам

#### Транзакции
- `GET /api/admin/transactions/` - Список транзакций
- `GET /api/admin/transactions/{id}/` - Детали транзакции
- `GET /api/admin/transactions/statistics/` - Статистика по транзакциям

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
- `POST /api/auth/login/` - Вход
- `POST /api/auth/register/` - Регистрация
- `GET /api/auth/profile/` - Профиль пользователя

### Платежи
- `POST /api/payment/create` - Создание платежа
- `POST /api/payment/webhook` - Webhook от T-Bank
- `POST /api/payment/status` - Статус платежа

## Django Admin

Все модели доступны в Django Admin по адресу `/admin/`:

- Пользователи с фильтрацией по роли, статусу верификации
- Заказы с фильтрацией по статусу, дате, продукту
- Платежи с фильтрацией по статусу, методу
- Транзакции с фильтрацией по типу
- Ручные списания с фильтрацией по каналу, статусу
- Рефералы с фильтрацией по статусу
- Выплаты рефералов
- Журнал аудита (только просмотр)

## Установка и запуск

### Локально

```bash
cd api-django
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Отредактируйте .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Docker

```bash
docker-compose up -d
```

## Миграция данных

Данные из старой БД AdonisJS можно мигрировать с помощью Django management команд:

```bash
python manage.py migrate_from_adonis
```

## Особенности

1. **Роли пользователей**: admin, finance_manager, client
2. **Аудит**: Все действия логируются в AuditLog
3. **Фильтрация**: Все списки поддерживают фильтрацию, поиск и сортировку
4. **Статистика**: Endpoints статистики для всех основных сущностей
5. **T-Bank интеграция**: Полная поддержка платежей, MIT, РКО
6. **Реферальная программа**: Управление рефералами и выплатами

## Следующие шаги

1. Миграция данных из старой БД
2. Тестирование всех endpoints
3. Настройка CI/CD
4. Документация API (Swagger/OpenAPI)
5. Клиентские endpoints для личного кабинета

