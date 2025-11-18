# Руководство по настройке Google Authenticator (TOTP) для админки

## Обзор

Реализована поддержка Google Authenticator (TOTP) для двухфакторной аутентификации в админ-панели Django. Теперь вместо email OTP можно использовать приложение Google Authenticator для входа.

## Как это работает

1. **При входе в админку:**
   - Пользователь вводит email и пароль
   - Если TOTP настроен и включен → запрашивается код из Google Authenticator
   - Если TOTP не настроен → отправляется код на email (старый способ)

2. **Настройка TOTP:**
   - Администратор заходит в админку (через email OTP, если TOTP еще не настроен)
   - Переходит на страницу настройки: `/admin/setup-totp/`
   - Отсканирует QR-код в приложении Google Authenticator
   - Вводит код из приложения для подтверждения
   - TOTP активируется

## Деплой

### 1. Загрузка файлов на сервер

```bash
./deploy-totp-admin.sh
```

Или вручную:

```bash
# Загрузить файлы
scp api-django/apps/users/totp_services.py root@85.198.110.66:/home/miniapp_expert/api-django/apps/users/
scp api-django/apps/users/admin_totp_views.py root@85.198.110.66:/home/miniapp_expert/api-django/apps/users/
scp api-django/apps/users/admin_views_custom.py root@85.198.110.66:/home/miniapp_expert/api-django/apps/users/
scp api-django/apps/users/admin.py root@85.198.110.66:/home/miniapp_expert/api-django/apps/users/
scp api-django/apps/users/models.py root@85.198.110.66:/home/miniapp_expert/api-django/apps/users/
scp api-django/miniapp_api/admin.py root@85.198.110.66:/home/miniapp_expert/api-django/miniapp_api/
scp api-django/miniapp_api/settings.py root@85.198.110.66:/home/miniapp_expert/api-django/miniapp_api/
scp api-django/templates/admin/setup_totp.html root@85.198.110.66:/home/miniapp_expert/api-django/templates/admin/
scp api-django/templates/admin/admin_login_otp.html root@85.198.110.66:/home/miniapp_expert/api-django/templates/admin/
scp api-django/requirements.txt root@85.198.110.66:/home/miniapp_expert/api-django/

# Установить зависимости
ssh root@85.198.110.66 "cd /home/miniapp_expert/api-django && source venv/bin/activate && pip install pyotp qrcode[pil]"

# Создать миграции
ssh root@85.198.110.66 "cd /home/miniapp_expert/api-django && source venv/bin/activate && python manage.py makemigrations users"

# Применить миграции
ssh root@85.198.110.66 "cd /home/miniapp_expert/api-django && source venv/bin/activate && python manage.py migrate users"

# Перезапустить Gunicorn
ssh root@85.198.110.66 "sudo systemctl restart gunicorn"
```

### 2. Настройка TOTP для администратора

1. Войдите в админку: `https://miniapp.expert/admin/login/`
   - Введите email и пароль
   - Введите код из email (если TOTP еще не настроен)

2. Перейдите на страницу настройки: `https://miniapp.expert/admin/setup-totp/`

3. Установите приложение Google Authenticator на телефон (iOS или Android)

4. Откройте приложение и нажмите "+" для добавления аккаунта

5. Выберите "Сканировать QR-код"

6. Отсканируйте QR-код на странице настройки

7. Введите 6-значный код из приложения в поле "Код из Google Authenticator"

8. Нажмите "Подтвердить и включить TOTP"

9. Готово! Теперь при входе в админку будет запрашиваться код из Google Authenticator

## Использование

### Вход в админку с TOTP

1. Откройте `https://miniapp.expert/admin/login/`
2. Введите email и пароль
3. Откройте приложение Google Authenticator
4. Введите 6-значный код из приложения
5. Нажмите "Подтвердить"

### Отключение TOTP

1. Войдите в админку
2. Перейдите на `/admin/setup-totp/`
3. В разделе "Отключить Google Authenticator" введите "отключить" в поле подтверждения
4. Нажмите "Отключить TOTP"
5. Теперь будет использоваться email OTP

## Технические детали

### Новые поля в модели User

- `totp_secret` (CharField, max_length=32) - секретный ключ для TOTP
- `totp_enabled` (BooleanField) - включен ли TOTP

### Новые файлы

- `apps/users/totp_services.py` - сервисы для работы с TOTP
- `apps/users/admin_totp_views.py` - views для настройки TOTP
- `templates/admin/setup_totp.html` - шаблон для настройки TOTP

### Зависимости

- `pyotp==2.9.0` - библиотека для работы с TOTP
- `qrcode[pil]==8.2` - библиотека для генерации QR-кодов

### URL-маршруты

- `/admin/login/` - вход в админку (с поддержкой TOTP и email OTP)
- `/admin/setup-totp/` - настройка TOTP
- `/admin/disable-totp/` - отключение TOTP
- `/admin/resend-otp/` - повторная отправка email OTP

## Решение проблем

### Ошибка 500 при входе в админку

**Причина:** Поля `totp_secret` и `totp_enabled` отсутствуют в базе данных.

**Решение:**
1. Примените миграции: `python manage.py migrate users`
2. Перезапустите Gunicorn: `sudo systemctl restart gunicorn`

### Неверный код TOTP

**Причина:** Неправильное время на сервере или в приложении.

**Решение:**
1. Проверьте время на сервере: `date`
2. Синхронизируйте время: `sudo ntpdate -s time.nist.gov`
3. Проверьте время в приложении Google Authenticator

### Email OTP не отправляется

**Причина:** Проблемы с SMTP или сетью.

**Решение:**
1. Настройте TOTP (Google Authenticator) - это решит проблему
2. Или проверьте настройки SMTP в `settings.py`

### Не могу настроить TOTP

**Причина:** Не установлены зависимости или отсутствуют файлы.

**Решение:**
1. Установите зависимости: `pip install pyotp qrcode[pil]`
2. Проверьте, что файлы загружены на сервер
3. Перезапустите Gunicorn

## Безопасность

- TOTP секрет хранится в базе данных в открытом виде (это нормально, так как он используется только для генерации кодов)
- Коды TOTP действительны только в течение 30 секунд
- Поддерживается проверка предыдущего и следующего кода (для небольшой задержки)
- TOTP можно отключить только после подтверждения

## Миграция с email OTP на TOTP

1. Войдите в админку через email OTP
2. Настройте TOTP через `/admin/setup-totp/`
3. При следующем входе будет использоваться TOTP
4. Email OTP останется доступным как резервный метод (если TOTP отключен)

## Поддержка

При возникновении проблем:
1. Проверьте логи Gunicorn: `sudo journalctl -u gunicorn -n 50`
2. Проверьте логи Django: `/tmp/django-error.log`
3. Убедитесь, что миграции применены
4. Проверьте, что все файлы загружены на сервер

