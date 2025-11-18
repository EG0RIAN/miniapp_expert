#!/bin/bash

echo "🔄 Restarting Gunicorn on miniapp.expert"
echo ""

# SSH to server and restart Gunicorn
expect << 'EOF'
set timeout 60
spawn ssh root@85.198.110.66
expect "password:"
send "h421-5882p7vUqkFn+EF\r"
expect "# "
send "sudo systemctl restart gunicorn\r"
expect "# "
send "sleep 2\r"
expect "# "
send "sudo systemctl status gunicorn --no-pager\r"
expect "# "
send "echo '\n✅ Gunicorn restarted!'\r"
expect "# "
send "exit\r"
expect eof
EOF

echo ""
echo "✅ Gunicorn restart complete!"
echo ""
echo "📊 Check status:"
echo "   sudo systemctl status gunicorn"
echo ""

