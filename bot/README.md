# 🤖 Rello Telegram Bot Proxy

Telegram бот для приема данных из Mini App и отправки их на API.

## 📋 Установка

### 1. Установите зависимости:

```bash
cd bot
pip install -r requirements.txt
```

Или с виртуальным окружением:

```bash
cd bot
python3 -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Настройте .env файл:

```bash
cp .env.example .env
```

Откройте `.env` и укажите:

```env
BOT_TOKEN=ваш_токен_от_BotFather
API_URL=https://arkhiptsev.com/api/leads/create/
API_TOKEN=O2EZjvewEsiLytylbDT7ioDiJLheh2cZJDWuqQvtYmtW1BZetj7ylKimJBQUTTqM
```

**Где взять BOT_TOKEN:**
1. Откройте @BotFather в Telegram
2. Отправьте `/mybots`
3. Выберите вашего бота
4. API Token → скопируйте токен

### 3. Запустите бота:

```bash
python bot.py
```

Должны увидеть:
```
INFO - Запуск бота...
INFO - Бот запущен и готов к работе!
```

## 🔧 Как это работает

### Схема работы:

```
Mini App (Frontend)
    ↓ (WebApp.sendData)
Telegram Bot (Proxy)
    ↓ (HTTP POST + Bearer)
API (arkhiptsev.com)
    ↓
База данных (CRM)
```

### Процесс:

1. **Пользователь заполняет форму** в Mini App
2. **Нажимает "Отправить"**
3. **Frontend вызывает** `WebApp.sendData(JSON)`
4. **Telegram отправляет данные боту** (webhook)
5. **Бот получает данные** через `web_app_data`
6. **Бот делает POST** на ваш API с Bearer токеном
7. **API создает заявку** в базе данных
8. **Бот отправляет** подтверждение пользователю

### Преимущества:

- ✅ Обходит CORS (бот делает запросы от сервера)
- ✅ Безопасно (токен API только на сервере)
- ✅ Отправка подтверждения пользователю
- ✅ Логирование всех запросов
- ✅ Обработка ошибок

## 📡 Формат данных

### Что получает бот из Mini App:

```json
{
  "first_name": "Иван",
  "last_name": "Петров",
  "phone": "+7 999 123 45 67",
  "telegram": "@username",
  "client_language": "ru",
  "description": "Заявка из Telegram Mini App...",
  "comment": "{...метаданные...}"
}
```

### Что бот отправляет на API:

Те же данные + заголовок:
```
Authorization: Bearer O2EZ...TTqM
```

## 🧪 Тестирование

### 1. Проверьте что бот запущен:

```bash
python bot.py
```

### 2. В другом терминале проверьте Mini App:

Отправьте форму из Telegram Mini App

### 3. Смотрите логи бота:

```
INFO - Получены данные из Web App: {...}
INFO - Отправка на API: https://arkhiptsev.com/...
INFO - Ответ API: 201 - {"success": true, "lead_id": 12, ...}
```

### 4. Проверьте админку:

https://arkhiptsev.com/ru/admin/leads/lead/

## ⚠️ Важно

- Бот должен быть **постоянно запущен**
- Для production используйте **systemd** или **supervisor**
- Храните `.env` в безопасности
- Не коммитьте `.env` в git

## 🐛 Решение проблем

### Бот не запускается:
- Проверьте BOT_TOKEN в .env
- Проверьте что установлены все зависимости

### Данные не приходят:
- Проверьте что бот запущен
- Проверьте логи бота
- Убедитесь что Mini App использует sendData

### API возвращает ошибку:
- Проверьте API_TOKEN
- Проверьте формат данных
- Посмотрите логи API

## 📚 Дополнительно

- Логи сохраняются в stdout
- Для production настройте логи в файл
- Можно добавить уведомления в админский чат

