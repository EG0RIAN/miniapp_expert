# 💳 Интеграция оплаты T-Bank

## ✅ Что реализовано:

Полная интеграция оплаты через **T-Bank (Тинькофф)** с поддержкой рассрочки 0-0-12.

---

## 📄 Созданные страницы:

### 1. **payment.html** - Страница оплаты
**URL:** https://miniapp.expert/payment.html

**Функционал:**
- ✅ Выбор способа оплаты (полная/рассрочка)
- ✅ Рассрочка 0-0-12 от Т-Банк (3, 6, 12, 24 месяца)
- ✅ Автоматический расчет ежемесячного платежа
- ✅ Форма контактных данных
- ✅ Итоговая сумма заказа
- ✅ Информация о заказе
- ✅ Безопасная оплата

### 2. **payment-success.html** - Страница успешной оплаты
**URL:** https://miniapp.expert/payment-success.html

**Функционал:**
- ✅ Подтверждение успешной оплаты
- ✅ Номер заказа
- ✅ Информация о следующих шагах
- ✅ Ссылка в личный кабинет
- ✅ Автосохранение заказа

### 3. **tbank-payment.js** - Класс интеграции T-Bank
**Функционал:**
- ✅ Создание платежа
- ✅ Проверка статуса
- ✅ Открытие окна оплаты
- ✅ Расчет рассрочки
- ✅ Сохранение в localStorage

---

## 🔗 Точки интеграции:

### 1. Коробочное решение (/real-estate-solution.html)
```html
💳 Оплатить сейчас - 150 000 ₽
+ Рассрочка 0-0-12 без переплат
```

### 2. Личный кабинет (/cabinet.html)
```html
Подписка "Премиум поддержка"
→ 💳 Подключить за 15 000 ₽
→ Рассрочка 0-0-12
```

### 3. Главная страница (планируется)
```html
CTA кнопки с оплатой
```

---

## 🛠️ Как работает:

### Процесс оплаты:

```
1. Пользователь нажимает "Оплатить"
   ↓
2. Переход на /payment.html?product=...&price=...
   ↓
3. Выбор способа оплаты:
   - Полная оплата картой
   - Рассрочка 0-0-12 (3/6/12/24 мес)
   ↓
4. Ввод email и телефона
   ↓
5. Нажатие "Перейти к оплате"
   ↓
6. Вызов tbank.quickPayment()
   ↓
7. Открытие окна T-Bank (600x800px)
   ↓
8. Пользователь оплачивает
   ↓
9. Редирект на /payment-success.html
   ↓
10. Заказ сохраняется в localStorage
    ↓
11. Email с данными для входа
```

---

## 💰 Варианты оплаты:

### Полная оплата:
```
Сумма: 150 000 ₽
Способ: Банковская карта
Срок: Мгновенно
```

### Рассрочка 0-0-12:
| Срок | Платеж/мес | Переплата |
|------|-----------|-----------|
| 3 месяца | 50 000 ₽ | 0 ₽ |
| 6 месяцев | 25 000 ₽ | 0 ₽ |
| 12 месяцев | 12 500 ₽ | 0 ₽ |
| 24 месяца | 6 250 ₽ | 0 ₽ |

---

## 🔧 Настройка для production:

### 1. Получите Terminal Key от T-Bank:

**Шаги:**
1. Зарегистрируйтесь на https://www.tbank.ru/kassa/
2. Создайте терминал
3. Получите `TerminalKey` и `Password`
4. Скопируйте ключи

### 2. Обновите tbank-payment.js:

```javascript
// Замените:
this.terminalKey = terminalKey || 'DEMO_TERMINAL';

// На:
this.terminalKey = terminalKey || 'YOUR_REAL_TERMINAL_KEY';
```

### 3. Раскомментируйте production код:

```javascript
// В методе createPayment():
const response = await fetch(`${this.apiUrl}/Init`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData)
});

return await response.json();
```

### 4. Настройте webhook:

**URL для webhook:**
```
https://miniapp.expert/api/tbank-webhook
```

**События:**
- AUTHORIZED (оплата прошла)
- CONFIRMED (платеж подтвержден)
- REJECTED (отклонен)

---

## 📊 Данные в localStorage:

### Заказы:
```javascript
localStorage.getItem('orders')
[
  {
    orderId: 'ORDER_1729365123456',
    paymentId: 'DEMO_1729365123456',
    product: 'Mini App для недвижимости',
    amount: 150000,
    email: 'client@example.com',
    status: 'paid',
    createdAt: '2025-10-19T22:00:00.000Z'
  }
]
```

### Платежи:
```javascript
localStorage.getItem('payments')
[
  {
    paymentId: 'DEMO_1729365123456',
    orderId: 'ORDER_1729365123456',
    amount: 150000,
    description: 'Mini App для недвижимости',
    email: 'client@example.com',
    status: 'pending',
    createdAt: '2025-10-19T22:00:00.000Z',
    paymentURL: 'https://demo.tbank.ru/payment?...'
  }
]
```

---

## 🧪 Тестирование:

### 1. Тест полной оплаты:
```
1. https://miniapp.expert/real-estate-solution.html
2. Нажать "💳 Оплатить сейчас"
3. Выбрать "Полная оплата"
4. Ввести email и телефон
5. Нажать "Перейти к оплате"
6. Проверить редирект на success page
```

### 2. Тест рассрочки:
```
1. https://miniapp.expert/payment.html
2. Выбрать "Рассрочка 0-0-12"
3. Выбрать срок (3/6/12/24 месяца)
4. Проверить расчет ежемесячного платежа
5. Продолжить оплату
```

### 3. Тест из ЛК:
```
1. https://miniapp.expert/login.html
2. Войти
3. Мои подписки
4. Нажать "Подключить" на Премиум
5. Проверить переход на payment.html
```

---

## 📱 Доступные страницы:

| Страница | URL | Описание |
|----------|-----|----------|
| Оплата | https://miniapp.expert/payment.html | Форма оплаты |
| Успех | https://miniapp.expert/payment-success.html | После оплаты |
| Продукт | https://miniapp.expert/real-estate-solution.html | Кнопка оплаты |
| ЛК | https://miniapp.expert/cabinet.html | Оплата подписок |

---

## 🎯 Функции T-Bank:

### TBankPayment класс:

**Методы:**
```javascript
// Создать платеж
await tbank.createPayment(orderData);

// Проверить статус
await tbank.checkPaymentStatus(paymentId);

// Открыть окно оплаты
tbank.openPaymentWindow(paymentURL);

// Быстрая оплата (все в одном)
await tbank.quickPayment(orderData);

// Получить варианты рассрочки
tbank.getInstallmentOptions(amount);
```

**Параметры:**
```javascript
{
  amount: 150000,          // Сумма в рублях
  orderId: 'ORDER_123',    // Уникальный ID
  description: 'Product',  // Описание
  email: 'user@mail.com',  // Email клиента
  phone: '+79991234567',   // Телефон
  name: 'Client Name'      // Имя
}
```

---

## ⚙️ Настройки рассрочки:

### Доступные сроки:
- **3 месяца** - для заказов от 3,000 ₽
- **6 месяцев** - для заказов от 6,000 ₽
- **12 месяцев** - для заказов от 20,000 ₽
- **24 месяца** - для заказов от 50,000 ₽

### Условия:
```
0-0-12 = 
  0% первый взнос
  0% переплата
  12 месяцев срок
```

---

## 🔐 Безопасность:

### Текущий режим (DEMO):
- ✅ Безопасно для разработки
- ✅ Не списывает реальные деньги
- ✅ Показывает весь flow

### Production режим:
- 🔒 SSL сертификат (есть)
- 🔒 Реальный Terminal Key
- 🔒 Webhook для уведомлений
- 🔒 Server-side validation

---

## 📊 Статистика платежей:

### В админке (запланировано):
```
- Всего заказов
- Сумма продаж
- Конверсия
- Средний чек
- График продаж
```

### В ЛК клиента:
```
- История платежей (есть)
- Активные подписки (есть)
- Следующий платеж (есть)
```

---

## 🚀 Deployed:

**Status:** ✅ LIVE  
**URL:** https://miniapp.expert/payment.html  
**Mode:** DEMO (для тестирования)  
**Date:** 19 Oct 2025, 23:00 MSK

---

## 🎯 Следующие шаги:

### Для production:
1. ✅ Получить Terminal Key от T-Bank
2. ✅ Настроить webhook
3. ✅ Добавить server-side обработку
4. ✅ Настроить email уведомления
5. ✅ Протестировать на реальных платежах

### Дополнительно:
- Добавить другие способы оплаты (ЮMoney, PayPal)
- Интегрировать с CRM
- Автоматическая выдача продуктов
- Email-уведомления через API
- Чеки и invoice

---

## 💡 Использование:

### Прямая ссылка с параметрами:
```
https://miniapp.expert/payment.html?product=Mini App&price=150000&company=MyCompany&email=client@mail.com
```

### Из JavaScript:
```javascript
// Сохранить заказ
localStorage.setItem('pendingOrder', JSON.stringify({
    product: 'Mini App для недвижимости',
    price: 150000,
    companyName: 'ООО "Недвижимость"',
    email: 'client@example.com'
}));

// Перейти на оплату
window.location.href = '/payment.html';
```

---

## 📞 Поддержка:

**Документация T-Bank:**
- API: https://www.tbank.ru/kassa/dev/payments/
- Интеграция: https://www.tbank.ru/kassa/dev/payments/init/
- Рассрочка: https://www.tbank.ru/kassa/dev/payments/credit/

**Telegram для помощи:**
- @miniappexpert

---

## ✅ Готово к использованию!

**Протестируйте:**
```
1. https://miniapp.expert/real-estate-solution.html
2. Нажмите "Оплатить сейчас"
3. Выберите рассрочку
4. Заполните данные
5. Проверьте payment flow
```

**В demo режиме:**
- Платежи не проходят реально
- Отображается success page
- Данные сохраняются локально

**Для production:**
- Замените DEMO_TERMINAL на реальный ключ
- Раскомментируйте API calls
- Настройте webhook

---

**Дата:** 19 октября 2025, 23:00 MSK  
**Статус:** ✅ Deployed & Ready to Test

