# 🔄 Переход на Backend интеграцию

## ✅ Что создано:

### Backend API (Node.js + Express)
```
api/
├── server.js           # Express сервер с T-Bank интеграцией
├── package.json        # Зависимости
├── ecosystem.config.js # PM2 конфигурация
├── nginx-api.conf      # Nginx proxy настройки
├── env.example         # Пример переменных окружения
└── README.md          # Документация
```

### Frontend (клиентская часть)
```
site/
└── payment-backend.js  # Клиент для работы с API
```

---

## 🚀 Установка Backend (3 шага)

### Шаг 1: Деплой API на сервер
```bash
cd /Users/arkhiptsev/dev/rello
chmod +x deploy-api.sh
./deploy-api.sh
```

**Что происходит:**
- Устанавливается Node.js (если нет)
- Устанавливаются зависимости
- Создается .env файл с ключами T-Bank
- Запускается PM2
- API доступен на localhost:3001

### Шаг 2: Настроить Nginx прокси
```bash
ssh root@85.198.110.66

# Открыть конфиг
nano /etc/nginx/sites-available/miniapp.expert

# Добавить ПЕРЕД location / блоком:
upstream miniapp_api {
    server 127.0.0.1:3001;
}

# Добавить ВНУТРИ server { ... } блока:
location /api/ {
    proxy_pass http://miniapp_api/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Сохранить и перезапустить
systemctl reload nginx
```

### Шаг 3: Обновить клиентский код
```bash
# В site/payment.html заменить:
<script src="tbank-payment.js"></script>

# На:
<script src="payment-backend.js"></script>

# И в processPayment() заменить:
const payment = await tbank.quickPayment(paymentData);

# На:
const payment = await PaymentAPI.quickPayment(paymentData);
```

---

## 🧪 Проверка работы

### 1. Health Check
```bash
curl https://miniapp.expert/api/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "service": "miniapp-expert-api",
  "version": "1.0.0",
  "timestamp": "2025-10-19T23:20:00.000Z"
}
```

### 2. Тест создания платежа
```bash
curl -X POST https://miniapp.expert/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "orderId": "TEST_' + $(date +%s) + '",
    "description": "Тестовый платеж",
    "email": "test@example.com",
    "phone": "+79991234567",
    "name": "Тест"
  }'
```

**Ожидается:**
```json
{
  "success": true,
  "paymentId": "...",
  "paymentURL": "https://securepay.tinkoff.ru/...",
  "orderId": "TEST_..."
}
```

### 3. Проверка PM2
```bash
ssh root@85.198.110.66
pm2 status
# Должен быть запущен: miniapp-api
```

---

## 📊 Архитектура

### До (клиентская интеграция):
```
Browser → T-Bank API (CORS issues)
```

### После (серверная интеграция):
```
Browser → Backend API → T-Bank API
         ↑
    (Nginx proxy)
```

### Преимущества:
- ✅ Нет CORS проблем
- ✅ Безопасное хранение Password
- ✅ Token генерация на сервере
- ✅ Webhook обработка
- ✅ Логирование
- ✅ Валидация на сервере

---

## 🔐 Безопасность

### Что скрыто от клиента:
- 🔒 Password терминала
- 🔒 Token generation logic
- 🔒 Серверные логи
- 🔒 Webhook processing

### Что на клиенте:
- ✅ Только UI
- ✅ Публичные данные
- ✅ PaymentURL (от сервера)

---

## 🌐 URLs

| Endpoint | URL |
|----------|-----|
| Health | https://miniapp.expert/api/health |
| Create Payment | https://miniapp.expert/api/payment/create |
| Check Status | https://miniapp.expert/api/payment/status |
| Webhook | https://miniapp.expert/api/payment/webhook |

---

## 📝 Настройка Webhook в T-Bank

### В личном кабинете T-Bank:
```
1. Настройки терминала
2. URL для уведомлений: https://miniapp.expert/api/payment/webhook
3. Сохранить
```

### События webhook:
- AUTHORIZED - оплата авторизована
- CONFIRMED - платеж подтвержден
- REJECTED - отклонен
- REFUNDED - возврат

---

## 🔄 Обновление клиента

### В payment.html замените:

**Было:**
```html
<script src="tbank-payment.js"></script>
<script>
  const payment = await tbank.quickPayment(paymentData);
</script>
```

**Стало:**
```html
<script src="payment-backend.js"></script>
<script>
  const payment = await PaymentAPI.quickPayment(paymentData);
</script>
```

---

## 🚀 Deployment Checklist

- [ ] API код задеплоен на сервер
- [ ] npm install выполнен
- [ ] .env файл создан
- [ ] PM2 запущен (pm2 status)
- [ ] Nginx прокси настроен
- [ ] Nginx перезагружен
- [ ] Health check работает
- [ ] Тестовый платеж проходит
- [ ] Webhook URL добавлен в T-Bank
- [ ] Клиентский код обновлен

---

## 💡 Дополнительные возможности

### После деплоя можно добавить:

1. **Email уведомления**
   ```javascript
   // В webhook
   sendEmail(order.email, 'Оплата получена!', ...);
   ```

2. **База данных**
   ```javascript
   // Вместо localStorage
   await db.orders.create(orderData);
   ```

3. **CRM интеграция**
   ```javascript
   // Отправка в CRM
   await crm.createLead(orderData);
   ```

4. **Telegram уведомления**
   ```javascript
   // Уведомление в Telegram
   await bot.sendMessage(ADMIN_ID, 'Новый заказ!');
   ```

---

## 📞 Поддержка

**Логи:**
```bash
pm2 logs miniapp-api
tail -f api/logs/combined.log
```

**Перезапуск:**
```bash
pm2 restart miniapp-api
```

**Остановка:**
```bash
pm2 stop miniapp-api
```

---

## ✅ Summary

**Created:**
- ✅ Express API сервер
- ✅ T-Bank интеграция с Token
- ✅ Webhook обработка
- ✅ PM2 конфигурация
- ✅ Nginx proxy config
- ✅ Deployment script
- ✅ Клиентская библиотека

**Ready to deploy!** 🚀

---

**Date:** 19 October 2025  
**Status:** Ready for installation

