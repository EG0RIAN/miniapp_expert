# Исправление: раздел "Документы" не отображается в админке

## Проблема
Раздел "Документы" не появляется в админке Django, хотя модель Document создана и зарегистрирована.

## Решение

### 1. Проверить, что все файлы на месте

Убедитесь, что существуют следующие файлы:
- `api-django/apps/documents/__init__.py`
- `api-django/apps/documents/models.py`
- `api-django/apps/documents/admin.py`
- `api-django/apps/documents/apps.py`
- `api-django/apps/documents/views.py`
- `api-django/apps/documents/urls.py`

### 2. Выполнить миграции на сервере

Подключитесь к серверу и выполните:

```bash
cd /var/www/miniapp.expert/api-django
source venv/bin/activate  # или активируйте ваше виртуальное окружение
python manage.py makemigrations documents
python manage.py migrate
```

### 3. Создать базовые документы

```bash
python manage.py import_documents
```

### 4. Перезапустить Gunicorn

```bash
sudo systemctl restart gunicorn
# или
sudo systemctl restart gunicorn-miniapp
```

### 5. Проверить логи

Если раздел все еще не появляется, проверьте логи:

```bash
sudo journalctl -u gunicorn -f
# или
tail -f /var/log/gunicorn/error.log
```

Ищите ошибки связанные с:
- `apps.documents`
- `Document`
- `ImportError`

### 6. Проверить, что приложение добавлено в INSTALLED_APPS

Убедитесь, что в `api-django/miniapp_api/settings.py` есть:

```python
INSTALLED_APPS = [
    # ...
    'apps.documents',
]
```

### 7. Проверить регистрацию в admin.py

Убедитесь, что в `api-django/apps/documents/admin.py` есть:

```python
from miniapp_api.admin import admin_site

@admin_site.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # ...
```

### 8. Проверить импорт в miniapp_api/admin.py

Убедитесь, что в `api-django/miniapp_api/admin.py` в конце файла есть:

```python
# Импортируем все admin.py файлы для регистрации моделей
try:
    import apps.documents.admin  # noqa
except ImportError:
    pass
```

### 9. Очистить кеш Python

На сервере выполните:

```bash
cd /var/www/miniapp.expert/api-django
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null
find . -name "*.pyc" -delete
```

### 10. Перезапустить сервер

После всех изменений обязательно перезапустите Gunicorn:

```bash
sudo systemctl restart gunicorn
```

## Быстрая проверка

После выполнения всех шагов, откройте админку и проверьте:

1. Войдите в админку: `https://miniapp.expert/admin/`
2. Проверьте, что в списке разделов есть **"ДОКУМЕНТЫ"**
3. Откройте раздел и проверьте, что можно создавать/редактировать документы

## Если проблема сохраняется

1. Проверьте, что таблица `documents` существует в БД:
```sql
SELECT * FROM documents;
```

2. Проверьте, что модель зарегистрирована:
```bash
python manage.py shell
>>> from apps.documents.models import Document
>>> from miniapp_api.admin import admin_site
>>> Document in admin_site._registry
```

3. Проверьте логи Django на наличие ошибок импорта

