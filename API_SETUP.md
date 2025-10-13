# 🔧 Настройка API для отправки заявок

## 📋 Требования

Ваш API должен быть запущен на: `http://127.0.0.1:8000`

## 🔑 Шаг 1: Получите Bearer токен

1. Откройте админ-панель: http://127.0.0.1:8000/ru/admin/leads/apitoken/
2. Нажмите **"Добавить API токен"**
3. Выберите проект
4. Укажите название: "Rello Telegram Mini App"
5. Сохраните
6. **Скопируйте сгенерированный токен** (64 символа)

## 📝 Шаг 2: Настройте .env файл

1. Откройте файл `.env` в корне проекта
2. Замените `your_bearer_token_here` на ваш токен:

```env
# API Configuration
VITE_API_URL=http://127.0.0.1:8000/api/leads/create/
VITE_API_TOKEN=ваш_настоящий_токен_здесь_64_символа
```

**Пример:**
```env
VITE_API_URL=http://127.0.0.1:8000/api/leads/create/
VITE_API_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## 🔄 Шаг 3: Перезапустите сервер

После изменения .env файла обязательно перезапустите Vite:

```bash
# Остановите текущий процесс
pkill -f vite

# Запустите заново
npm run dev -- --host 0.0.0.0
```

## 📡 Что отправляется на API

### Формат данных:

```json
{
  "first_name": "Имя пользователя из Telegram",
  "last_name": "Фамилия из Telegram",
  "phone": "+7 999 123 45 67",
  "telegram": "@username или nickname из формы",
  "client_language": "ru",
  "description": "Заявка из Telegram Mini App. Platform: tdesktop, User ID: 123456789",
  "comment": "{\"telegram_user_id\":123456789,\"username\":\"user\",\"is_premium\":false,...}"
}
```

### Поля:

- **first_name** - имя из Telegram
- **last_name** - фамилия из Telegram
- **phone** - номер из формы (обязательно)
- **telegram** - никнейм из формы или username из Telegram
- **client_language** - язык пользователя (ru/en)
- **description** - описание заявки с метаданными
- **comment** - JSON с дополнительными данными

## ✅ Проверка работоспособности

### 1. Проверьте что API запущен:

```bash
curl http://127.0.0.1:8000/api/leads/info/
```

Должен вернуть информацию об API.

### 2. Проверьте токен:

```bash
curl -X POST http://127.0.0.1:8000/api/leads/create/ \
  -H "Authorization: Bearer ваш_токен" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567", "first_name": "Test"}'
```

Должен вернуть:
```json
{
  "success": true,
  "lead_id": 123,
  "message": "Заявка успешно создана"
}
```

### 3. Откройте приложение в Telegram:

1. Перейдите к форме
2. Заполните поля
3. Отправьте
4. Проверьте админку: http://127.0.0.1:8000/ru/admin/leads/lead/
5. Новая заявка должна появиться

## 🔍 Логирование

В консоли браузера (F12) будут логи:

```
📤 Отправка заявки на API: {...}
🔧 API URL: http://127.0.0.1:8000/api/leads/create/
🔧 Token exists: true
📡 Response status: 201
✅ Успешный ответ от API: {...}
```

## ⚠️ Возможные ошибки

### "API URL или токен не настроены"
- Проверьте .env файл
- Убедитесь что токен без пробелов
- Перезапустите сервер

### "HTTP 401 Unauthorized"
- Токен отсутствует или неверный формат
- Проверьте что токен начинается с Bearer

### "HTTP 403 Forbidden"
- Токен неверный или неактивный
- Создайте новый токен в админке

### "HTTP 400 Bad Request"
- Некорректный JSON
- Проверьте формат данных

## 🌐 Production настройка

Для production измените URL в .env:

```env
VITE_API_URL=https://your-domain.com/api/leads/create/
VITE_API_TOKEN=production_token_here
```

## 📚 Дополнительная информация

- API Documentation: http://127.0.0.1:8000/api/leads/info/
- Admin Panel: http://127.0.0.1:8000/ru/admin/
- Tokens Management: http://127.0.0.1:8000/ru/admin/leads/apitoken/
