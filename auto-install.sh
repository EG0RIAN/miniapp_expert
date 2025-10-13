#!/bin/bash

# Автоматическая установка MiniApp Expert на сервер
# Этот скрипт использует expect для автоматического ввода пароля

SERVER="195.2.73.224"
USER="root"
PASSWORD="h374w#54EeCTWYLu_qRA"
REMOTE_DIR="/home/miniapp_expert"
BOT_TOKEN="8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY"

echo "🚀 Автоматическая установка MiniApp Expert"
echo "=========================================="
echo ""
echo "Сервер: $SERVER"
echo "Директория: $REMOTE_DIR"
echo ""

# Проверка наличия expect
if ! command -v expect &> /dev/null; then
    echo "❌ Утилита 'expect' не найдена. Устанавливаем..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install expect
        else
            echo "❌ Homebrew не найден. Установите expect вручную:"
            echo "   brew install expect"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y expect
    fi
fi

# Шаг 1: Загрузка пакета на сервер
echo "📤 Шаг 1: Загрузка пакета на сервер..."
expect << EOF
set timeout 300
spawn scp miniapp-deploy.tar.gz ${USER}@${SERVER}:${REMOTE_DIR}/
expect {
    "password:" {
        send "${PASSWORD}\r"
        exp_continue
    }
    "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    eof
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Пакет загружен на сервер"
else
    echo "❌ Ошибка загрузки пакета"
    exit 1
fi

# Шаг 2: Установка на сервере
echo ""
echo "🔧 Шаг 2: Установка на сервере..."
echo "Это займёт 5-10 минут..."
echo ""

expect << 'EOF'
set timeout 900
set SERVER "195.2.73.224"
set USER "root"
set PASSWORD "h374w#54EeCTWYLu_qRA"
set REMOTE_DIR "/home/miniapp_expert"
set BOT_TOKEN "8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY"

spawn ssh ${USER}@${SERVER}

expect {
    "password:" {
        send "${PASSWORD}\r"
    }
    "Are you sure you want to continue connecting" {
        send "yes\r"
        expect "password:"
        send "${PASSWORD}\r"
    }
}

expect "# " {
    send "cd ${REMOTE_DIR}\r"
}

expect "# " {
    send "tar -xzf miniapp-deploy.tar.gz\r"
}

expect "# " {
    send "chmod +x deploy-configs/*.sh\r"
}

expect "# " {
    send "echo 'BOT_TOKEN=${BOT_TOKEN}' > bot/.env\r"
}

expect "# " {
    send "echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env\r"
}

expect "# " {
    send "./deploy-configs/full-setup.sh\r"
}

expect "# " {
    send "./deploy-configs/setup-nginx.sh\r"
}

expect "# " {
    send "./deploy-configs/setup-ssl.sh\r"
}

expect "# " {
    send "./deploy-configs/bot-setup.sh\r"
}

expect "# " {
    send "systemctl status nginx --no-pager\r"
}

expect "# " {
    send "pm2 status\r"
}

expect "# " {
    send "echo ''\r"
    send "echo '================================'\r"
    send "echo 'УСТАНОВКА ЗАВЕРШЕНА!'\r"
    send "echo '================================'\r"
    send "echo 'Сайты доступны:'\r"
    send "echo 'https://miniapp.expert'\r"
    send "echo 'https://www.miniapp.expert'\r"
    send "echo 'https://demoapp.miniapp.expert'\r"
    send "echo '================================'\r"
    send "exit\r"
}

expect eof
EOF

echo ""
echo "✅ Установка завершена!"
echo ""
echo "🌐 Ваши сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""
echo "🤖 Бот запущен и работает"
echo ""

