#!/bin/bash

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 СТАТУС RELLO MINI APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверка Frontend
if pgrep -f "npm run dev" > /dev/null; then
    echo "✅ Frontend (Vite): РАБОТАЕТ"
    PORT=$(lsof -i -P -n | grep LISTEN | grep node | awk '{print $9}' | cut -d: -f2 | head -1)
    echo "   http://localhost:${PORT:-3000}"
else
    echo "❌ Frontend (Vite): НЕ РАБОТАЕТ"
    echo "   Запустите: npm run dev -- --host 0.0.0.0"
fi

echo ""

# Проверка Ngrok
if pgrep -f "ngrok" > /dev/null; then
    echo "✅ Ngrok: РАБОТАЕТ"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        echo "   $NGROK_URL"
    fi
else
    echo "❌ Ngrok: НЕ РАБОТАЕТ"
    echo "   Запустите: ngrok http 3000"
fi

echo ""

# Проверка Bot
if pgrep -f "bot.py" > /dev/null; then
    echo "✅ Telegram Bot: РАБОТАЕТ"
else
    echo "❌ Telegram Bot: НЕ РАБОТАЕТ"
    echo "   Запустите: cd bot && ./start.sh"
    
    # Проверка наличия токена
    if [ -f "bot/.env" ]; then
        if grep -q "YOUR_BOT_TOKEN_HERE" bot/.env; then
            echo "   ⚠️ Нужно добавить BOT_TOKEN в bot/.env"
        fi
    else
        echo "   ⚠️ Файл bot/.env не найден"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Итоговый вывод
FRONTEND_OK=$(pgrep -f "npm run dev" > /dev/null && echo "1" || echo "0")
NGROK_OK=$(pgrep -f "ngrok" > /dev/null && echo "1" || echo "0")
BOT_OK=$(pgrep -f "bot.py" > /dev/null && echo "1" || echo "0")

if [ "$FRONTEND_OK" = "1" ] && [ "$NGROK_OK" = "1" ] && [ "$BOT_OK" = "1" ]; then
    echo "🎊 Всё работает! Можно тестировать в Telegram"
elif [ "$FRONTEND_OK" = "1" ] && [ "$NGROK_OK" = "1" ]; then
    echo "⚠️ Frontend и Ngrok работают, но нужно запустить бота"
    echo "   Без бота форма не будет работать"
else
    echo "⚠️ Нужно запустить недостающие компоненты"
fi

echo ""
