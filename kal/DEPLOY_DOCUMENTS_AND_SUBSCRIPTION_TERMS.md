# Развертывание: Управление документами и условия подписки для продуктов

## Изменения

1. **Добавлено поле `subscription_terms` в модель Product**
   - Позволяет назначить условия подписки для каждого продукта
   - Связь с Document моделью (только документы типа 'subscription_terms')

2. **Создан публичный API для документов**
   - `GET /api/documents/` - получить все документы
   - `GET /api/documents/<document_type>/` - получить документ по типу

3. **Обновлен API продуктов**
   - Теперь возвращает `subscription_terms` в ответе
   - PreOrder API также возвращает условия подписки продукта

4. **Обновлен фронтенд**
   - `payment.html` загружает условия подписки из API
   - Ссылки на документы обновляются динамически

## Миграция базы данных

```bash
cd /home/miniapp_expert/api-django
source venv/bin/activate

# Сначала убедиться, что миграции documents созданы
python manage.py makemigrations documents

# Затем создать миграцию для products
python manage.py makemigrations products

# Применить миграции
python manage.py migrate
```

**Примечание:** Если миграция `0002_add_subscription_terms_to_product.py` уже существует, но ссылается на несуществующую миграцию documents, нужно сначала создать миграцию documents через `makemigrations documents`, а затем применить все миграции.

## Настройка в админке

1. **Создать документы типа "Условия подписки"**
   - Зайти в админку: `/admin/documents/document/`
   - Создать документ с типом `subscription_terms`
   - Заполнить контент (HTML)

2. **Назначить условия подписки продуктам**
   - Зайти в админку: `/admin/products/product/`
   - Для каждого продукта-подписки выбрать `subscription_terms`
   - Сохранить

3. **Убедиться, что документы опубликованы**
   - Политика конфиденциальности (`privacy`)
   - Условия партнерской программы (`affiliate_terms`)
   - Условия использования ЛК (`cabinet_terms`)
   - Условия подписки (`subscription_terms`)

## Тестирование

1. **Проверить API документов:**
   ```bash
   curl https://miniapp.expert/api/documents/privacy/
   curl https://miniapp.expert/api/documents/affiliate_terms/
   curl https://miniapp.expert/api/documents/cabinet_terms/
   ```

2. **Проверить API продукта:**
   ```bash
   curl https://miniapp.expert/api/order/pre-order/<pre_order_id>/
   # Должен вернуть product.subscription_terms, если назначены
   ```

3. **Проверить страницу оплаты:**
   - Открыть `/payment.html?pre_order_id=<uuid>`
   - Для подписки должна отображаться ссылка на условия подписки
   - Ссылка должна вести на правильный документ

## Файлы для развертывания

1. `api-django/apps/products/models.py` - добавлено поле subscription_terms
2. `api-django/apps/products/admin.py` - обновлена админка
3. `api-django/apps/products/serializers.py` - добавлен subscription_terms в сериализатор
4. `api-django/apps/products/migrations/0002_add_subscription_terms_to_product.py` - миграция
5. `api-django/apps/documents/public_views.py` - новый файл, публичный API
6. `api-django/apps/documents/urls.py` - добавлены API endpoints
7. `api-django/apps/orders/views.py` - обновлен для возврата subscription_terms
8. `site/payment.html` - обновлен для загрузки условий подписки из API

## Примечания

- Если для продукта не назначены условия подписки, используется общий документ `/subscription-terms.html`
- Документы загружаются из админки через API, но также доступны через статические URL
- Все документы должны быть опубликованы (`is_published=True`) и активны (`is_active=True`)

