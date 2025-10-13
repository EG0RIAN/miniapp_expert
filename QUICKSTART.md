# 🚀 Быстрый старт Rello

## Что уже работает ✅

- ✅ Frontend (React + Vite)
- ✅ Ngrok туннель
- ✅ Многоязычность (ru/en)
- ✅ Светлая/темная тема
- ✅ 6 страниц с навигацией

## Что нужно настроить ⚙️

- ⚠️ Telegram Bot (для отправки данных в CRM)

---

## 1. Настройка бота (5 минут)

### Шаг 1: Получите токен

1. Откройте @BotFather в Telegram
2. Команда: `/mybots`
3. Выберите бота (или `/newbot` для создания)
4. **API Token** → скопируйте

### Шаг 2: Сохраните токен

```bash
nano bot/.env
```

Замените `YOUR_BOT_TOKEN_HERE` на ваш токен:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Запустите бота

```bash
cd bot
./start.sh
```

Должны увидеть:
```
INFO - Бот запущен и готов к работе!
```

---

## 2. Проверка работы

### Шаг 1: Настройте Mini App в @BotFather

1. @BotFather → `/mybots`
2. Выберите бота → **Menu Button** → **Edit Menu Button URL**
3. Вставьте: `https://reliably-full-krill.ngrok-free.app`

### Шаг 2: Откройте Mini App

1. Откройте чат с ботом
2. Нажмите на кнопку меню (☰)
3. Mini App откроется

### Шаг 3: Отправьте тестовую заявку

1. Пройдите: Главная → Кейсы → Преимущества → Форма
2. Заполните:
   - Никнейм: автозаполнен
   - Телефон: +79991234567
3. Нажмите **Отправить**
4. Mini App закроется ← это нормально!

### Шаг 4: Проверьте результат

**В чате с ботом появится:**
```
✅ Заявка #12 успешно создана!
Мы свяжемся с вами в течение часа.
```

**В админке:**
https://arkhiptsev.com/ru/admin/leads/lead/

---

## 3. Схема работы

```
[Пользователь заполняет форму]
         ↓
   Нажимает "Отправить"
         ↓
   WebApp.sendData(JSON)
         ↓
[Mini App закрывается]
         ↓
Telegram → Bot (web_app_data)
         ↓
   Bot → API (POST)
         ↓
   API → База данных
         ↓
   Bot → Пользователь ✅
```

---

## 4. Команды

### Запустить всё:

```bash
# Frontend (уже запущен)
npm run dev -- --host 0.0.0.0

# Ngrok (уже запущен)
ngrok http 5173 --domain=reliably-full-krill.ngrok-free.app

# Bot (нужно настроить)
cd bot && ./start.sh
```

### Остановить:

```bash
# Остановить всё
pkill -f "npm run dev"
pkill -f "ngrok"
pkill -f "bot.py"
```

---

## 5. Решение проблем

### Бот не запускается

```bash
# Проверьте токен
cat bot/.env | grep BOT_TOKEN

# Убедитесь что зависимости установлены
cd bot
pip install -r requirements.txt
```

### Данные не приходят

1. ✓ Бот запущен? → `ps aux | grep bot.py`
2. ✓ Токен правильный? → `cat bot/.env`
3. ✓ URL обновлен в @BotFather?
4. ✓ Смотрите логи бота

### Mini App не открывается

1. ✓ Frontend работает? → http://localhost:5173
2. ✓ Ngrok работает? → https://reliably-full-krill.ngrok-free.app
3. ✓ URL правильный в @BotFather?

---

## 6. Документация

- **BOT_SETUP.md** - детальная инструкция по боту
- **bot/README.md** - документация Python бота
- **API_SETUP.md** - настройка API
- **TELEGRAM_SETUP.md** - настройка Telegram

---

## 🎊 Готово!

После настройки бота всё будет работать полностью!

**Вопросы?** Смотрите BOT_SETUP.md
