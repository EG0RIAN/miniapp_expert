#!/bin/bash
# Скрипт для деплоя TOTP (Google Authenticator) для админки

set -e

SERVER="root@85.198.110.66"
SERVER_PASS="h421-5882p7vUqkFn+EF"
PROJECT_DIR="/home/miniapp_expert/api-django"

echo "🚀 Деплой TOTP для админки..."

# Загружаем файлы
echo "📦 Загрузка файлов..."
sshpass -p "$SERVER_PASS" scp -r api-django/apps/users/totp_services.py $SERVER:$PROJECT_DIR/apps/users/
sshpass -p "$SERVER_PASS" scp -r api-django/apps/users/admin_totp_views.py $SERVER:$PROJECT_DIR/apps/users/
sshpass -p "$SERVER_PASS" scp -r api-django/apps/users/admin_views_custom.py $SERVER:$PROJECT_DIR/apps/users/
sshpass -p "$SERVER_PASS" scp -r api-django/apps/users/admin.py $SERVER:$PROJECT_DIR/apps/users/
sshpass -p "$SERVER_PASS" scp -r api-django/apps/users/models.py $SERVER:$PROJECT_DIR/apps/users/
sshpass -p "$SERVER_PASS" scp -r api-django/miniapp_api/admin.py $SERVER:$PROJECT_DIR/miniapp_api/
sshpass -p "$SERVER_PASS" scp -r api-django/miniapp_api/settings.py $SERVER:$PROJECT_DIR/miniapp_api/
sshpass -p "$SERVER_PASS" scp -r api-django/templates/admin/setup_totp.html $SERVER:$PROJECT_DIR/templates/admin/
sshpass -p "$SERVER_PASS" scp -r api-django/templates/admin/admin_login_otp.html $SERVER:$PROJECT_DIR/templates/admin/
sshpass -p "$SERVER_PASS" scp -r api-django/requirements.txt $SERVER:$PROJECT_DIR/

echo "📥 Установка зависимостей..."
sshpass -p "$SERVER_PASS" ssh $SERVER "cd $PROJECT_DIR && source venv/bin/activate && pip install -q pyotp qrcode[pil] && echo '✅ Зависимости установлены'"

echo "🗄️  Создание миграций..."
sshpass -p "$SERVER_PASS" ssh $SERVER "cd $PROJECT_DIR && source venv/bin/activate && python manage.py makemigrations users 2>&1 | tail -10"

echo "🔄 Применение миграций..."
sshpass -p "$SERVER_PASS" ssh $SERVER "cd $PROJECT_DIR && source venv/bin/activate && python manage.py migrate users 2>&1 | tail -10"

echo "🔄 Перезапуск Gunicorn..."
sshpass -p "$SERVER_PASS" ssh $SERVER "sudo systemctl restart gunicorn && echo '✅ Gunicorn перезапущен'"

echo "✅ Деплой завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Войдите в админку: https://miniapp.expert/admin/login/"
echo "2. Настройте Google Authenticator: https://miniapp.expert/admin/setup-totp/"
echo "3. Отсканируйте QR-код в приложении Google Authenticator"
echo "4. Введите код из приложения для подтверждения"
echo "5. Теперь при входе будет запрашиваться код из Google Authenticator вместо email OTP"

