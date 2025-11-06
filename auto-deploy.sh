#!/bin/bash

# Автоматизированный скрипт развертывания MiniAppExpert
# Использование: ./auto-deploy.sh

set -e  # Остановка при ошибке

SERVER="195.2.73.224"
USER="root"
PASSWORD="h374w#54EeCTWYLu_qRA"
PROJECT_DIR="/home/miniapp_expert"

echo "╔════════════════════════════════════════════╗"
echo "║  [*] Auto Deploy MiniAppExpert            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Проверка наличия sshpass для автоматической аутентификации
if ! command -v sshpass &> /dev/null; then
    echo "[PKG] Установка sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

echo "[>>] Подключение к серверу $SERVER..."
echo ""

# Выполнение команд на сервере через SSH
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'ENDSSH'

echo "[OK] Подключение установлено"
echo ""

# 1. Обновление системы
echo "[PKG] Обновление системы..."
apt update && apt upgrade -y

# 2. Установка необходимого ПО
echo "[PKG] Установка Nginx..."
apt install nginx -y

echo "[PKG] Установка Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "[OK] Node.js уже установлен"
fi

echo "[PKG] Установка Certbot..."
apt install certbot python3-certbot-nginx -y

# 3. Создание директорий
echo "[DIR] Создание директорий..."
mkdir -p /var/www/miniapp.expert
mkdir -p /var/www/demoapp

# 4. Настройка Nginx для лендинга
echo "[CFG] Настройка Nginx для лендинга..."
cat > /etc/nginx/sites-available/miniapp.expert << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name miniapp.expert www.miniapp.expert;
    
    root /var/www/miniapp.expert;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Кеширование статики
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;
}
EOF

# 5. Настройка Nginx для Mini App
echo "[CFG] Настройка Nginx для Mini App..."
cat > /etc/nginx/sites-available/demoapp.miniapp.expert << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name demoapp.miniapp.expert;
    
    root /var/www/demoapp;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кеширование статики
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;
}
EOF

# 6. Активация сайтов
echo "[LNK] Активация сайтов..."
ln -sf /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/demoapp.miniapp.expert /etc/nginx/sites-enabled/

# 7. Удаление default сайта
rm -f /etc/nginx/sites-enabled/default

# 8. Проверка конфигурации Nginx
echo "[CHK] Проверка конфигурации Nginx..."
nginx -t

# 9. Перезапуск Nginx
echo "[RLD] Перезапуск Nginx..."
systemctl restart nginx
systemctl enable nginx

# 10. Настройка Firewall
echo "[FW] Настройка Firewall..."
if ! command -v ufw &> /dev/null; then
    apt install ufw -y
fi
ufw --force allow 22/tcp
ufw --force allow 80/tcp
ufw --force allow 443/tcp
ufw --force enable

echo ""
echo "[OK] Серверная часть настроена!"
echo ""
echo "[i] СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Настройте DNS-записи для доменов"
echo "2. Дождитесь распространения DNS (5-15 минут)"
echo "3. Запустите скрипт еще раз для получения SSL"
echo ""

ENDSSH

echo ""
echo "[>>] Копирование файлов на сервер..."
echo ""

# Копирование лендинга
echo "[UP] Копирование лендинга..."
sshpass -p "$PASSWORD" scp -r -o StrictHostKeyChecking=no site/* $USER@$SERVER:/var/www/miniapp.expert/

# Сборка и копирование Mini App
echo "[BLD] Сборка Mini App..."
npm run build

echo "[UP] Копирование Mini App..."
sshpass -p "$PASSWORD" scp -r -o StrictHostKeyChecking=no dist/* $USER@$SERVER:/var/www/demoapp/

# Проверка и получение SSL сертификатов
echo ""
echo "[SSL] Попытка получения SSL сертификатов..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'ENDSSH2'

# Проверка доступности доменов
if host miniapp.expert | grep -q "195.2.73.224"; then
    echo "[OK] DNS для miniapp.expert настроен"
    
    # Получение SSL для лендинга
    certbot --nginx -d miniapp.expert -d www.miniapp.expert \
        --non-interactive --agree-tos -m hello@miniapp.expert \
        --redirect || echo "[!] Не удалось получить SSL для лендинга (возможно, DNS еще не распространился)"
else
    echo "[!] DNS для miniapp.expert еще не настроен"
    echo "   Настройте A-записи и запустите скрипт снова через 15 минут"
fi

if host demoapp.miniapp.expert | grep -q "195.2.73.224"; then
    echo "[OK] DNS для demoapp.miniapp.expert настроен"
    
    # Получение SSL для Mini App
    certbot --nginx -d demoapp.miniapp.expert \
        --non-interactive --agree-tos -m hello@miniapp.expert \
        --redirect || echo "[!] Не удалось получить SSL для Mini App (возможно, DNS еще не распространился)"
else
    echo "[!] DNS для demoapp.miniapp.expert еще не настроен"
    echo "   Настройте A-записи и запустите скрипт снова через 15 минут"
fi

# Финальная перезагрузка Nginx
systemctl reload nginx

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  [OK] Развертывание завершено!            ║"
echo "╚════════════════════════════════════════════╝"

ENDSSH2

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  [*] ГОТОВО!                              ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "[>>] Проверьте сайты:"
echo ""
echo "   http://miniapp.expert"
echo "   http://www.miniapp.expert"
echo "   http://demoapp.miniapp.expert"
echo ""
echo "[i] Если SSL не получен (DNS не настроен):"
echo "   1. Настройте A-записи в панели домена"
echo "   2. Подождите 15 минут"
echo "   3. Запустите: ./auto-deploy.sh еще раз"
echo ""

