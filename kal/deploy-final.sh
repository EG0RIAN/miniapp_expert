#!/bin/bash

# Финальная установка MiniApp Expert
SERVER="85.198.110.66"
USER="root"
PASSWORD="h421-5882p7vUqkFn+EF"
BOT_TOKEN="8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY"

echo "🚀 Установка MiniApp Expert"
echo "=============================="
echo "Сервер: $SERVER"
echo ""

# Шаг 1: Загрузка
echo "📤 Загрузка файлов на сервер..."
expect << EOF
set timeout 300
spawn scp miniapp-deploy.tar.gz ${USER}@${SERVER}:/home/miniapp_expert/
expect {
    "password:" { send "${PASSWORD}\r" }
    "yes/no" { send "yes\r"; exp_continue }
}
expect eof
EOF

if [ $? -eq 0 ]; then
    echo "✅ Файлы загружены"
else
    echo "❌ Ошибка загрузки"
    exit 1
fi

echo ""
echo "🔧 Установка на сервере (5-10 минут)..."
echo ""

# Шаг 2: Установка через SSH
expect << 'EOFMAIN'
set timeout 900
set SERVER "85.198.110.66"
set USER "root"
set PASSWORD "h421-5882p7vUqkFn+EF"

spawn ssh ${USER}@${SERVER}

expect {
    "password:" { send "${PASSWORD}\r" }
    "yes/no" { send "yes\r"; exp_continue }
}

expect "# " {
    send "cd /home/miniapp_expert\r"
}

expect "# " {
    send "tar -xzf miniapp-deploy.tar.gz\r"
}

expect "# " {
    send "chmod +x deploy-configs/*.sh\r"
}

expect "# " {
    send "echo 'BOT_TOKEN=8395636611:AAH6MAKtZORX_8e9GcxbMvJcnu0D37LCTEY' > bot/.env\r"
}

expect "# " {
    send "echo 'WEBAPP_URL=https://demoapp.miniapp.expert' >> bot/.env\r"
}

expect "# " {
    send "echo '📦 Установка системных пакетов...'\r"
}

expect "# " {
    send "./deploy-configs/full-setup.sh\r"
}

expect {
    "# " {
        send "echo '🌐 Настройка nginx...'\r"
    }
    timeout {
        send "\r"
        exp_continue
    }
}

expect "# " {
    send "./deploy-configs/setup-nginx.sh\r"
}

expect {
    "# " {
        send "echo '🔒 Настройка SSL...'\r"
    }
    timeout {
        send "\r"
        exp_continue
    }
}

expect "# " {
    send "./deploy-configs/setup-ssl.sh\r"
}

expect {
    "# " {
        send "echo '🤖 Запуск бота...'\r"
    }
    timeout {
        send "\r"
        exp_continue
    }
}

expect "# " {
    send "./deploy-configs/bot-setup.sh\r"
}

expect {
    "# " {
        send "echo ''\r"
    }
    timeout {
        send "\r"
        exp_continue
    }
}

expect "# " {
    send "echo '================================'\r"
    send "echo '✅ УСТАНОВКА ЗАВЕРШЕНА!'\r"
    send "echo '================================'\r"
    send "echo ''\r"
    send "echo 'Ваши сайты:'\r"
    send "echo '🌐 https://miniapp.expert'\r"
    send "echo '🌐 https://www.miniapp.expert'\r"
    send "echo '📱 https://demoapp.miniapp.expert'\r"
    send "echo ''\r"
    send "echo 'Проверка сервисов:'\r"
}

expect "# " {
    send "systemctl status nginx --no-pager -l | head -10\r"
}

expect "# " {
    send "echo ''\r"
    send "pm2 list\r"
}

expect "# " {
    send "exit\r"
}

expect eof
EOFMAIN

echo ""
echo "================================"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "================================"
echo ""
echo "🌐 Сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""

