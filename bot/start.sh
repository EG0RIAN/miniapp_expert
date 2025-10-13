#!/bin/bash

echo "🤖 Запуск Rello Telegram Bot Proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📋 Создайте .env файл на основе .env.example"
    echo ""
    echo "Выполните:"
    echo "  cp .env.example .env"
    echo "  nano .env  # или используйте любой редактор"
    echo ""
    exit 1
fi

# Проверяем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
echo "🔧 Активация виртуального окружения..."
source venv/bin/activate

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
pip install -q -r requirements.txt

# Загружаем переменные окружения
export $(cat .env | xargs)

# Запускаем бота
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Запуск бота..."
echo "📡 API: $API_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python bot.py
