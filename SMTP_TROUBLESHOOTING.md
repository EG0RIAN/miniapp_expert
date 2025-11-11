# Решение проблем с SMTP

## Диагностика проблемы

Проверено:
- ❌ Порт 587 (STARTTLS) - заблокирован
- ❌ Порт 465 (SSL) - заблокирован
- ✅ UFW активен, но разрешает только порт 22
- ✅ Провайдер блокирует исходящие SMTP соединения

## Решения

### Вариант 1: Открыть порты в UFW (уже выполнено)

```bash
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp
sudo ufw reload
```

**Статус**: Порты открыты, но проблема может быть на уровне провайдера.

### Вариант 2: Использовать SMTP через API (РЕКОМЕНДУЕТСЯ)

#### 2.1. SendGrid (бесплатно до 100 писем/день)

1. Зарегистрируйтесь на https://sendgrid.com
2. Создайте API ключ
3. Добавьте в `settings.py`:
   ```python
   SENDGRID_API_KEY = 'your-api-key-here'
   ```

4. Установите библиотеку:
   ```bash
   pip install sendgrid
   ```

5. Обновите `services.py` для использования SendGrid как fallback

#### 2.2. Mailgun (бесплатно до 5000 писем/месяц)

1. Зарегистрируйтесь на https://www.mailgun.com
2. Получите API ключ и домен
3. Добавьте в `settings.py`:
   ```python
   MAILGUN_API_KEY = 'your-api-key-here'
   MAILGUN_DOMAIN = 'your-domain.mailgun.org'
   ```

4. Обновите `services.py` для использования Mailgun

#### 2.3. Yandex SMTP (может работать, если порт 25 открыт)

1. Создайте почтовый ящик на Yandex
2. Включите двухфакторную аутентификацию
3. Создайте пароль приложения
4. Настройте в `settings.py`:
   ```python
   EMAIL_HOST = 'smtp.yandex.ru'
   EMAIL_PORT = 465
   EMAIL_USE_SSL = True
   EMAIL_USE_TLS = False
   EMAIL_HOST_USER = 'your-email@yandex.ru'
   EMAIL_HOST_PASSWORD = 'your-app-password'
   ```

### Вариант 3: Использовать Telegram Bot для уведомлений

Если SMTP полностью недоступен, можно отправлять важные уведомления через Telegram Bot API:

1. Создайте бота через @BotFather
2. Получите токен бота
3. Добавьте функцию отправки через Telegram API

### Вариант 4: Обратиться к провайдеру

Свяжитесь с провайдером хостинга и запросите:
- Разблокировку портов 587 и 465 для исходящих соединений
- Или информацию о разрешенных SMTP серверах

## Текущая конфигурация

### Настройки SMTP в settings.py:
```python
EMAIL_HOST = 'smtp.mail.ru'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = 'no-reply@miniapp.expert'
EMAIL_HOST_PASSWORD = 'WjjmVlTb3OmQ3MxEfavh'
EMAIL_TEST_MODE = True
EMAIL_TEST_RECIPIENT = 'e.arkhiptsev@gmail.com'
```

### Рекомендуемое решение

Использовать SendGrid или Mailgun через API, так как:
1. Не требуется открытие портов
2. Работает через HTTP/HTTPS (порт 443 открыт)
3. Более надежная доставка
4. Бесплатные тарифы достаточны для начала

## Быстрая настройка SendGrid

1. Зарегистрируйтесь: https://signup.sendgrid.com/
2. Создайте API ключ: Settings -> API Keys -> Create API Key
3. Скопируйте ключ
4. Обновите `settings.py`:
   ```python
   SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')
   ```
5. Установите библиотеку:
   ```bash
   pip install sendgrid
   ```
6. Обновите `services.py` для использования SendGrid

## Тестирование

После настройки альтернативного SMTP:

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py test_emails --email e.arkhiptsev@gmail.com
```

## Мониторинг

Проверяйте логи:
- Gunicorn: `/tmp/django-error.log`
- Email отправка: логи в консоли Django

