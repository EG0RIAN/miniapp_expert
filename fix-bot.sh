#!/bin/bash

expect << 'EOF'
set timeout 600
spawn ssh root@85.198.110.66

expect "password:"
send "h421-5882p7vUqkFn+EF\r"

expect "# "
send "cd /home/miniapp_expert/bot\r"

expect "# "
send "python3 -m venv venv\r"

expect "# "
send "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt\r"

expect -timeout 300 "# "
send "pm2 delete miniapp-bot\r"

expect "# "
send "pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python\r"

expect "# "
send "pm2 save\r"

expect "# "
send "pm2 list\r"

expect "# "
send "pm2 logs miniapp-bot --lines 20 --nostream\r"

expect "# "
send "exit\r"

expect eof
EOF

echo "✅ Бот исправлен!"




