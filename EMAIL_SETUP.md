# Настройка Email (SMTP) для MiniAppExpert

## Текущие настройки

- **SMTP сервер**: smtp.mail.ru
- **Порт**: 587 (STARTTLS) или 465 (SSL)
- **Пользователь**: no-reply@miniapp.expert
- **Пароль**: WjjmVlTb3OmQ3MxEfavh
- **Тестовый режим**: Включен (все письма перенаправляются на e.arkhiptsev@gmail.com)

## Типы отправляемых писем

1. **Подтверждение email** - отправляется при регистрации
2. **Welcome email** - отправляется после успешной оплаты
3. **Восстановление пароля** - отправляется при запросе сброса пароля
4. **Напоминание о подписке** - отправляется за 3 дня до списания подписки

## Тестирование отправки писем

```bash
# Тестирование всех типов писем
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py test_emails --email e.arkhiptsev@gmail.com
```

## Настройка cron для автоматических напоминаний

Добавьте в crontab следующую строку для отправки напоминаний о подписках ежедневно в 10:00:

```bash
# Редактировать crontab
crontab -e

# Добавить строку:
0 10 * * * cd /home/miniapp_expert/api-django && source venv/bin/activate && python manage.py send_subscription_reminders --days-before 3 >> /var/log/subscription_reminders.log 2>&1
```

## Проверка статуса отправки

Логи отправки писем можно посмотреть в:
- Gunicorn logs: `/tmp/django-error.log` и `/tmp/django-access.log`
- Cron logs: `/var/log/subscription_reminders.log` (после настройки cron)

## Отключение тестового режима

Для отключения тестового режима и отправки писем на реальные адреса пользователей:

1. Отредактируйте `/home/miniapp_expert/api-django/miniapp_api/settings.py`
2. Измените `EMAIL_TEST_MODE = False`
3. Или установите переменную окружения: `EMAIL_TEST_MODE=False`
4. Перезапустите Gunicorn: `sudo systemctl restart gunicorn`

## Устранение проблем

### Проблема: Connection timeout

Если возникает ошибка `Connection timed out`:
1. Проверьте, что порт 587 или 465 не заблокирован firewall
2. Попробуйте использовать другой порт (587 вместо 465 или наоборот)
3. Проверьте, что SMTP сервер доступен: `telnet smtp.mail.ru 587`

### Проблема: Authentication failed

Если возникает ошибка аутентификации:
1. Проверьте правильность логина и пароля в settings.py
2. Убедитесь, что для почтового ящика включена двухфакторная аутентификация в Mail.ru
3. Если включена 2FA, создайте пароль приложения в настройках Mail.ru

## Красивые HTML шаблоны

Все письма отправляются с красивыми HTML шаблонами, включающими:
- Градиентный заголовок
- Кнопки действий
- Адаптивный дизайн
- Предупреждения (для важных писем)
- Корректное отображение в различных почтовых клиентах
