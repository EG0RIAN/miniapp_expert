# 💳 Payment API Backend

Backend API для безопасной интеграции с T-Bank.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
cd api
npm install
```

### 2. Настройка окружения
```bash
# Создайте .env файл
cp env.example .env

# Или создайте вручную:
echo "TBANK_TERMINAL_KEY=YOUR_KEY" > .env
echo "TBANK_PASSWORD=m\$4Hgg1ASpPUVfhj" >> .env
echo "PORT=3001" >> .env
```

### 3. Запуск локально
```bash
npm start
# или для разработки:
npm run dev
```

### 4. Деплой на сервер
```bash
cd ..
chmod +x deploy-api.sh
./deploy-api.sh
```

---

## 📡 API Endpoints

### POST /api/payment/create
Создание платежа через T-Bank

**Request:**
```json
{
  "amount": 150000,
  "orderId": "ORDER_123",
  "description": "Mini App для недвижимости",
  "email": "user@domain.com",
  "phone": "+79991234567",
  "name": "Иван Иванов"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "123456789",
  "paymentURL": "https://securepay.tinkoff.ru/...",
  "orderId": "ORDER_123"
}
```

### POST /api/payment/status
Проверка статуса платежа

**Request:**
```json
{
  "paymentId": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "status": "CONFIRMED",
  "paymentId": "123456789",
  "amount": 15000000
}
```

### POST /api/payment/webhook
Webhook для уведомлений от T-Bank

**Автоматически вызывается T-Bank при изменении статуса платежа**

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "miniapp-expert-api",
  "version": "1.0.0",
  "timestamp": "2025-10-19T23:00:00.000Z"
}
```

---

## 🔐 Безопасность

### Token Generation
Для каждого запроса к T-Bank генерируется токен:
```javascript
Token = SHA256(concat(sorted_params + Password))
```

### Защита
- ✅ Password не передается в клиент
- ✅ Token генерируется на сервере
- ✅ HTTPS для всех запросов
- ✅ CORS настроен правильно

---

## 🔧 Настройка Nginx

Добавьте в `/etc/nginx/sites-available/miniapp.expert`:

```nginx
# API Proxy
upstream miniapp_api {
    server 127.0.0.1:3001;
}

server {
    # ... existing config ...
    
    location /api/ {
        proxy_pass http://miniapp_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Перезагрузите Nginx:
```bash
systemctl reload nginx
```

---

## 🧪 Тестирование

### Локально:
```bash
# Запустите сервер
npm start

# В другом терминале:
curl http://localhost:3001/api/health

# Тест создания платежа
curl -X POST http://localhost:3001/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "orderId": "TEST_123",
    "description": "Test payment",
    "email": "test@example.com",
    "phone": "+79991234567",
    "name": "Test User"
  }'
```

### На сервере:
```bash
# Health check
curl https://miniapp.expert/api/health

# Проверить PM2
ssh root@85.198.110.66
pm2 status
pm2 logs miniapp-api
```

---

## 📊 Мониторинг

### PM2 команды:
```bash
pm2 status          # Статус
pm2 logs miniapp-api # Логи
pm2 restart miniapp-api # Перезапуск
pm2 stop miniapp-api    # Остановка
pm2 delete miniapp-api  # Удаление
```

### Логи:
```bash
# Просмотр логов
tail -f /home/miniapp_expert/api/logs/out.log
tail -f /home/miniapp_expert/api/logs/err.log
```

---

## 🔄 Workflow

### Процесс оплаты:

```
1. Client: Нажимает "Оплатить"
   ↓
2. Client: POST /api/payment/create
   ↓
3. Server: Генерирует Token
   ↓
4. Server: POST https://securepay.tinkoff.ru/v2/Init
   ↓
5. T-Bank: Возвращает PaymentURL
   ↓
6. Server: Отправляет PaymentURL клиенту
   ↓
7. Client: Открывает окно оплаты
   ↓
8. User: Оплачивает в T-Bank
   ↓
9. T-Bank: POST /api/payment/webhook (уведомление)
   ↓
10. Server: Обновляет статус заказа
    ↓
11. Server: Отправляет email клиенту
    ↓
12. Client: Редирект на success page
```

---

## 🌐 Production Deployment

### Требования:
- Node.js 18+ ✅
- PM2 ✅
- Nginx ✅
- SSL сертификат ✅

### Команды:
```bash
# 1. Деплой кода
./deploy-api.sh

# 2. Настроить Nginx (вручную)
nano /etc/nginx/sites-available/miniapp.expert
# Добавить proxy для /api/
systemctl reload nginx

# 3. Проверить
curl https://miniapp.expert/api/health
```

---

## 📝 Environment Variables

```bash
TBANK_TERMINAL_KEY=YOUR_KEY  # Терминал T-Bank
TBANK_PASSWORD=YOUR_PASSWORD # Пароль терминала
PORT=3001                             # Порт API
NODE_ENV=production                   # Окружение
```

---

## 🔧 Troubleshooting

### API не отвечает:
```bash
pm2 status
pm2 logs miniapp-api
systemctl status nginx
```

### CORS ошибки:
Проверьте настройки в nginx-api.conf

### T-Bank ошибки:
Проверьте Terminal Key и Password в .env

---

## 📚 Документация

- [T-Bank API](https://www.tbank.ru/kassa/dev/payments/)
- [Express.js](https://expressjs.com/)
- [PM2](https://pm2.keymetrics.io/)

---

**Created:** 19 Oct 2025, 23:20 MSK  
**Status:** Ready for deployment

