# 🤖 Настройка Telegram Bot Proxy

## Зачем нужен бот-прокси?

Telegram Mini App не может напрямую делать запросы к вашему API из-за CORS.
Бот-прокси решает эту проблему:

```
Mini App → sendData() → Bot → API → CRM
```

## 🚀 Быстрый старт

### Шаг 1: Получите токен бота

1. Откройте @BotFather в Telegram
2. Используйте существующего бота или создайте нового:
   - `/mybots` - выбрать существующего
   - `/newbot` - создать нового
3. Скопируйте API Token

### Шаг 2: Настройте бота

```bash
cd bot
cp .env.example .env
nano .env  # или используйте любой редактор
```

Вставьте ваш BOT_TOKEN:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
API_URL=https://arkhiptsev.com/api/leads/create/
API_TOKEN=O2EZjvewEsiLytylbDT7ioDiJLheh2cZJDWuqQvtYmtW1BZetj7ylKimJBQUTTqM
```

### Шаг 3: Запустите бота

```bash
cd bot
./start.sh
```

Или вручную:
```bash
cd bot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

### Шаг 4: Проверьте работу

1. Бот должен вывести:
   ```
   INFO - Бот запущен и готов к работе!
   ```

2. Откройте Mini App в Telegram

3. Заполните и отправьте форму

4. В логах бота должно появиться:
   ```
   INFO - Получены данные из Web App: {...}
   INFO - Отправка на API: https://arkhiptsev.com/...
   INFO - Ответ API: 201 - {"success": true, "lead_id": 12}
   ```

5. Проверьте админку: https://arkhiptsev.com/ru/admin/leads/lead/

## 📡 Как это работает

### Процесс отправки:

1. **Пользователь заполняет форму** в Mini App
2. **Нажимает "Отправить"**
3. **Frontend вызывает** `WebApp.sendData(JSON.stringify(data))`
4. **Telegram закрывает Mini App** и отправляет данные боту
5. **Бот получает данные** через `web_app_data` handler
6. **Бот делает POST запрос** на ваш API
7. **API создает заявку** (Lead ID: X)
8. **Бот отправляет подтверждение** пользователю

### Формат данных:

```json
{
  "first_name": "Имя",
  "last_name": "Фамилия",
  "phone": "+7 999 123 45 67",
  "telegram": "@username",
  "client_language": "ru",
  "description": "Заявка из Telegram Mini App. Platform: tdesktop, User ID: 123456789",
  "comment": "{\"telegram_user_id\":123456789,\"username\":\"user\",...}"
}
```

## ⚙️ Production настройка

### Для постоянной работы используйте systemd:

Создайте `/etc/systemd/system/rello-bot.service`:

```ini
[Unit]
Description=Rello Telegram Bot Proxy
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/rello/bot
Environment="PATH=/path/to/rello/bot/venv/bin"
EnvironmentFile=/path/to/rello/bot/.env
ExecStart=/path/to/rello/bot/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable rello-bot
sudo systemctl start rello-bot
sudo systemctl status rello-bot
```

## 🐛 Решение проблем

### Бот не запускается:
```bash
# Проверьте токен
cat bot/.env | grep BOT_TOKEN

# Проверьте зависимости
cd bot
pip install -r requirements.txt

# Запустите с логами
python bot.py
```

### Данные не приходят:

1. Проверьте что бот запущен
2. Посмотрите логи бота
3. Убедитесь что Mini App вызывает sendData
4. Проверьте консоль браузера (F12)

### API возвращает ошибку:

1. Проверьте API_TOKEN в bot/.env
2. Проверьте что API доступен:
   ```bash
   curl https://arkhiptsev.com/api/leads/info/
   ```

## 📚 Файлы

- `bot/bot.py` - код бота
- `bot/requirements.txt` - зависимости Python
- `bot/.env` - конфигурация (создайте сами)
- `bot/.env.example` - пример конфигурации
- `bot/start.sh` - скрипт быстрого запуска
- `bot/README.md` - документация

## ⚠️ Важно

- **Бот должен быть запущен постоянно**
- **sendData закрывает Mini App** после отправки (это поведение Telegram)
- **.env не коммитится в git** (добавлен в .gitignore)
- **Логи показывают все запросы** для отладки
