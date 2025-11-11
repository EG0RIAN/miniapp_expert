#!/bin/bash
# Скрипт для создания суперпользователя Django

set -e

echo "🔐 Создание суперпользователя Django..."

# Параметры по умолчанию
EMAIL="${ADMIN_EMAIL:-admin@miniapp.expert}"
PASSWORD="${ADMIN_PASSWORD:-admin123}"
NAME="${ADMIN_NAME:-Admin}"

# Проверка, запущен ли через Docker
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "Запуск в Docker контейнере..."
    python manage.py shell << EOF
from apps.users.models import User
import sys

# Проверяем, существует ли пользователь
if User.objects.filter(email='$EMAIL').exists():
    user = User.objects.get(email='$EMAIL')
    user.set_password('$PASSWORD')
    user.is_staff = True
    user.is_superuser = True
    user.role = 'admin'
    user.save()
    print(f'✅ Пользователь {EMAIL} обновлен (пароль изменен, права админа добавлены)')
else:
    User.objects.create_superuser(
        email='$EMAIL',
        password='$PASSWORD',
        name='$NAME'
    )
    print(f'✅ Суперпользователь {EMAIL} создан!')
    print(f'📧 Email: {EMAIL}')
    print(f'🔑 Password: {PASSWORD}')
EOF
else
    # Локальный запуск
    echo "Локальный запуск..."
    
    # Проверяем наличие виртуального окружения
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    python manage.py shell << EOF
from apps.users.models import User
import sys

# Проверяем, существует ли пользователь
if User.objects.filter(email='$EMAIL').exists():
    user = User.objects.get(email='$EMAIL')
    user.set_password('$PASSWORD')
    user.is_staff = True
    user.is_superuser = True
    user.role = 'admin'
    user.save()
    print(f'✅ Пользователь {EMAIL} обновлен (пароль изменен, права админа добавлены)')
else:
    User.objects.create_superuser(
        email='$EMAIL',
        password='$PASSWORD',
        name='$NAME'
    )
    print(f'✅ Суперпользователь {EMAIL} создан!')
    print(f'📧 Email: {EMAIL}')
    print(f'🔑 Password: {PASSWORD}')
EOF
fi

echo ""
echo "🎉 Готово! Теперь вы можете зайти в админку:"
echo "   URL: https://miniapp.expert/admin/"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"

