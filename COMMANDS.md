# 📋 Шпаргалка команд Rello

## 🚀 Быстрый запуск

```bash
# Проверить статус
./check-status.sh

# Запустить всё одной командой (в разных терминалах)
npm run dev -- --host 0.0.0.0     # Терминал 1
ngrok http 3000                    # Терминал 2
cd bot && ./start.sh              # Терминал 3
```

---

## 🔧 Frontend (React + Vite)

```bash
# Запустить
npm run dev -- --host 0.0.0.0

# Остановить
pkill -f "npm run dev"

# Пересобрать
npm run build

# Установить зависимости
npm install
```

---

## 🌐 Ngrok (Туннель)

```bash
# Запустить на порт 3000
ngrok http 3000

# Запустить в фоне
ngrok http 3000 --log stdout 2>&1 &

# Остановить
pkill -f "ngrok"

# Получить URL
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"'
```

---

## 🤖 Telegram Bot

```bash
# Первый запуск (создаст venv)
cd bot
./start.sh

# Ручной запуск
cd bot
source venv/bin/activate
python bot.py

# Остановить
pkill -f "bot.py"

# Логи (если запущен)
ps aux | grep bot.py
```

---

## 📝 Настройка Bot Token

```bash
# Создать .env из примера
cd bot
cp .env.example .env

# Отредактировать
nano .env

# Проверить
cat .env | grep BOT_TOKEN
```

---

## 📊 Проверка статуса

```bash
# Скрипт проверки
./check-status.sh

# Вручную проверить процессы
ps aux | grep "npm run dev"
ps aux | grep "ngrok"
ps aux | grep "bot.py"

# Проверить порты
lsof -i :3000  # Frontend
lsof -i :4040  # Ngrok dashboard
```

---

## 🧪 Тестирование

```bash
# Открыть Frontend локально
open http://localhost:3000

# Получить Ngrok URL
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4

# Тестовый запрос к API (для проверки бота)
curl -X POST https://arkhiptsev.com/api/leads/create/ \
  -H "Authorization: Bearer O2EZjvewEsiLytylbDT7ioDiJLheh2cZJDWuqQvtYmtW1BZetj7ylKimJBQUTTqM" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","phone":"+79991234567"}'
```

---

## 🛑 Остановить всё

```bash
# Остановить все процессы
pkill -f "npm run dev"
pkill -f "ngrok"
pkill -f "bot.py"

# Или скрипт
cat > stop-all.sh << 'STOP'
#!/bin/bash
pkill -f "npm run dev"
pkill -f "ngrok"
pkill -f "bot.py"
echo "✅ Всё остановлено"
STOP
chmod +x stop-all.sh
./stop-all.sh
```

---

## 🔄 Перезапуск

```bash
# Перезапустить Frontend
pkill -f "npm run dev"
npm run dev -- --host 0.0.0.0

# Перезапустить Ngrok
pkill -f "ngrok"
ngrok http 3000

# Перезапустить Bot
pkill -f "bot.py"
cd bot && ./start.sh
```

---

## 📁 Структура проекта

```
rello/
├── src/              # Frontend исходники
├── bot/              # Python бот
│   ├── bot.py       # Главный файл
│   ├── .env         # Конфигурация
│   └── venv/        # Виртуальное окружение
├── public/           # Статика (картинки)
├── .env             # Frontend конфиг
└── *.md             # Документация
```

---

## 🐛 Решение проблем

### Frontend не запускается

```bash
# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install
npm run dev -- --host 0.0.0.0
```

### Ngrok не работает

```bash
# Проверить аутентификацию
ngrok config check

# Переустановить
brew reinstall ngrok
```

### Бот не запускается

```bash
# Проверить Python
python3 --version

# Переустановить зависимости
cd bot
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

---

## 📚 Документация

- `QUICKSTART.md` - Быстрый старт
- `BOT_SETUP.md` - Настройка бота
- `API_SETUP.md` - Настройка API
- `check-status.sh` - Проверка статуса
- `COMMANDS.md` - Эта шпаргалка

---

## 💡 Полезные алиасы

Добавьте в `~/.zshrc` или `~/.bashrc`:

```bash
alias rello-start='cd ~/dev/rello && npm run dev -- --host 0.0.0.0'
alias rello-ngrok='ngrok http 3000'
alias rello-bot='cd ~/dev/rello/bot && ./start.sh'
alias rello-status='cd ~/dev/rello && ./check-status.sh'
alias rello-stop='pkill -f "npm run dev"; pkill -f "ngrok"; pkill -f "bot.py"'
```

После добавления:
```bash
source ~/.zshrc  # или ~/.bashrc
```

Теперь можно использовать:
```bash
rello-start   # Запустить Frontend
rello-ngrok   # Запустить Ngrok
rello-bot     # Запустить Bot
rello-status  # Проверить статус
rello-stop    # Остановить всё
```
