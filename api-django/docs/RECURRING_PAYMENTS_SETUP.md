# Настройка автоматического списания подписок

## Обзор

Система автоматически списывает деньги за подписки через 30 дней после оплаты, используя сохраненный RebillId от T-Bank.

## Архитектура

### 1. Процесс оплаты подписки

```
Пользователь → Оплата → T-Bank → Webhook → Django
                           ↓
                       RebillId сохраняется
                           ↓
                  UserProduct создается (активна 30 дней)
```

### 2. Автоматическое списание

```
Celery Beat (ежедневно 10:00)
       ↓
process_recurring_payments
       ↓
Проверка истекающих подписок
       ↓
Списание через T-Bank API (charge_by_rebill)
       ↓
Success: Продление подписки на +30 дней
Failed: Отмена подписки, уведомление пользователя
```

## Компоненты системы

### 1. Management Command

**Файл**: `apps/payments/management/commands/process_recurring_payments.py`

**Запуск вручную**:
```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py process_recurring_payments

# Тестовый режим (без реального списания)
python manage.py process_recurring_payments --dry-run

# Проверка на N дней вперед
python manage.py process_recurring_payments --days-ahead=3
```

### 2. Celery Tasks

**Файл**: `apps/payments/tasks.py`

**Tasks**:
- `process_recurring_payments` - основная задача списания
- `send_subscription_reminders` - напоминания за 3 дня до списания
- `retry_failed_payment` - повторная попытка для неудачных платежей

### 3. Celery Beat Schedule

**Файл**: `miniapp_api/celery.py`

**Расписание**:
- Списание подписок: каждый день в 10:00 UTC
- Напоминания: каждый день в 09:00 UTC

## Установка и запуск

### 1. Настройка Redis

```bash
# Установка Redis (если еще не установлен)
sudo apt update
sudo apt install redis-server

# Запуск Redis
sudo systemctl start redis
sudo systemctl enable redis

# Проверка
redis-cli ping
# Должен вернуть: PONG
```

### 2. Переменные окружения

Добавьте в `.env`:
```env
# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 3. Запуск Celery Worker

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate

# Запуск worker
celery -A miniapp_api worker -l info

# Для production (с systemd)
sudo nano /etc/systemd/system/celery-worker.service
```

**Содержимое `celery-worker.service`**:
```ini
[Unit]
Description=Celery Worker for MiniApp Expert
After=network.target redis.service

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/home/miniapp_expert/api-django
Environment="PATH=/home/miniapp_expert/api-django/venv/bin"
ExecStart=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api worker --detach --loglevel=info --logfile=/var/log/celery/worker.log --pidfile=/var/run/celery/worker.pid
ExecStop=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api control shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Запуск Celery Beat

```bash
# Запуск beat (scheduler)
celery -A miniapp_api beat -l info

# Для production (с systemd)
sudo nano /etc/systemd/system/celery-beat.service
```

**Содержимое `celery-beat.service`**:
```ini
[Unit]
Description=Celery Beat for MiniApp Expert
After=network.target redis.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/miniapp_expert/api-django
Environment="PATH=/home/miniapp_expert/api-django/venv/bin"
ExecStart=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api beat --loglevel=info --logfile=/var/log/celery/beat.log --pidfile=/var/run/celery/beat.pid
Restart=always

[Install]
WantedBy=multi-user.target
```

### 5. Запуск сервисов

```bash
# Создайте директории для логов
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown root:root /var/log/celery /var/run/celery

# Включите и запустите сервисы
sudo systemctl daemon-reload
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat

# Проверка статуса
sudo systemctl status celery-worker
sudo systemctl status celery-beat

# Просмотр логов
sudo tail -f /var/log/celery/worker.log
sudo tail -f /var/log/celery/beat.log
```

## Логика работы

### При оплате подписки:

1. **Пользователь оплачивает** подписку на странице оплаты
2. **T-Bank Init** с `Recurrent=Y` для сохранения карты
3. **T-Bank возвращает** `RebillId` в webhook
4. **Django webhook**:
   - Создает/обновляет `User`
   - Сохраняет `PaymentMethod` с `rebill_id`
   - Создает `UserProduct`:
     - `status='active'`
     - `start_date=now`
     - `end_date=now+30days`
     - `payment_method=PaymentMethod`
   - Создает `Transaction`

### При автоматическом списании:

1. **Celery Beat** запускает задачу в 10:00 каждый день
2. **process_recurring_payments** находит подписки:
   - `status='active'`
   - `end_date <= today`
   - `payment_method` существует и активен
3. **Для каждой подписки**:
   - Создается новый `Order` с типом "RECURRING"
   - Создается `Payment` со статусом "pending"
   - Вызывается `TBankService.charge_by_rebill()`
   - **Успех**: 
     - `Payment.status = 'success'`
     - `UserProduct.end_date += 30 days`
   - **Ошибка**:
     - `Payment.status = 'failed'`
     - `UserProduct.status = 'expired'`
     - TODO: Отправка email пользователю

## Мониторинг

### Проверка работы Celery

```bash
# Список активных workers
celery -A miniapp_api inspect active

# Список запланированных задач
celery -A miniapp_api inspect scheduled

# Статистика
celery -A miniapp_api inspect stats
```

### Проверка расписания Beat

```bash
# Просмотр расписания
celery -A miniapp_api beat --loglevel=debug
```

### Ручной запуск задачи

```python
# В Django shell
from apps.payments.tasks import process_recurring_payments
result = process_recurring_payments.delay()
print(result.get())
```

## Тестирование

### 1. Тестовый режим

```bash
# Запуск без реального списания
python manage.py process_recurring_payments --dry-run
```

### 2. Проверка конкретной подписки

```python
# Django shell
from apps.products.models import UserProduct
from apps.payments.models import PaymentMethod

# Найти подписку
up = UserProduct.objects.filter(
    status='active',
    product__product_type='subscription'
).first()

print(f"User: {up.user.email}")
print(f"Product: {up.product.name}")
print(f"End date: {up.end_date}")
print(f"Payment method: {up.payment_method.rebill_id if up.payment_method else 'None'}")
```

### 3. Принудительное списание

```python
# Django shell
from django.core.management import call_command
call_command('process_recurring_payments')
```

## Troubleshooting

### Celery не запускается

1. Проверьте Redis:
   ```bash
   redis-cli ping
   ```

2. Проверьте конфигурацию в `.env`:
   ```env
   CELERY_BROKER_URL=redis://localhost:6379/0
   ```

3. Проверьте логи:
   ```bash
   sudo journalctl -u celery-worker -f
   sudo journalctl -u celery-beat -f
   ```

### Задачи не выполняются

1. Убедитесь, что worker запущен:
   ```bash
   celery -A miniapp_api inspect active
   ```

2. Проверьте, что задачи зарегистрированы:
   ```bash
   celery -A miniapp_api inspect registered
   ```

3. Проверьте расписание:
   ```bash
   # В логах beat должны быть записи вида:
   # [2025-11-13 10:00:00,000: INFO/MainProcess] Scheduler: Sending due task process-recurring-payments-daily
   ```

### Списание не работает

1. Проверьте наличие `RebillId`:
   ```python
   from apps.payments.models import PaymentMethod
   PaymentMethod.objects.filter(status='active').values('user__email', 'rebill_id')
   ```

2. Проверьте `UserProduct`:
   ```python
   from apps.products.models import UserProduct
   UserProduct.objects.filter(
       status='active',
       product__product_type='subscription',
       payment_method__isnull=False
   ).values('user__email', 'product__name', 'end_date')
   ```

3. Проверьте логи T-Bank API:
   ```bash
   # В логах должны быть записи о запросах к T-Bank
   sudo journalctl -u celery-worker | grep "T-Bank\|charge_by_rebill"
   ```

## Безопасность

1. **RebillId** хранится в зашифрованном виде в базе данных
2. **Логи** не содержат чувствительных данных (карты, CVV)
3. **API ключи** T-Bank в `.env` и не коммитятся в Git
4. **Webhook** проверяет подпись от T-Bank (TODO)

## Масштабирование

Для больших объемов можно:

1. Увеличить количество workers:
   ```bash
   celery -A miniapp_api worker -l info --concurrency=4
   ```

2. Использовать отдельные очереди:
   ```python
   @shared_task(queue='recurring_payments')
   def process_recurring_payments():
       ...
   ```

3. Настроить rate limiting:
   ```python
   @shared_task(rate_limit='10/m')  # 10 задач в минуту
   def process_recurring_payments():
       ...
   ```

## Roadmap

- [ ] Email уведомления о неудачном списании
- [ ] Retry механизм для failed платежей (через 1 час, 6 часов, 24 часа)
- [ ] Admin dashboard для мониторинга списаний
- [ ] Webhooks проверка подписи
- [ ] Grace period (3 дня после истечения подписки)
- [ ] Поддержка разных периодов подписки (weekly, quarterly)

