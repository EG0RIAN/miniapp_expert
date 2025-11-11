# Быстрое решение проблемы с SMTP

## Проблема
Провайдер блокирует исходящие SMTP соединения. Порты 587 и 465 недоступны.

## Решение: SendGrid API (рекомендуется)

### 1. Регистрация (2 минуты)
- Перейдите на https://signup.sendgrid.com/
- Зарегистрируйте бесплатный аккаунт
- Подтвердите email

### 2. Создание API ключа (1 минута)
- Settings → API Keys → Create API Key
- Название: "MiniAppExpert"
- Права: "Full Access"
- **Скопируйте ключ сразу!**

### 3. Настройка на сервере (2 минуты)

```bash
# Подключитесь к серверу
ssh root@85.198.110.66

# Установите SendGrid
cd /home/miniapp_expert/api-django
source venv/bin/activate
pip install sendgrid

# Добавьте API ключ в .env
nano .env
# Добавьте строку:
# SENDGRID_API_KEY=ваш_ключ_здесь

# Перезапустите Gunicorn
sudo systemctl restart gunicorn
```

### 4. Тестирование

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py test_emails --email e.arkhiptsev@gmail.com
```

## Альтернатива: Mailgun

Если SendGrid не подходит:

1. Регистрация: https://www.mailgun.com/
2. Получите API ключ и домен
3. Добавьте в `.env`:
   ```env
   MAILGUN_API_KEY=ваш_ключ
   MAILGUN_DOMAIN=ваш_домен.mailgun.org
   ```

## Что уже сделано

✅ Код для работы с SendGrid/Mailgun API добавлен
✅ Функция отправки автоматически пытается использовать API
✅ Настройки для альтернативных методов добавлены в settings.py
✅ Порты открыты в UFW (но провайдер все равно блокирует)

## Следующие шаги

1. Зарегистрируйтесь в SendGrid
2. Получите API ключ
3. Добавьте ключ в `.env` на сервере
4. Установите библиотеку: `pip install sendgrid`
5. Протестируйте отправку

После этого все письма будут отправляться через SendGrid API (HTTPS, порт 443), который не блокируется провайдером.

## Преимущества SendGrid

- ✅ Работает через HTTPS (порт 443 открыт)
- ✅ 100 писем/день бесплатно
- ✅ Надежная доставка
- ✅ Статистика и аналитика
- ✅ Не требует открытия портов

## Поддержка

Если возникли проблемы, проверьте:
1. Правильность API ключа в `.env`
2. Установлена ли библиотека: `pip list | grep sendgrid`
3. Логи: `tail -f /tmp/django-error.log`

