# 🔧 КАК ИСПРАВИТЬ ОШИБКУ "Load failed"

## ❌ Проблема

```
Произошла ошибка: Load failed
```

Это **CORS** - браузер блокирует запросы к API с другого домена.

---

## ✅ Решение: Настройте CORS на backend

### 📋 Пошаговая инструкция:

---

### 1️⃣ Перейдите в папку Django проекта

```bash
cd /путь/к/вашему/django/проекту
# Например: cd ~/projects/arkhiptsev.com
```

---

### 2️⃣ Установите django-cors-headers

```bash
pip install django-cors-headers
```

---

### 3️⃣ Откройте settings.py

```bash
nano settings.py
# или
code settings.py
```

---

### 4️⃣ Добавьте 'corsheaders' в INSTALLED_APPS

Найдите `INSTALLED_APPS` и добавьте `'corsheaders'`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Ваши приложения
    'leads',
    
    # Добавьте это:
    'corsheaders',  # ← ДОБАВЬТЕ ЭТУ СТРОКУ
]
```

---

### 5️⃣ Добавьте CorsMiddleware в MIDDLEWARE

Найдите `MIDDLEWARE` и добавьте `'corsheaders.middleware.CorsMiddleware'` **ПЕРВЫМ**:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← ДОБАВЬТЕ ПЕРВЫМ!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

---

### 6️⃣ Добавьте настройки CORS

В конце `settings.py` добавьте:

```python
# CORS настройки для Telegram Mini App
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.ngrok-free\.app$',  # Все ngrok-free.app домены
    r'^https://.*\.ngrok\.app$',       # Все ngrok.app домены
    r'^http://localhost:\d+$',         # localhost для разработки
]

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
]

CORS_ALLOW_CREDENTIALS = True
```

---

### 7️⃣ Сохраните и перезапустите Django

```bash
# Сохраните файл (Ctrl+O, Enter, Ctrl+X в nano)

# Перезапустите Django
python manage.py runserver

# Или если через gunicorn:
sudo systemctl restart your-django-service
```

---

## 🧪 Тестирование

### 1. Проверьте что CORS работает

```bash
curl -I -X OPTIONS https://arkhiptsev.com/api/leads/create/ \
  -H "Origin: https://4afc8c95c055.ngrok-free.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Должны увидеть:
```
Access-Control-Allow-Origin: https://4afc8c95c055.ngrok-free.app
Access-Control-Allow-Headers: authorization, content-type
```

### 2. Протестируйте форму

1. Откройте Mini App: `https://4afc8c95c055.ngrok-free.app`
2. Откройте консоль (F12)
3. Заполните форму: `+79991234567`
4. Нажмите "Отправить"

### 3. Проверьте консоль

Должно быть:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 ОТПРАВКА ЗАЯВКИ НАПРЯМУЮ НА API
📡 Отправка на API...
📡 Response status: 201
✅ Успешный ответ от API: {success: true, lead_id: 15}
✅ Заявка создана! ID: 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Проверьте админку

https://arkhiptsev.com/ru/admin/leads/lead/

Должна появиться заявка #15!

---

## ❌ Если всё равно не работает

### Ошибка 1: "CORS policy" в консоли

**Решение:**
- Проверьте что `corsheaders` в `INSTALLED_APPS`
- Проверьте что `CorsMiddleware` **ПЕРВЫЙ** в `MIDDLEWARE`
- Проверьте что Django перезапущен

### Ошибка 2: "401 Unauthorized"

**Решение:**
- Проверьте токен в `.env`
- Должен быть: `O2EZjvewEsiLytylbDT7ioDiJLheh2cZJDWuqQvtYmtW1BZetj7ylKimJBQUTTqM`

### Ошибка 3: "403 Forbidden"

**Решение:**
- Токен неправильный или неактивный
- Проверьте в админке Django: `/admin/leads/apitoken/`

---

## 💡 Альтернатива: Разрешить все домены (только для разработки!)

Если CORS всё равно не работает, временно разрешите все:

```python
# settings.py (только для разработки!)
CORS_ALLOW_ALL_ORIGINS = True
```

⚠️ **НЕ используйте это в production!**

---

## 📊 Итоговый settings.py

```python
# settings.py

INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

# Для разработки с ngrok:
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.ngrok-free\.app$',
]

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
]

# Или для быстрого теста (только разработка!):
# CORS_ALLOW_ALL_ORIGINS = True
```

---

## 🎊 После настройки CORS

Всё заработает:
- ✅ Форма отправится
- ✅ Данные попадут в CRM
- ✅ Появится страница "Успех"
- ✅ `first_name` и `last_name` из Telegram профиля

Никакой бот не нужен! 🚀
