#!/bin/bash

# Скрипт для быстрого деплоя MiniAppExpert
# Использование: ./deploy.sh

SERVER="root@195.2.73.224"
LANDING_DIR="/var/www/miniapp.expert"
APP_DIR="/var/www/demoapp"

echo "╔════════════════════════════════════════════╗"
echo "║  🚀 MiniAppExpert Deploy Script          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'OK'" > /dev/null 2>&1; then
    echo "❌ Не удалось подключиться к серверу!"
    exit 1
fi
echo "✅ Подключение успешно"
echo ""

# Деплой лендинга
echo "🌐 Деплой лендинга (miniapp.expert)..."
if scp -r site/* $SERVER:$LANDING_DIR/ > /dev/null 2>&1; then
    echo "✅ Лендинг обновлен"
else
    echo "❌ Ошибка при деплое лендинга"
    exit 1
fi
echo ""

# Билд приложения
echo "📦 Сборка Mini App..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Сборка завершена"
else
    echo "❌ Ошибка при сборке"
    exit 1
fi
echo ""

# Деплой приложения
echo "📱 Деплой Mini App (demoapp.miniapp.expert)..."
if scp -r dist/* $SERVER:$APP_DIR/ > /dev/null 2>&1; then
    echo "✅ Mini App обновлен"
else
    echo "❌ Ошибка при деплое приложения"
    exit 1
fi
echo ""

# Перезагрузка Nginx
echo "🔄 Перезагрузка Nginx..."
if ssh $SERVER "nginx -t && systemctl reload nginx" > /dev/null 2>&1; then
    echo "✅ Nginx перезагружен"
else
    echo "⚠️  Предупреждение: Не удалось перезагрузить Nginx"
fi
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║  ✅ Деплой завершен успешно!              ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "🌐 Лендинг:      https://miniapp.expert"
echo "🌐 Лендинг (www): https://www.miniapp.expert"
echo "📱 Mini App:     https://demoapp.miniapp.expert"
echo ""
echo "💡 Проверьте работу сайтов в браузере"
echo ""

