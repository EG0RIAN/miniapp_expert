#!/bin/bash

echo "🔧 Завершение установки..."

expect << 'EOFMAIN'
set timeout 900
spawn ssh root@85.198.110.66

expect {
    "password:" { send "h421-5882p7vUqkFn+EF\r" }
    "yes/no" { send "yes\r"; exp_continue }
}

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "git pull origin main\r"

expect "# "
send "cp deploy-configs/nginx-demoapp.conf /etc/nginx/sites-available/demoapp.miniapp.expert\r"

expect "# "
send "nginx -t\r"

expect "# "
send "systemctl reload nginx\r"

expect "# "
send "echo 'ð SSL сертификаты...'\r"

expect "# "
send "certbot --nginx -d miniapp.expert -d www.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "certbot --nginx -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect\r"

expect -timeout 300 "# "
send "systemctl enable certbot.timer\r"

expect "# "
send "systemctl start certbot.timer\r"

expect "# "
send "echo 'ð¤ Установка бота...'\r"

expect "# "
send "apt-get install -y python3-venv\r"

expect -timeout 300 "# "
send "cd /home/miniapp_expert/bot\r"

expect "# "
send "python3 -m venv venv\r"

expect "# "
send "source venv/bin/activate && pip install --upgrade pip -q && pip install -r requirements.txt -q\r"

expect -timeout 300 "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "cd bot && pm2 start bot.py --name miniapp-bot --interpreter ./venv/bin/python\r"

expect "# "
send "pm2 save\r"

expect "# "
send "pm2 startup systemd -u root --hp /root\r"

expect "# "
send "cd /home/miniapp_expert\r"

expect "# "
send "echo ''\r"
send "echo '================================'\r"
send "echo '✅ ВСЁ ГОТОВО!'\r"
send "echo '================================'\r"
send "echo ''\r"

expect "# "
send "echo 'ð Ваши сайты:'\r"
send "echo 'https://miniapp.expert'\r"
send "echo 'https://www.miniapp.expert'\r"
send "echo 'https://demoapp.miniapp.expert'\r"
send "echo ''\r"

expect "# "
send "systemctl status nginx --no-pager | head -3\r"

expect "# "
send "echo ''\r"
send "pm2 list\r"

expect "# "
send "exit\r"

expect eof
EOFMAIN

echo ""
echo "✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo ""
echo "🌐 Проверьте сайты:"
echo "   https://miniapp.expert"
echo "   https://www.miniapp.expert"
echo "   https://demoapp.miniapp.expert"
echo ""







