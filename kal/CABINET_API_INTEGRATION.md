# Интеграция личного кабинета с Django API

## Обзор

Все данные в личном кабинете теперь загружаются динамически из Django API. Статические данные больше не используются.

## Изменения

### 1. Загрузка данных при инициализации

При загрузке страницы `cabinet.html` все данные загружаются параллельно из API:

```javascript
// Pre-load all sections data in parallel
await Promise.all([
    loadProducts(),
    loadSubscriptions(),
    loadPayments(),
    loadPartnersData()
]);
```

### 2. Функции загрузки данных

Все функции загрузки данных обновлены для работы с API:

#### `loadProfile()`
- Загружает профиль пользователя из `/api/auth/profile/`
- Обновляет статистику из `/api/client/dashboard/`
- Обрабатывает ошибки и показывает значения по умолчанию

#### `loadProducts()`
- Загружает продукты пользователя из `/api/client/products/`
- Отображает статусы продуктов (active, expired, pending, cancelled)
- Показывает информацию о подписках и возможность продления

#### `loadSubscriptions()`
- Загружает подписки из `/api/client/products/` (фильтрует по `product_type === 'subscription'`)
- Отображает информацию о подписке (стоимость, период, следующий платеж)
- Показывает кнопки управления подпиской

#### `loadPayments()`
- Загружает платежи из `/api/client/payments/`
- Отображает историю платежей с деталями (дата, сумма, статус, метод оплаты)
- Показывает общую сумму потраченных средств
- Поддерживает различные статусы платежей (success, pending, failed, CONFIRMED, REJECTED, etc.)

#### `loadPartnersData()`
- Загружает данные реферальной программы из `/api/client/referrals/`
- Отображает статистику (количество рефералов, заработано, доступно к выводу)
- Показывает список рефералов с деталями
- Загружает историю выплат из `/api/client/referrals/payouts/`

### 3. Обработка ошибок

Все функции загрузки данных обернуты в `try-catch` блоки:

```javascript
try {
    const result = await apiRequest('/api/client/products/');
    // ... обработка данных
} catch (error) {
    console.error('Error in loadProducts:', error);
    showProductsError();
}
```

### 4. Проверка наличия элементов DOM

Перед обновлением элементов DOM проверяется их наличие:

```javascript
if (document.getElementById('userName')) {
    document.getElementById('userName').textContent = userName;
}
```

### 5. Перезагрузка данных при переключении секций

При переключении между секциями данные перезагружаются из API:

```javascript
function showSection(sectionId) {
    // ... показ секции
    // Reload section data from API (data might have changed)
    switch(sectionId) {
        case 'products':
            loadProducts();
            break;
        // ...
    }
}
```

### 6. Обновление иконок Lucide

Иконки Lucide обновляются после динамического создания контента:

```javascript
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
```

Также добавлено периодическое обновление иконок для динамического контента:

```javascript
setInterval(() => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 1000);
```

## API Endpoints

### Профиль пользователя
- `GET /api/auth/profile/` - Получить профиль пользователя
- `PATCH /api/auth/profile/` - Обновить профиль пользователя

### Дашборд
- `GET /api/client/dashboard/` - Получить статистику пользователя

### Продукты
- `GET /api/client/products/` - Получить список продуктов пользователя
- `GET /api/client/products/available/` - Получить список доступных продуктов

### Платежи
- `GET /api/client/payments/` - Получить историю платежей
- `GET /api/client/payments/:id/` - Получить детали платежа
- `GET /api/client/payment-methods/` - Получить список платежных методов

### Реферальная программа
- `GET /api/client/referrals/` - Получить данные реферальной программы
- `GET /api/client/referrals/payouts/` - Получить историю выплат
- `POST /api/client/referrals/request-payout/` - Запросить вывод средств

## Формат данных API

### Профиль пользователя
```json
{
    "id": 1,
    "email": "user@example.com",
    "name": "Имя пользователя",
    "phone": "+79991234567",
    "referral_code": "ABC123",
    "created_at": "2025-01-01T00:00:00Z"
}
```

### Дашборд
```json
{
    "success": true,
    "active_products": 2,
    "subscriptions": 1,
    "total_payments": 5,
    "referral_stats": {
        "invites": 3,
        "earned": 1000.00
    }
}
```

### Продукты
```json
{
    "success": true,
    "products": [
        {
            "id": "uuid",
            "product": {
                "id": "uuid",
                "name": "Название продукта",
                "description": "Описание",
                "product_type": "subscription",
                "price": 3000.00
            },
            "status": "active",
            "start_date": "2025-01-01T00:00:00Z",
            "end_date": "2025-02-01T00:00:00Z",
            "renewal_price": 3000.00
        }
    ]
}
```

### Платежи
```json
{
    "success": true,
    "payments": [
        {
            "id": "uuid",
            "amount": 3000.00,
            "currency": "RUB",
            "status": "success",
            "method": "card",
            "order": {
                "product_name": "Название продукта",
                "description": "Описание заказа"
            },
            "created_at": "2025-01-01T00:00:00Z",
            "receipt_url": "https://..."
        }
    ],
    "total_amount": 15000.00
}
```

### Реферальная программа
```json
{
    "success": true,
    "referral_link": "https://miniapp.expert/?ref=ABC123",
    "stats": {
        "total_referrals": 3,
        "active_referrals": 2,
        "total_earned": 1000.00,
        "total_paid": 500.00,
        "available_balance": 500.00
    },
    "referrals": [
        {
            "id": "uuid",
            "referred_user": {
                "email": "user@example.com",
                "name": "Имя пользователя"
            },
            "status": "active",
            "total_earned": 500.00,
            "paid_out": 0.00,
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

## Обработка ошибок

### Ошибки загрузки данных
- При ошибке загрузки профиля показывается "Ошибка загрузки"
- При ошибке загрузки продуктов показывается сообщение об ошибке
- При ошибке загрузки платежей показывается сообщение об ошибке
- При ошибке загрузки рефералов устанавливаются значения по умолчанию (0)

### Ошибки API
- Ошибки логируются в консоль
- Пользователю показываются понятные сообщения об ошибках
- При ошибке аутентификации (401) пользователь перенаправляется на страницу входа

## Безопасность

- Все запросы к API требуют JWT токен
- Токен хранится в `localStorage` и добавляется в заголовок `Authorization`
- При истечении токена пользователь перенаправляется на страницу входа

## Производительность

- Данные загружаются параллельно при инициализации
- Данные перезагружаются только при переключении секций
- Иконки Lucide обновляются периодически для динамического контента

## Тестирование

Для тестирования можно использовать следующие данные:

1. **Вход в систему**: Используйте существующего пользователя или создайте нового
2. **Проверка загрузки данных**: Откройте консоль браузера и проверьте запросы к API
3. **Проверка обработки ошибок**: Отключите API или измените URL и проверьте обработку ошибок

## Дальнейшие улучшения

1. **Кэширование данных**: Добавить кэширование данных на клиенте
2. **Автообновление**: Добавить автоматическое обновление данных через WebSocket или polling
3. **Оптимистичные обновления**: Обновлять UI до получения ответа от API
4. **Пагинация**: Добавить пагинацию для больших списков
5. **Фильтрация и сортировка**: Добавить фильтрацию и сортировку данных

