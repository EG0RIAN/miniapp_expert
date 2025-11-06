#!/bin/bash

# 🚀 Скрипт исправления нового API
# Запустить на сервере: bash FIX_API_NOW.sh

echo "════════════════════════════════════════════════════════"
echo "🚀 Исправление нового AdonisJS API"
echo "════════════════════════════════════════════════════════"
echo ""

cd /home/miniapp_expert

echo "[1/8] Проверяю статус контейнеров..."
docker compose ps

echo ""
echo "[2/8] Проверяю прямой доступ к API..."
docker exec miniapp_api wget -qO- http://localhost:3333/api/health 2>&1 | head -5

if [ $? -eq 0 ]; then
    echo "✓ API работает внутри контейнера"
else
    echo "✗ API не отвечает, проверяю логи..."
    docker logs miniapp_api --tail 30
    echo ""
    echo "Перезапускаю API..."
    docker compose restart api
    sleep 15
fi

echo ""
echo "[3/8] Создаю backup конфигурации Nginx..."
cp /etc/nginx/sites-enabled/miniapp.expert /etc/nginx/sites-enabled/miniapp.expert.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup: /etc/nginx/sites-enabled/miniapp.expert.backup.*"

echo ""
echo "[4/8] Текущая конфигурация upstream:"
grep -A 5 "upstream miniapp_api" /etc/nginx/sites-enabled/miniapp.expert

echo ""
echo "[5/8] Исправляю upstream..."

# Создаём временный файл с правильной конфигурацией
cat > /tmp/nginx_upstream_fix.conf << 'EOF'
upstream miniapp_api {
    server 127.0.0.1:3333;
    keepalive 32;
}
EOF

# Заменяем upstream в конфигурации
sed -i '/upstream miniapp_api {/,/}/d' /etc/nginx/sites-enabled/miniapp.expert
sed -i '/server {/i\upstream miniapp_api {\n    server 127.0.0.1:3333;\n    keepalive 32;\n}\n' /etc/nginx/sites-enabled/miniapp.expert

echo "✓ Upstream обновлён"

echo ""
echo "[6/8] Новая конфигурация:"
grep -A 5 "upstream miniapp_api" /etc/nginx/sites-enabled/miniapp.expert

echo ""
echo "[7/8] Проверяю и перезагружаю Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✓ Nginx перезагружен"
else
    echo "✗ Ошибка в конфигурации Nginx!"
    echo "Восстанавливаю backup..."
    cp /etc/nginx/sites-enabled/miniapp.expert.backup.* /etc/nginx/sites-enabled/miniapp.expert
    systemctl reload nginx
    exit 1
fi

echo ""
echo "[8/8] Проверяю работу API..."
sleep 3

echo ""
echo "Тест 1: Локальный доступ"
curl -s http://localhost:3333/api/health

echo ""
echo ""
echo "Тест 2: Через Nginx"
curl -s https://miniapp.expert/api/health

echo ""
echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Проверка завершена!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Новые endpoints:"
echo "  • POST https://miniapp.expert/api/auth/register"
echo "  • POST https://miniapp.expert/api/auth/password/request-reset"
echo "  • GET  https://miniapp.expert/api/client/dashboard"
echo "  • GET  https://miniapp.expert/api/admin/customers"
echo ""
echo "Документация:"
echo "  • ADMIN_CLIENT_SETUP.md - полное руководство"
echo "  • EMAIL_SETUP.md - настройка email"
echo ""

