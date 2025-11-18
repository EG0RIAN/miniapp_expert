# Исправление ошибки CSRF при регистрации

## Проблема

При попытке зарегистрироваться на странице https://miniapp.expert/login.html возникала ошибка 403 (Forbidden) из-за CSRF защиты Django.

## Причина

Django REST Framework по умолчанию требует CSRF токен для POST запросов, даже для API endpoints. Когда запрос приходит из браузера без CSRF токена, Django блокирует его с ошибкой 403.

В логах было видно:
```
127.0.0.1 - - [10/Nov/2025:21:33:38 +0300] "POST /api/auth/register/ HTTP/1.0" 403 45 "https://miniapp.expert/login.html" "Mozilla/5.0 ..."
```

## Решение

### 1. Отключение CSRF для API endpoints

Добавлен декоратор `@csrf_exempt` для `LoginView` и `RegisterView`:

```python
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    permission_classes = [AllowAny]
    ...

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    ...
```

### 2. Улучшена обработка ошибок на фронтенде

Добавлена более детальная обработка ошибок:
- Проверка статуса ответа перед парсингом JSON
- Обработка разных типов ошибок (403, 400, 500)
- Информативные сообщения об ошибках на русском языке
- Логирование ошибок в консоль для отладки

### 3. Добавлены заголовки запроса

Добавлены заголовки для корректной работы с API:
- `Content-Type: application/json`
- `Accept: application/json`
- `credentials: same-origin`

## Тестирование

Регистрация протестирована и работает корректно:

1. **Успешная регистрация:**
   - ✅ Запрос проходит без ошибки 403
   - ✅ Создается пользователь
   - ✅ Генерируются JWT токены
   - ✅ Пользователь автоматически входит в систему

2. **Обработка ошибок:**
   - ✅ Ошибка 403 - показывается понятное сообщение
   - ✅ Ошибка 400 - показывается сообщение о некорректных данных
   - ✅ Ошибка 500 - показывается сообщение об ошибке сервера
   - ✅ Ошибки парсинга JSON - обрабатываются корректно

## Файлы изменены

- `api-django/apps/users/views.py` - добавлен `@csrf_exempt` для `LoginView` и `RegisterView`
- `site/login.html` - улучшена обработка ошибок на фронтенде

## Результат

✅ Регистрация работает без ошибки 403  
✅ CSRF защита отключена для API endpoints  
✅ Обработка ошибок улучшена  
✅ Информативные сообщения об ошибках на русском языке  
✅ Запросы из браузера проходят успешно  

## Примечания

- CSRF отключен только для API endpoints (`/api/auth/login/` и `/api/auth/register/`)
- Для других endpoints CSRF защита остается активной
- Используется JWT аутентификация, которая не требует CSRF токенов
- API endpoints используют `AllowAny` permission, что позволяет регистрацию без аутентификации

## Альтернативное решение

Вместо `@csrf_exempt` можно было бы:
1. Использовать `@csrf_exempt` только для определенных методов
2. Настроить DRF для автоматического исключения API endpoints из CSRF
3. Использовать CSRF токены в запросах (более безопасно, но сложнее)

Текущее решение (отключение CSRF для API endpoints) является стандартным подходом для REST API с JWT аутентификацией.

