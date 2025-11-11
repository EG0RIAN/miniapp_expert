# Быстрая настройка SendGrid для отправки email

## Проблема
Провайдер блокирует исходящие SMTP соединения (порты 587 и 465). Решение: использовать SendGrid API через HTTPS (порт 443).

## Шаг 1: Регистрация в SendGrid

1. Перейдите на https://signup.sendgrid.com/
2. Зарегистрируйте бесплатный аккаунт (100 писем/день бесплатно)
3. Подтвердите email адрес

## Шаг 2: Создание API ключа

1. Войдите в SendGrid Dashboard
2. Перейдите в Settings → API Keys
3. Нажмите "Create API Key"
4. Укажите имя: "MiniAppExpert Production"
5. Выберите права: "Full Access" (или "Mail Send" для ограниченного доступа)
6. Нажмите "Create & View"
7. **ВАЖНО**: Скопируйте API ключ сразу (он больше не будет показан)

## Шаг 3: Настройка на сервере

### Вариант А: Через переменные окружения (рекомендуется)

1. Подключитесь к серверу:
   ```bash
   ssh root@85.198.110.66
   ```

2. Отредактируйте `.env` файл в проекте:
   ```bash
   cd /home/miniapp_expert/api-django
   nano .env
   ```

3. Добавьте строку:
   ```env
   SENDGRID_API_KEY=ваш_api_ключ_здесь
   ```

4. Сохраните файл (Ctrl+O, Enter, Ctrl+X)

### Вариант Б: Через settings.py (менее безопасно)

Отредактируйте `/home/miniapp_expert/api-django/miniapp_api/settings.py`:
```python
SENDGRID_API_KEY = 'ваш_api_ключ_здесь'
```

## Шаг 4: Установка библиотеки SendGrid

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
pip install sendgrid
```

## Шаг 5: Верификация отправителя (опционально)

Для отправки с домена miniapp.expert:

1. В SendGrid Dashboard перейдите в Settings → Sender Authentication
2. Выберите "Authenticate Your Domain"
3. Следуйте инструкциям по настройке DNS записей
4. Или используйте Single Sender Verification для быстрого старта

## Шаг 6: Тестирование

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py test_emails --email e.arkhiptsev@gmail.com
```

Если все настроено правильно, вы увидите:
```
✓ Email sent via API to e.arkhiptsev@gmail.com
```

## Шаг 7: Перезапуск Gunicorn

```bash
sudo systemctl restart gunicorn
sudo systemctl status gunicorn
```

## Проверка логов

Проверьте логи отправки:
```bash
tail -f /tmp/django-error.log
```

## Отключение тестового режима

После проверки отправки писем, отключите тестовый режим:

1. Отредактируйте `.env`:
   ```env
   EMAIL_TEST_MODE=False
   ```

2. Или в `settings.py`:
   ```python
   EMAIL_TEST_MODE = False
   ```

3. Перезапустите Gunicorn

## Альтернатива: Mailgun

Если SendGrid не подходит, можно использовать Mailgun:

1. Регистрация: https://www.mailgun.com/
2. Получите API ключ и домен
3. Добавьте в `.env`:
   ```env
   MAILGUN_API_KEY=ваш_api_ключ
   MAILGUN_DOMAIN=ваш_домен.mailgun.org
   ```

4. Установите библиотеку (опционально, используется requests):
   ```bash
   pip install requests
   ```

## Мониторинг

В SendGrid Dashboard можно:
- Просматривать статистику отправки
- Проверять доставку писем
- Настраивать webhooks для отслеживания событий

## Лимиты

- **SendGrid Free**: 100 писем/день
- **Mailgun Free**: 5000 писем/месяц

Для production рекомендуется перейти на платный тариф при необходимости.

## Поддержка

Если возникли проблемы:
1. Проверьте правильность API ключа
2. Убедитесь, что библиотека sendgrid установлена
3. Проверьте логи: `/tmp/django-error.log`
4. Проверьте статус в SendGrid Dashboard

