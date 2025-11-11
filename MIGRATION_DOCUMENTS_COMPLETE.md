# ✅ Миграция документов завершена

## Что было сделано

### 1. Создана management команда `migrate_html_documents`
- Команда извлекает контент из HTML файлов (`privacy.html`, `affiliate-terms.html`, `cabinet-terms.html`, `subscription-terms.html`)
- Автоматически удаляет заголовки, даты обновления, навигационные ссылки
- Сохраняет документы в базу данных через модель `Document`

### 2. Исправлена модель `Document`
- Улучшен метод `save()` для автоматической генерации уникальных slug
- Добавлена проверка уникальности slug с автоматическим добавлением суффикса при конфликтах
- Fallback на `document_type` если `slugify(title)` возвращает пустую строку

### 3. Мигрированы все документы
- ✅ **Политика конфиденциальности** (`privacy`) - обновлена
- ✅ **Условия партнерской программы** (`affiliate_terms`) - создана
- ✅ **Условия использования личного кабинета** (`cabinet_terms`) - создана
- ✅ **Условия подписки** (`subscription_terms`) - создана

## Результаты

### Документы в базе данных
Все документы теперь находятся в базе данных и доступны через:
- **API**: `/api/documents/<document_type>/`
- **HTML страницы**: `/privacy.html`, `/affiliate-terms.html`, `/cabinet-terms.html`, `/subscription-terms.html`
- **Админка Django**: `/admin/documents/document/`

### API endpoints
```bash
# Получить все документы
GET /api/documents/

# Получить конкретный документ
GET /api/documents/privacy/
GET /api/documents/affiliate_terms/
GET /api/documents/cabinet_terms/
GET /api/documents/subscription_terms/
```

### Статус документов
- Все документы опубликованы (`is_published=True`)
- Все документы активны (`is_active=True`)
- Все документы имеют уникальные slug
- Контент извлечен из HTML файлов

## Следующие шаги

### 1. Редактирование документов в админке
1. Зайти в админку: `https://miniapp.expert/admin/documents/document/`
2. Выбрать документ для редактирования
3. Изменить контент в поле "Содержание (HTML)"
4. Сохранить изменения
5. Документ автоматически обновится на сайте

### 2. Назначение условий подписки продуктам
1. Зайти в админку: `https://miniapp.expert/admin/products/product/`
2. Открыть продукт-подписку
3. В разделе "Условия подписки" выбрать документ с условиями подписки
4. Сохранить

### 3. Создание отдельных условий подписки для каждого продукта (опционально)
Если нужно создать уникальные условия подписки для каждого продукта:
1. Создать новый документ типа `subscription_terms` в админке
2. Назначить его конкретному продукту
3. Если продукт не имеет своих условий, используется общий документ `/subscription-terms.html`

## Использование команды миграции

### Обновление существующих документов
```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py migrate_html_documents --html-dir=/var/www/miniapp.expert --update
```

### Создание новых документов
```bash
python manage.py migrate_html_documents --html-dir=/var/www/miniapp.expert
```

## Проверка

### Проверка API
```bash
# Политика конфиденциальности
curl https://miniapp.expert/api/documents/privacy/

# Условия партнерской программы
curl https://miniapp.expert/api/documents/affiliate_terms/

# Условия использования ЛК
curl https://miniapp.expert/api/documents/cabinet_terms/

# Условия подписки
curl https://miniapp.expert/api/documents/subscription_terms/
```

### Проверка HTML страниц
- `https://miniapp.expert/privacy.html` - должна отображать контент из базы данных
- `https://miniapp.expert/affiliate-terms.html` - должна отображать контент из базы данных
- `https://miniapp.expert/cabinet-terms.html` - должна отображать контент из базы данных
- `https://miniapp.expert/subscription-terms.html` - должна отображать контент из базы данных

## Примечания

- Документы теперь управляются через админку Django
- Изменения в админке автоматически отражаются на сайте
- HTML файлы в `/var/www/miniapp.expert/` остаются для совместимости, но контент загружается из базы данных
- API возвращает контент документов в формате JSON
- HTML страницы рендерятся через Django views и используют шаблон `templates/documents/document.html`

## Файлы

### Backend
- `api-django/apps/documents/models.py` - модель Document с улучшенным методом save()
- `api-django/apps/documents/management/commands/migrate_html_documents.py` - команда миграции
- `api-django/apps/documents/views.py` - views для рендеринга HTML страниц
- `api-django/apps/documents/public_views.py` - API views для документов
- `api-django/apps/documents/urls.py` - URL patterns для HTML страниц
- `api-django/apps/documents/api_urls.py` - URL patterns для API
- `api-django/templates/documents/document.html` - шаблон для отображения документов

### Frontend
- `site/payment.html` - обновлен для загрузки условий подписки из API
- `site/index.html` - содержит ссылки на документы в футере
- Статические HTML файлы (`privacy.html`, `affiliate-terms.html`, `cabinet-terms.html`, `subscription-terms.html`) - теперь рендерятся через Django

