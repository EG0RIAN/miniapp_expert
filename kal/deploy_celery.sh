#!/bin/bash

# Скрипт для установки и настройки Celery на сервере

echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 УСТАНОВКА CELERY ДЛЯ АВТОМАТИЧЕСКОГО СПИСАНИЯ ПОДПИСОК"
echo "═══════════════════════════════════════════════════════════════════"

# 1. Установка Redis
echo ""
echo "1️⃣  Установка Redis..."
sudo apt update
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Проверка Redis
echo "Проверка Redis..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis работает!"
else
    echo "❌ Redis не запустился!"
    exit 1
fi

# 2. Настройка .env
echo ""
echo "2️⃣  Настройка .env..."
cd /home/miniapp_expert/api-django

# Проверяем, есть ли уже настройки Celery
if grep -q "CELERY_BROKER_URL" .env; then
    echo "⚠️  Настройки Celery уже есть в .env"
else
    echo "" >> .env
    echo "# Celery Configuration" >> .env
    echo "CELERY_BROKER_URL=redis://localhost:6379/0" >> .env
    echo "CELERY_RESULT_BACKEND=redis://localhost:6379/0" >> .env
    echo "✅ Настройки Celery добавлены в .env"
fi

# 3. Создание systemd сервиса для Celery Worker
echo ""
echo "3️⃣  Создание Celery Worker сервиса..."
sudo tee /etc/systemd/system/celery-worker.service > /dev/null << 'SERVICE'
[Unit]
Description=Celery Worker for MiniApp Expert
After=network.target redis.service

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/home/miniapp_expert/api-django
Environment="PATH=/home/miniapp_expert/api-django/venv/bin"
ExecStart=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api worker --detach --loglevel=info --logfile=/var/log/celery/worker.log --pidfile=/var/run/celery/worker.pid
ExecStop=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api control shutdown
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

echo "✅ Celery Worker сервис создан"

# 4. Создание systemd сервиса для Celery Beat
echo ""
echo "4️⃣  Создание Celery Beat сервиса..."
sudo tee /etc/systemd/system/celery-beat.service > /dev/null << 'SERVICE'
[Unit]
Description=Celery Beat for MiniApp Expert
After=network.target redis.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/miniapp_expert/api-django
Environment="PATH=/home/miniapp_expert/api-django/venv/bin"
ExecStart=/home/miniapp_expert/api-django/venv/bin/celery -A miniapp_api beat --loglevel=info --logfile=/var/log/celery/beat.log --pidfile=/var/run/celery/beat.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

echo "✅ Celery Beat сервис создан"

# 5. Создание директорий для логов
echo ""
echo "5️⃣  Создание директорий для логов..."
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown root:root /var/log/celery /var/run/celery
echo "✅ Директории созданы"

# 6. Запуск сервисов
echo ""
echo "6️⃣  Запуск сервисов..."
sudo systemctl daemon-reload
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat

sleep 3

# 7. Проверка статуса
echo ""
echo "7️⃣  Проверка статуса сервисов..."
echo ""
echo "Celery Worker:"
sudo systemctl status celery-worker --no-pager
echo ""
echo "Celery Beat:"
sudo systemctl status celery-beat --no-pager

# 8. Тестирование
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🧪 ТЕСТИРОВАНИЕ"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Запуск тестового режима (dry-run)..."
cd /home/miniapp_expert/api-django
source venv/bin/activate
python manage.py process_recurring_payments --dry-run

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Полезные команды:"
echo ""
echo "# Просмотр логов:"
echo "sudo tail -f /var/log/celery/worker.log"
echo "sudo tail -f /var/log/celery/beat.log"
echo ""
echo "# Перезапуск сервисов:"
echo "sudo systemctl restart celery-worker celery-beat"
echo ""
echo "# Проверка статуса:"
echo "sudo systemctl status celery-worker"
echo "sudo systemctl status celery-beat"
echo ""
echo "# Тестовое списание (dry-run):"
echo "cd /home/miniapp_expert/api-django && source venv/bin/activate"
echo "python manage.py process_recurring_payments --dry-run"
echo ""
echo "# Реальное списание:"
echo "python manage.py process_recurring_payments"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
