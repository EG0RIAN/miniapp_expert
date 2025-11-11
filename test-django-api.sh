#!/bin/bash
# Скрипт для проверки работы Django API

echo "🔍 Проверка Django API..."

SERVER="85.198.110.66"
USER="root"

echo ""
echo "1. Проверка, что API запущен..."
ssh $USER@$SERVER << 'ENDSSH'
echo "Проверка контейнера..."
docker ps | grep miniapp_api || echo "❌ Контейнер не запущен"

echo ""
echo "2. Проверка логов API..."
docker logs miniapp_api --tail 20

echo ""
echo "3. Проверка доступности API локально..."
curl -s http://127.0.0.1:8000/api/auth/health/ || echo "❌ API недоступен на порту 8000"

echo ""
echo "4. Проверка через Nginx..."
curl -s -I https://miniapp.expert/api/auth/health/ | head -5

echo ""
echo "5. Проверка Django Admin..."
curl -s -I https://miniapp.expert/admin/ | head -5
ENDSSH

echo ""
echo "✅ Проверка завершена"

