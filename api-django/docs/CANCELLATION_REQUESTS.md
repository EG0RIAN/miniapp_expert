# Система отмены подписки через реферала

## Описание

Когда пользователь запрашивает отмену подписки, она **не отменяется сразу**. Вместо этого:

1. ✅ Создается **запрос на отмену** (CancellationRequest)
2. ✅ Запрос отправляется **рефералу**, который привел пользователя
3. ✅ У реферала есть **24 часа** для принятия решения:
   - Одобрить отмену → подписка отменяется
   - Отклонить отмену → подписка сохраняется
4. ✅ Если реферал не принял решение → подписка **автоматически отменяется** через 24 часа

---

## Архитектура

### Модель: `CancellationRequest`

```python
class CancellationRequest(models.Model):
    user_product = models.ForeignKey(UserProduct)  # Подписка
    requested_by = models.ForeignKey(User)  # Пользователь
    referrer = models.ForeignKey(User, null=True)  # Реферал
    
    status = models.CharField(choices=[
        ('pending', 'Ожидает решения'),
        ('approved', 'Одобрено'),
        ('rejected', 'Отклонено'),
        ('expired', 'Истекло'),
    ])
    
    cancellation_reason = models.TextField()  # Причина от пользователя
    decision_comment = models.TextField()  # Комментарий реферала
    
    expires_at = models.DateTimeField()  # Истекает через 24 часа
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## API Endpoints

### 1. Создать запрос на отмену

```http
POST /api/client/cancellation-requests/
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_product_id": "uuid",
  "cancellation_reason": "Не пользуюсь сервисом"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Запрос на отмену отправлен. Ваш реферал примет решение в течение 24 часов.",
  "request": {
    "id": "uuid",
    "status": "pending",
    "time_left": "23 ч 59 мин"
  }
}
```

---

### 2. Мои запросы на отмену

```http
GET /api/client/my-cancellation-requests/
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "product_name": "Mini App для недвижимости",
      "status": "pending",
      "time_left": "12 ч 30 мин",
      "referrer_email": "referrer@example.com",
      "created_at": "2025-11-13T10:00:00Z"
    }
  ]
}
```

---

### 3. Запросы от моих рефералов

```http
GET /api/client/referral-cancellation-requests/
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "pending": [
    {
      "id": "uuid",
      "user_email": "user@example.com",
      "product_name": "Mini App для недвижимости",
      "cancellation_reason": "Не пользуюсь сервисом",
      "time_left": "18 ч 15 мин",
      "created_at": "2025-11-13T10:00:00Z"
    }
  ],
  "completed": []
}
```

---

### 4. Принять решение (только реферал)

```http
POST /api/client/cancellation-requests/{id}/decision/
Authorization: Bearer {token}
Content-Type: application/json

{
  "decision": "approve",  // или "reject"
  "comment": "Оставьте подписку, она вам пригодится"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Отмена отклонена. Подписка сохранена.",
  "request": {
    "id": "uuid",
    "status": "rejected",
    "decided_at": "2025-11-13T12:00:00Z"
  }
}
```

---

## Celery Tasks

### 1. Автоматическая отмена истекших запросов

```python
@shared_task
def process_expired_cancellation_requests():
    """
    Запускается: Каждый час (crontab(minute=0))
    
    Действия:
    - Находит запросы со статусом 'pending' и expires_at <= now
    - Отменяет подписки
    - Уведомляет пользователя и реферала
    """
```

### 2. Напоминания рефералам

```python
@shared_task
def send_cancellation_reminders():
    """
    Запускается: Каждый час в :30 (crontab(minute=30))
    
    Действия:
    - Находит запросы, которые истекают через 6 часов или меньше
    - Отправляет напоминание рефералу
    - Помечает reminder_sent=True
    """
```

---

## Email уведомления

### 1. При создании запроса → Рефералу

**Тема:** Запрос на отмену подписки от user@example.com

**Текст:**
```
Здравствуйте, {referrer_name}!

Ваш реферал user@example.com запросил отмену подписки "Mini App для недвижимости".

Причина: Не пользуюсь сервисом

У вас есть 24 часа, чтобы принять решение:
- Одобрить отмену (подписка будет отменена)
- Отклонить отмену (подписка сохранится)

Принять решение: https://miniapp.expert/cabinet.html#referral-requests
```

---

### 2. Напоминание → Рефералу

**Тема:** Напоминание: Запрос на отмену подписки (осталось 6 ч)

**Текст:**
```
Здравствуйте, {referrer_name}!

Напоминаем, что ваш реферал user@example.com запросил отмену подписки.

У вас осталось 6 ч для принятия решения.

Принять решение: https://miniapp.expert/cabinet.html#referral-requests
```

---

### 3. При решении → Пользователю

**Тема:** Решение по вашему запросу на отмену подписки

**Текст:**
```
Здравствуйте, {user_name}!

Ваш реферал принял решение по вашему запросу на отмену подписки:

Решение: Отмена отклонена. Подписка сохранена.
Комментарий: Оставьте подписку, она вам пригодится.
```

---

### 4. При автоотмене → Обоим

**Пользователю:**
```
Ваша подписка "..." была отменена.
Причина: Ваш реферал не принял решение в течение 24 часов.
```

**Рефералу:**
```
Подписка вашего реферала user@example.com была автоматически отменена.
Вы не приняли решение в течение 24 часов.
```

---

## Деплой

### 1. Создать миграцию

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py makemigrations payments
python manage.py migrate
```

### 2. Обновить Celery

Убедитесь что в `miniapp_api/celery.py` есть:

```python
app.conf.beat_schedule = {
    # ...
    'process-expired-cancellation-requests-hourly': {
        'task': 'apps.payments.tasks_cancellation.process_expired_cancellation_requests',
        'schedule': crontab(minute=0),
    },
    'send-cancellation-reminders-hourly': {
        'task': 'apps.payments.tasks_cancellation.send_cancellation_reminders',
        'schedule': crontab(minute=30),
    },
}
```

Перезапустить Celery:

```bash
sudo systemctl restart celery-worker
sudo systemctl restart celery-beat
```

### 3. Проверка

```bash
# Проверить статус Celery
sudo systemctl status celery-worker
sudo systemctl status celery-beat

# Проверить логи
sudo journalctl -u celery-worker -f
sudo journalctl -u celery-beat -f

# Тест task вручную
python manage.py shell
>>> from apps.payments.tasks_cancellation import process_expired_cancellation_requests
>>> process_expired_cancellation_requests.delay()
```

---

## Админка Django

Доступ: https://miniapp.expert/admin/payments/cancellationrequest/

**Возможности:**
- Просмотр всех запросов
- Фильтрация по статусу, дате, рефералу
- Просмотр времени до истечения
- Действие: Массовая отмена

---

## Frontend (TODO)

### 1. Кнопка отмены для пользователя

В `cabinet.html` → Раздел "Мои подписки":

Вместо прямой отмены показать модальное окно:
```html
<button onclick="requestCancellation(subscriptionId)">
  Отменить подписку
</button>
```

### 2. Раздел для реферала

В `cabinet.html` → Новый раздел "Запросы на отмену":

```html
<section id="section-cancellation-requests">
  <h2>Запросы на отмену от рефералов</h2>
  <!-- Список запросов -->
  <!-- Кнопки: Одобрить / Отклонить -->
</section>
```

---

## Тестирование

### 1. Создать запрос на отмену

```bash
curl -X POST https://miniapp.expert/api/client/cancellation-requests/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_product_id": "...",
    "cancellation_reason": "Тестовая отмена"
  }'
```

### 2. Проверить email

- Реферал получил письмо?
- Ссылка работает?

### 3. Принять решение

```bash
curl -X POST https://miniapp.expert/api/client/cancellation-requests/{id}/decision/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "reject",
    "comment": "Оставьте подписку"
  }'
```

### 4. Проверить автоотмену

Изменить `expires_at` в БД на прошедшее время:

```python
from apps.payments.models_cancellation import CancellationRequest
req = CancellationRequest.objects.get(id='...')
from datetime import timedelta
from django.utils import timezone
req.expires_at = timezone.now() - timedelta(hours=1)
req.save()
```

Запустить task:

```python
from apps.payments.tasks_cancellation import process_expired_cancellation_requests
process_expired_cancellation_requests.delay()
```

Проверить:
- Подписка отменена?
- Email отправлены?

---

## FAQ

### Q: Что если у пользователя нет реферала?

A: Запрос создается со статусом `pending`, но `referrer=None`. Через 24 часа подписка отменяется автоматически.

### Q: Можно ли отменить запрос?

A: Нет, после создания запрос нельзя отменить. Только реферал может принять решение.

### Q: Сколько запросов можно создать?

A: Только один активный запрос (`status='pending'`) на одну подписку. Повторный запрос вернет ошибку.

### Q: Что если реферал удален?

A: Запрос остается, но через 24 часа подписка отменится автоматически.

---

## Мониторинг

### Логи Celery

```bash
sudo journalctl -u celery-worker -f | grep cancellation
sudo journalctl -u celery-beat -f | grep cancellation
```

### Метрики

Добавить в Prometheus/Grafana:
- Количество активных запросов
- Количество истекших запросов
- Среднее время принятия решения
- Процент одобренных/отклоненных

### Алерты

Настроить уведомления если:
- Более 100 активных запросов
- Реферал не отвечает на 10+ запросов
- Email отправка не работает

---

**Дата создания:** 13 ноября 2025  
**Версия:** 1.0  
**Статус:** ✅ Backend готов, Frontend TODO

