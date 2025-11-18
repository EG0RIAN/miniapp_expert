# 🚀 MiniApp Expert - Локальная Разработка

Makefile для запуска всего проекта локально одной командой.

## 📋 Требования

- **Docker** и **Docker Compose** (для PostgreSQL и PocketBase)
- **Python 3.11+**
- **Node.js 18+** и **npm** (для сборки Tailwind CSS)
- **Redis** (опционально, если нужен Celery)

---

## ⚡ Быстрый старт

```bash
# 1. Установить все зависимости
make install

# 2. Запустить все сервисы
make start-all
```

Готово! 🎉

**Доступные URLs:**
- Frontend: http://localhost:1234
- Django API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin/
- PostgreSQL: `localhost:5432`
- PocketBase: http://localhost:8090

---

## 📚 Основные команды

### Управление сервисами

```bash
make start-all      # Запустить все сервисы (DB, Redis, Backend, Celery, Frontend)
make stop-all       # Остановить все сервисы
make restart-all    # Перезапустить все сервисы
make status         # Показать статус всех сервисов
```

### Отдельные сервисы

```bash
make start-db       # Только PostgreSQL + PocketBase
make start-backend  # Только Django API (Gunicorn)
make start-frontend # Только frontend (HTTP сервер на порту 1234)
make start-celery   # Только Celery worker + beat
make start-redis    # Только Redis
```

### База данных

```bash
make migrate              # Применить миграции
make makemigrations       # Создать новые миграции
make createsuperuser      # Создать суперпользователя
make reset-db             # Полностью сбросить БД (удалит все данные!)
```

### Разработка

```bash
make shell          # Django shell
make logs-backend   # Логи Django
make logs-access    # Access логи
make logs-celery    # Celery логи
make test           # Запустить тесты
make build-css      # Собрать Tailwind CSS
```

### Очистка

```bash
make clean          # Удалить временные файлы, логи, __pycache__
```

---

## 🔧 Конфигурация

### Автоматическая настройка `.env`

При первом запуске `make start-all` автоматически создается `.env` файл в `api-django/` со всеми необходимыми настройками:

- `SECRET_KEY` (случайный)
- `DEBUG=True`
- База данных: `postgresql://miniuser:minipass@localhost:5432/miniapp`
- T-Bank credentials (тестовые)
- `MAGIC_SECRET` (случайный)
- CORS для `localhost:1234`
- SMTP настройки

**Если нужно изменить настройки**, отредактируйте `api-django/.env` вручную и перезапустите сервисы.

---

## 🐳 Docker Services

Makefile использует `docker-compose.yml` для запуска:

1. **PostgreSQL 15** (порт 5432)
   - Database: `miniapp`
   - User: `miniuser`
   - Password: `minipass`

2. **PocketBase** (порт 8090)
   - Admin: http://localhost:8090/_/

3. **Redis** (порт 6379, опционально)
   - Для Celery background tasks

---

## 📁 Структура проекта

```
rello/
├── api-django/          # Django REST API
│   ├── apps/            # Django приложения
│   ├── miniapp_api/     # Основной модуль
│   ├── requirements.txt
│   ├── manage.py
│   └── .env             # Создается автоматически
├── site/                # Статический frontend
│   ├── index.html
│   ├── cabinet.html
│   ├── payment.html
│   └── ...
├── docker-compose.yml   # Docker конфигурация
├── Makefile            # Команды для разработки
└── README_LOCAL_DEV.md # Эта документация
```

---

## 🛠️ Типичные сценарии

### Первый запуск проекта

```bash
# 1. Клонировать репо (уже сделано)
cd /path/to/rello

# 2. Установить зависимости
make install

# 3. Запустить все
make start-all

# 4. Создать суперпользователя для админки
make createsuperuser

# 5. Открыть в браузере
open http://localhost:1234
```

### Работа с миграциями

```bash
# После изменения models.py
make makemigrations
make migrate
```

### Пересборка CSS

```bash
# После изменения site/src/input.css или HTML с Tailwind классами
make build-css
```

### Перезапуск backend после изменений

```bash
make stop-backend
make start-backend

# Или
make restart-all
```

### Просмотр логов

```bash
# В отдельных терминалах
make logs-backend
make logs-access
make logs-celery
```

---

## 🐛 Решение проблем

### PostgreSQL не запускается

```bash
# Проверить Docker
docker ps -a

# Пересоздать контейнер
docker-compose down -v
docker-compose up -d postgres
```

### Gunicorn не запускается

```bash
# Проверить логи
cat api-django/logs/error.log

# Проверить порт 8000
lsof -i :8000

# Убить процесс вручную
pkill -f gunicorn
make start-backend
```

### "Port already in use"

```bash
# Frontend (1234)
lsof -ti:1234 | xargs kill -9

# Backend (8000)
lsof -ti:8000 | xargs kill -9

# PostgreSQL (5432)
docker-compose stop postgres
docker-compose start postgres
```

### Celery не работает

```bash
# Убедитесь, что Redis запущен
docker ps | grep redis

# Перезапустить Celery
make stop-celery
make start-celery
```

### "ModuleNotFoundError" в Django

```bash
# Переустановить зависимости в venv
cd api-django
. venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 Credentials по умолчанию

### PostgreSQL
- Host: `localhost`
- Port: `5432`
- Database: `miniapp`
- User: `miniuser`
- Password: `minipass`

### Django Admin
Создайте через:
```bash
make createsuperuser
```

### T-Bank (тестовый терминал)
- Terminal: `1760898345975`
- Password: `6dhspXy8F7ql$PgJ`
- API URL: `https://securepay.tinkoff.ru/v2`

---

## 📊 Monitoring

### Проверить статус всех сервисов

```bash
make status
```

Вывод:
```
Service Status:

Docker Containers:
NAME                 STATUS
miniapp_postgres     Up 2 hours (healthy)
miniapp_pocketbase   Up 2 hours

Backend (Gunicorn):
  ✓ Running (PID: 12345)

Celery Worker:
  ✓ Running

Celery Beat:
  ✓ Running

Frontend:
  ✓ Running
```

---

## 🚀 Production

**Важно:** Makefile предназначен для **локальной разработки**.

Для production используйте скрипты в `deploy-configs/`:
- `one-command-deploy.sh` - полный деплой на сервер
- `setup-nginx.sh` - настройка Nginx
- `setup-ssl.sh` - настройка SSL

---

## 📝 Полезные ссылки

- **Django Admin**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/
- **Frontend**: http://localhost:1234/index.html
- **Cabinet**: http://localhost:1234/cabinet.html
- **Payment**: http://localhost:1234/payment.html

---

## ❓ FAQ

**Q: Почему не используется Docker для Django?**  
A: На сервере Django работает через systemd/gunicorn на хосте. Для консистентности локально делаем так же. Dockerfile есть, но не используется.

**Q: Как запустить в фоне?**  
A: Все сервисы уже запускаются в фоне (daemon/detach режим).

**Q: Как остановить все?**  
A: `make stop-all`

**Q: Нужен ли Celery для локальной разработки?**  
A: Опционально. Если работаете с рекуррентными платежами или фоновыми задачами — да. Иначе можно не запускать (`make start-all` запускает автоматически).

---

**Автор:** MiniApp Expert Team  
**Дата:** 2025-11-14


