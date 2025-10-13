# Инструкция по развертыванию MiniAppExpert

## Данные для подключения к серверу

```
IP: 195.2.73.224
User: root
Password: h374w#54EeCTWYLu_qRA
```

## 1. Подключение к серверу

```bash
ssh root@195.2.73.224
```

## 2. Установка необходимого ПО

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Nginx
apt install nginx -y

# Установка Node.js (последняя LTS версия)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка Certbot для SSL
apt install certbot python3-certbot-nginx -y

# Установка PM2 для управления Node.js приложениями
npm install -g pm2
```

## 3. Настройка DNS (выполнить в панели управления доменом)

Добавьте A-записи для домена `miniapp.expert`:

```
miniapp.expert       A    195.2.73.224
www.miniapp.expert   A    195.2.73.224
demoapp.miniapp.expert  A    195.2.73.224
```

**Важно:** Дождитесь распространения DNS (может занять до 24 часов, обычно 5-15 минут)

Проверить можно командой:
```bash
dig miniapp.expert
dig www.miniapp.expert
dig demoapp.miniapp.expert
```

## 4. Развертывание лендинга (miniapp.expert и www.miniapp.expert)

### 4.1. Создание директории для сайта

```bash
mkdir -p /var/www/miniapp.expert
cd /var/www/miniapp.expert
```

### 4.2. Копирование файлов сайта

На локальной машине:
```bash
cd /Users/arkhiptsev/dev/rello
scp -r site/* root@195.2.73.224:/var/www/miniapp.expert/
```

### 4.3. Настройка Nginx для лендинга

```bash
nano /etc/nginx/sites-available/miniapp.expert
```

Добавьте конфигурацию:

```nginx
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
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/miniapp.expert /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4.4. Получение SSL сертификата для лендинга

```bash
certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos -m hello@miniapp.expert
```

## 5. Развертывание Mini App (demoapp.miniapp.expert)

### 5.1. Создание директории для приложения

```bash
mkdir -p /var/www/demoapp
cd /var/www/demoapp
```

### 5.2. Копирование файлов приложения

На локальной машине:
```bash
cd /Users/arkhiptsev/dev/rello

# Создать production build
npm run build

# Скопировать на сервер
scp -r dist/* root@195.2.73.224:/var/www/demoapp/
```

### 5.3. Настройка Nginx для Mini App

```bash
nano /etc/nginx/sites-available/demoapp.miniapp.expert
```

Добавьте конфигурацию:

```nginx
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
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/demoapp.miniapp.expert /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5.4. Получение SSL сертификата для Mini App

```bash
certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos -m hello@miniapp.expert
```

## 6. Настройка автоматического обновления SSL сертификатов

```bash
# Certbot автоматически добавляет cron job, проверьте:
systemctl status certbot.timer

# Тестовое обновление
certbot renew --dry-run
```

## 7. Оптимизация Nginx

```bash
nano /etc/nginx/nginx.conf
```

Добавьте/проверьте в секции `http`:

```nginx
http {
    # ... существующие настройки ...
    
    # Оптимизация
    client_max_body_size 20M;
    keepalive_timeout 65;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # ... остальные настройки ...
}
```

Перезагрузите Nginx:
```bash
nginx -t
systemctl reload nginx
```

## 8. Проверка развертывания

### Проверка лендинга:
```bash
curl -I https://miniapp.expert
curl -I https://www.miniapp.expert
```

### Проверка Mini App:
```bash
curl -I https://demoapp.miniapp.expert
```

## 9. Мониторинг и логи

### Логи Nginx:
```bash
# Логи доступа
tail -f /var/log/nginx/access.log

# Логи ошибок
tail -f /var/log/nginx/error.log
```

### Статус Nginx:
```bash
systemctl status nginx
```

### SSL сертификаты:
```bash
certbot certificates
```

## 10. Обновление сайта

### Для лендинга:
```bash
# На локальной машине
cd /Users/arkhiptsev/dev/rello
scp -r site/* root@195.2.73.224:/var/www/miniapp.expert/
```

### Для Mini App:
```bash
# На локальной машине
cd /Users/arkhiptsev/dev/rello
npm run build
scp -r dist/* root@195.2.73.224:/var/www/demoapp/
```

## 11. Настройка Firewall (опционально, но рекомендуется)

```bash
# Установка UFW
apt install ufw -y

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включить firewall
ufw --force enable

# Проверить статус
ufw status
```

## 12. Резервное копирование (рекомендуется)

```bash
# Создать директорию для бэкапов
mkdir -p /root/backups

# Скрипт для бэкапа
nano /root/backup.sh
```

Содержимое скрипта:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

# Бэкап сайта
tar -czf $BACKUP_DIR/miniapp_$DATE.tar.gz /var/www/miniapp.expert

# Бэкап приложения
tar -czf $BACKUP_DIR/demoapp_$DATE.tar.gz /var/www/demoapp

# Удалить бэкапы старше 7 дней
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Сделать исполняемым:
```bash
chmod +x /root/backup.sh
```

Добавить в cron (ежедневно в 3:00):
```bash
crontab -e
# Добавить строку:
0 3 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

## Troubleshooting

### Если сайт не открывается:

1. **Проверьте DNS:**
   ```bash
   dig miniapp.expert
   ```

2. **Проверьте Nginx:**
   ```bash
   systemctl status nginx
   nginx -t
   ```

3. **Проверьте логи:**
   ```bash
   tail -100 /var/log/nginx/error.log
   ```

4. **Проверьте файлы:**
   ```bash
   ls -la /var/www/miniapp.expert
   ls -la /var/www/demoapp
   ```

### Если SSL не работает:

1. **Проверьте сертификаты:**
   ```bash
   certbot certificates
   ```

2. **Пересоздать сертификат:**
   ```bash
   certbot delete --cert-name miniapp.expert
   certbot --nginx -d miniapp.expert -d www.miniapp.expert
   ```

## Быстрый деплой (одной командой)

Создайте скрипт для быстрого деплоя на локальной машине:

```bash
# /Users/arkhiptsev/dev/rello/deploy.sh
#!/bin/bash

SERVER="root@195.2.73.224"

echo "🚀 Деплой лендинга..."
scp -r site/* $SERVER:/var/www/miniapp.expert/

echo "🚀 Билд и деплой приложения..."
npm run build
scp -r dist/* $SERVER:/var/www/demoapp/

echo "✅ Деплой завершен!"
echo "🌐 Лендинг: https://miniapp.expert"
echo "📱 Приложение: https://demoapp.miniapp.expert"
```

Сделать исполняемым:
```bash
chmod +x deploy.sh
```

Использование:
```bash
./deploy.sh
```

## Полезные команды

```bash
# Перезапуск Nginx
systemctl restart nginx

# Проверка конфигурации Nginx
nginx -t

# Просмотр активных сайтов
ls -la /etc/nginx/sites-enabled/

# Проверка портов
netstat -tlnp | grep nginx

# Проверка использования диска
df -h

# Проверка использования памяти
free -h
```

---

**Важно:** После выполнения всех шагов сайты будут доступны по адресам:
- https://miniapp.expert
- https://www.miniapp.expert  
- https://demoapp.miniapp.expert

Все с SSL сертификатами от Let's Encrypt!

