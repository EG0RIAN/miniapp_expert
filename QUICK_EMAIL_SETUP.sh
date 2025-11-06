#!/bin/bash

# 📧 Быстрая настройка Email (Mail.ru SMTP)
# Выполните этот скрипт на сервере

echo "🚀 Настройка Email для MiniAppExpert..."
echo ""

# Проверяем, что мы на сервере
if [ ! -d "/home/miniapp_expert" ]; then
    echo "❌ Ошибка: директория /home/miniapp_expert не найдена"
    echo "Выполните этот скрипт на сервере!"
    exit 1
fi

cd /home/miniapp_expert

echo "📝 Добавляю SMTP настройки в .env..."

# Проверяем, есть ли уже настройки SMTP
if grep -q "SMTP_HOST" .env; then
    echo "⚠️  SMTP настройки уже существуют в .env"
    echo "Хотите перезаписать? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Пропускаю добавление SMTP настроек"
    else
        # Удаляем старые настройки
        sed -i '/SMTP_HOST/d' .env
        sed -i '/SMTP_PORT/d' .env
        sed -i '/SMTP_USER/d' .env
        sed -i '/SMTP_PASS/d' .env
        sed -i '/MAIL_FROM/d' .env
    fi
fi

# Добавляем новые настройки
cat >> .env << 'EOF'

# Mail.ru SMTP Configuration
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=no-reply@miniapp.expert
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>
APP_BASE_URL=https://miniapp.expert
EOF

echo ""
echo "⚠️  ВАЖНО: Замените YOUR_SMTP_PASSWORD_HERE на реальный пароль!"
echo "Откройте .env и добавьте пароль вручную:"
echo "nano /home/miniapp_expert/.env"

echo "✅ SMTP настройки добавлены"
echo ""

echo "🗄️  Обновляю структуру БД..."

# Подключаемся к БД и добавляем поля
docker exec -i miniapp_expert-postgres-1 psql -U postgres -d miniapp_expert << 'EOSQL'
-- Добавляем поля для email авторизации
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Проверяем
\d users
EOSQL

echo "✅ БД обновлена"
echo ""

echo "🔄 Перезапускаю API..."
docker compose restart api

echo ""
echo "⏳ Ждём запуска API (10 секунд)..."
sleep 10

echo ""
echo "🧪 Проверяю работу..."

# Проверяем логи
echo "Логи API:"
docker compose logs api | tail -20

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Настройка завершена!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📧 Доступные эндпоинты:"
echo "  • POST /api/auth/register - регистрация"
echo "  • GET  /api/auth/verify - подтверждение email"
echo "  • POST /api/auth/password/request-reset - запрос сброса пароля"
echo "  • POST /api/auth/password/reset - сброс пароля"
echo ""
echo "🧪 Тест регистрации:"
echo 'curl -X POST https://miniapp.expert/api/auth/register \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"email":"test@example.com","name":"Test User","password":"Test123456"}'"'"
echo ""
echo "📚 Полная документация: EMAIL_SETUP.md"
echo ""

