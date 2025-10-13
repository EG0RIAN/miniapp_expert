# 🔧 Настройка CORS для прямой отправки

## Что изменилось

**Убрали бота!** Теперь данные отправляются напрямую из Mini App на ваш API.

```
БЫЛО: Mini App → sendData() → Бот → API → CRM
СТАЛО: Mini App → fetch() → API → CRM
```

## Преимущества

- ✅ Проще (нет бота-прослойки)
- ✅ Быстрее (прямой запрос)
- ✅ Надёжнее (меньше точек отказа)
- ✅ Страница "Успех" работает
- ✅ `first_name` и `last_name` всё равно из Telegram

---

## ⚠️ Нужно настроить CORS

Чтобы браузер разрешил запросы с вашего ngrok домена к API.

### Шаг 1: Установите django-cors-headers

```bash
pip install django-cors-headers
```

### Шаг 2: Добавьте в settings.py

```python
# settings.py

INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Должен быть первым!
    'django.middleware.common.CommonMiddleware',
    ...
]

# Разрешаем запросы с ngrok
CORS_ALLOWED_ORIGINS = [
    'https://4afc8c95c055.ngrok-free.app',
    'http://localhost:3000',
]

# Или разрешаем все ngrok домены (удобнее):
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.ngrok-free\.app$',
    r'^https://.*\.ngrok\.app$',
    r'^https://.*\.ngrok\.io$',
]

# Разрешаем нужные заголовки
CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
]

# Разрешаем credentials (если нужно)
CORS_ALLOW_CREDENTIALS = True
```

### Шаг 3: Перезапустите Django

```bash
python manage.py runserver
```

---

## 🧪 Тестирование

### 1. Откройте Mini App

Можно открывать **в любом браузере** или через Telegram:
- `http://localhost:3000`
- `https://4afc8c95c055.ngrok-free.app`
- Через кнопку ☰ в Telegram боте

### 2. Откройте консоль (F12)

### 3. Заполните и отправьте форму

Телефон: `+79991234567`

### 4. Что должно быть в консоли:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 ОТПРАВКА ЗАЯВКИ НАПРЯМУЮ НА API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Данные для отправки: {...}
🔧 API URL: https://arkhiptsev.com/api/leads/create/
🔧 Token exists: true

📡 Отправка на API...
📡 Response status: 201
✅ Успешный ответ от API: {success: true, lead_id: 15, ...}
✅ Заявка создана! ID: 15
```

### 5. Появится страница "Успех" ✅

### 6. Проверьте админку

https://arkhiptsev.com/ru/admin/leads/lead/

Заявка #15 с вашим именем из Telegram!

---

## ❌ Если ошибка CORS

### Ошибка в консоли:

```
Access to fetch at 'https://arkhiptsev.com/api/leads/create/' 
from origin 'https://4afc8c95c055.ngrok-free.app' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

### Решение:

1. Проверьте что `corsheaders` установлен:
   ```bash
   pip list | grep cors
   ```

2. Проверьте `settings.py`:
   - `corsheaders` в `INSTALLED_APPS`
   - `CorsMiddleware` **первым** в `MIDDLEWARE`
   - Настроен `CORS_ALLOWED_ORIGINS` или `CORS_ALLOWED_ORIGIN_REGEXES`

3. Перезапустите Django

4. Попробуйте ещё раз

---

## 💡 Для production

### Вариант 1: Статический домен

Купите ngrok Pro или используйте свой домен:

```python
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
]
```

### Вариант 2: Разрешить все (только для разработки!)

```python
CORS_ALLOW_ALL_ORIGINS = True  # Только для разработки!
```

---

## 📊 Что отправляется

```json
{
  "first_name": "Евгений",        // из Telegram профиля
  "last_name": "Архипцев",        // из Telegram профиля
  "phone": "+79991234567",        // из формы
  "telegram": "@username",        // из Telegram
  "client_language": "ru",        // из Telegram
  "description": "Заявка из Telegram Mini App. Platform: tdesktop, User ID: 123456789",
  "comment": "{...метаданные...}"
}
```

---

## ✅ Контрольный список

Перед тестированием:

- [ ] `django-cors-headers` установлен
- [ ] `corsheaders` добавлен в `INSTALLED_APPS`
- [ ] `CorsMiddleware` добавлен в `MIDDLEWARE` (первым!)
- [ ] `CORS_ALLOWED_ORIGINS` или `CORS_ALLOWED_ORIGIN_REGEXES` настроен
- [ ] Django перезапущен
- [ ] Frontend работает
- [ ] Консоль (F12) открыта

Теперь отправьте форму! 🚀

---

## 🔧 Отладка

### Проверить что CORS работает:

```bash
curl -I -X OPTIONS https://arkhiptsev.com/api/leads/create/ \
  -H "Origin: https://4afc8c95c055.ngrok-free.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Должен вернуть:
```
Access-Control-Allow-Origin: https://4afc8c95c055.ngrok-free.app
Access-Control-Allow-Headers: authorization, content-type
```

---

## 📚 Документация

- Django CORS Headers: https://github.com/adamchainz/django-cors-headers
- CORS на MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
