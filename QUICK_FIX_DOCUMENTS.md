# Быстрое исправление: Раздел "Документы" не отображается в админке

## Проблема
Раздел "Документы" не появляется в админке Django.

## Причины
1. Миграции не выполнены (таблица `documents` не существует в БД)
2. Файлы приложения `documents` не загружены на сервер
3. Gunicorn не перезапущен после изменений

## Решение на сервере

### Шаг 1: Подключитесь к серверу
```bash
ssh root@85.198.110.66
```

### Шаг 2: Перейдите в директорию проекта
```bash
cd /var/www/miniapp.expert/api-django
```

### Шаг 3: Активируйте виртуальное окружение
```bash
source venv/bin/activate
```

### Шаг 4: Проверьте, что приложение documents существует
```bash
ls -la apps/documents/
```

Должны быть файлы:
- `__init__.py`
- `models.py`
- `admin.py`
- `apps.py`
- `views.py`
- `urls.py`

### Шаг 5: Проверьте, что приложение в INSTALLED_APPS
```bash
grep "apps.documents" miniapp_api/settings.py
```

Должна быть строка: `'apps.documents',`

### Шаг 6: Создайте миграции
```bash
python manage.py makemigrations documents
```

### Шаг 7: Примените миграции
```bash
python manage.py migrate
```

### Шаг 8: Создайте базовые документы
```bash
python manage.py import_documents
```

### Шаг 9: Проверьте, что модель зарегистрирована
```bash
python manage.py shell
```

В shell выполните:
```python
from miniapp_api.admin import admin_site
from apps.documents.models import Document
print(Document in admin_site._registry)
# Должно вывести: True
exit()
```

### Шаг 10: Очистите кеш Python
```bash
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null
find . -name "*.pyc" -delete
```

### Шаг 11: Перезапустите Gunicorn
```bash
sudo systemctl restart gunicorn
# или
sudo systemctl restart gunicorn-miniapp
```

### Шаг 12: Проверьте логи
```bash
sudo journalctl -u gunicorn -n 50 --no-pager
```

Ищите ошибки связанные с `documents` или `Document`.

## Альтернативное решение: Проверка через Django shell

Если раздел все еще не появляется, проверьте регистрацию вручную:

```bash
python manage.py shell
```

```python
# Проверяем, что модель существует
from apps.documents.models import Document
print("Model exists:", Document)

# Проверяем, что admin_site существует
from miniapp_api.admin import admin_site
print("Admin site exists:", admin_site)

# Проверяем регистрацию
print("Document registered:", Document in admin_site._registry)

# Если не зарегистрирован, регистрируем вручную
if Document not in admin_site._registry:
    from apps.documents.admin import DocumentAdmin
    admin_site.register(Document, DocumentAdmin)
    print("Document registered manually")

# Проверяем зарегистрированные модели
print("Registered models:", list(admin_site._registry.keys()))
```

## Если проблема сохраняется

1. Проверьте логи Gunicorn на наличие ошибок импорта
2. Убедитесь, что все файлы загружены на сервер
3. Проверьте, что таблица `documents` существует в БД:
```sql
\c miniapp
SELECT * FROM documents;
```

4. Перезапустите сервер полностью:
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

