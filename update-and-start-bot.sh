#!/bin/bash

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert && git stash && git pull origin main\r"

expect "# "
send "cd bot\r"

expect "# "
send "source venv/bin/activate && pip install python-dotenv\r"

expect -timeout 300 "# "
send "pm2 delete miniapp-bot\r"

expect "# "
send "pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python\r"

expect "# "
send "pm2 save\r"

expect "# "
send "echo ''\r"
send "echo 'Статус бота:'\r"
send "pm2 list\r"

expect "# "
send "sleep 2 && pm2 logs miniapp-bot --lines 15 --nostream\r"

expect "# "
send "exit\r"

expect eof
EOF

echo ""
echo "✅ Бот обновлён и запущен!"







