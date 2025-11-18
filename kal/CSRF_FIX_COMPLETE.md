# Полное исправление ошибки CSRF

## Проблема

При попытке войти или зарегистрироваться возникала ошибка "❌ CSRF Failed: CSRF token missing."

## Причины

1. **CSRF middleware** блокировал все POST запросы без CSRF токена
2. **SessionAuthentication** в REST Framework требовал CSRF токен
3. **Декораторы `@csrf_exempt`** не работали должным образом из-за порядка middleware

## Решение

### 1. Создан кастомный middleware для отключения CSRF для API

Создан файл `api-django/apps/users/middleware.py`:

```python
class DisableCSRFForAPI(MiddlewareMixin):
    """
    Middleware to disable CSRF protection for API endpoints.
    This allows API calls from frontend without CSRF tokens.
    """
    
    def process_request(self, request):
        # Disable CSRF for all /api/ endpoints
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
```

### 2. Middleware добавлен в settings.py

Добавлен в `MIDDLEWARE` перед `CsrfViewMiddleware`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'apps.users.middleware.DisableCSRFForAPI',  # Must be before CsrfViewMiddleware
    'django.middleware.csrf.CsrfViewMiddleware',
    ...
]
```

### 3. Удален SessionAuthentication из REST Framework

Удален `SessionAuthentication` из `DEFAULT_AUTHENTICATION_CLASSES`, так как он требует CSRF токен:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # SessionAuthentication removed to avoid CSRF issues
    ),
    ...
}
```

### 4. Декораторы @csrf_exempt оставлены для дополнительной защиты

Декораторы `@csrf_exempt` оставлены на `LoginView` и `RegisterView` для дополнительной защиты:

```python
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    ...

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    ...
```

## Результат

✅ CSRF защита отключена для всех `/api/` endpoints  
✅ Вход работает без ошибки CSRF  
✅ Регистрация работает без ошибки CSRF  
✅ CSRF защита остается активной для Django Admin и других endpoints  
✅ Используется только JWT аутентификация для API  

## Тестирование

После применения изменений:
1. Вход через `/api/auth/login/` работает без CSRF токена
2. Регистрация через `/api/auth/register/` работает без CSRF токена
3. Django Admin остается защищенным CSRF
4. Другие endpoints также защищены CSRF

## Файлы изменены

- `api-django/apps/users/middleware.py` - создан новый middleware
- `api-django/miniapp_api/settings.py` - добавлен middleware и удален SessionAuthentication
- `api-django/apps/users/views.py` - оставлены декораторы `@csrf_exempt` для дополнительной защиты

## Примечания

- Middleware должен быть добавлен ПЕРЕД `CsrfViewMiddleware` в списке `MIDDLEWARE`
- CSRF защита отключена только для путей, начинающихся с `/api/`
- Django Admin и другие endpoints остаются защищенными CSRF
- Используется только JWT аутентификация для API endpoints
- Это стандартный подход для REST API с JWT аутентификацией

## Безопасность

Отключение CSRF для API endpoints безопасно, потому что:
1. Используется JWT аутентификация вместо сессий
2. Токены имеют ограниченный срок действия
3. API endpoints требуют аутентификации (кроме login/register)
4. Django Admin и другие endpoints остаются защищенными CSRF

