# Исправление функции "Забыли пароль?"

## Проблема
Функция "Забыли пароль?" не работает из-за блокировки SMTP провайдером.

## Решение

### 1. Улучшена обработка ошибок
- API теперь правильно возвращает ошибку, если email не отправлен
- Фронтенд показывает понятное сообщение об ошибке
- Добавлен код ошибки `EMAIL_SEND_FAILED` для лучшей диагностики

### 2. Текущий статус
- ✅ API endpoint работает корректно
- ✅ Функция `handleForgotPassword` работает
- ✅ Модальное окно `promptModal` работает
- ❌ Email не отправляется (SMTP заблокирован)

### 3. Что нужно сделать

#### Вариант А: Настроить SendGrid (рекомендуется)
1. Зарегистрируйтесь на https://signup.sendgrid.com/
2. Создайте API ключ
3. Добавьте в `.env` на сервере:
   ```env
   SENDGRID_API_KEY=ваш_ключ
   ```
4. Установите библиотеку:
   ```bash
   pip install sendgrid
   ```
5. Перезапустите Gunicorn

#### Вариант Б: Настроить Mailgun
1. Зарегистрируйтесь на https://www.mailgun.com/
2. Получите API ключ и домен
3. Добавьте в `.env`:
   ```env
   MAILGUN_API_KEY=ваш_ключ
   MAILGUN_DOMAIN=ваш_домен.mailgun.org
   ```

### 4. Тестирование

После настройки SendGrid/Mailgun:

```bash
# На сервере
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py test_emails --email e.arkhiptsev@gmail.com
```

### 5. Текущее поведение

**Если email не отправляется:**
- Пользователь видит сообщение: "К сожалению, не удалось отправить письмо на указанный email"
- В консоли браузера логируется ошибка
- Токен сброса пароля все равно создается (можно использовать вручную)

**Если email отправляется:**
- Пользователь видит успешное сообщение
- Письмо приходит на указанный email (или на тестовый email в тестовом режиме)

## Файлы изменены

1. `api-django/apps/users/views.py` - улучшена обработка ошибок отправки email
2. `site/login.html` - улучшена обработка ошибок на фронтенде
3. `api-django/apps/users/services.py` - добавлена поддержка альтернативных методов отправки

## Следующие шаги

1. Настроить SendGrid или Mailgun (см. `SETUP_SENDGRID.md`)
2. Протестировать отправку писем
3. Отключить тестовый режим после проверки

## Диагностика

Проверьте логи на сервере:
```bash
tail -f /tmp/django-error.log
```

Проверьте работу API:
```bash
curl -X POST https://miniapp.expert/api/auth/password-reset/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Если видите `"error_code": "EMAIL_SEND_FAILED"`, значит проблема в отправке email. Настройте SendGrid или Mailgun.

