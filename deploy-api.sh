#!/bin/bash

echo "🚀 Deploying Payment API to server"
echo "=================================="
echo ""

expect << 'EOF'
set timeout 300
spawn ssh root@YOUR_SERVER_IP
expect "password:"
send "YOUR_SERVER_PASSWORD\r"
expect "# "

# Go to project directory
send "cd /home/miniapp_expert\r"
expect "# "

# Pull latest code
send "git pull origin main\r"
expect "# "

# Install Node.js if not installed
send "which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)\r"
expect "# "

# Go to API directory
send "cd /home/miniapp_expert/api\r"
expect "# "

# Install dependencies
send "npm install\r"
expect "# "

# Create .env file
send "cat > .env << 'ENVEOF'
TBANK_TERMINAL_KEY=
TBANK_PASSWORD=
PORT=3001
NODE_ENV=production
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>
MAGIC_SECRET=
ENVEOF\r"
expect "# "

# Create logs directory
send "mkdir -p logs\r"
expect "# "

# Install PM2 if not installed
send "which pm2 || npm install -g pm2\r"
expect "# "

# Stop old instance if running
send "pm2 stop miniapp-api || true\r"
expect "# "

# Start with PM2
send "pm2 start ecosystem.config.js\r"
expect "# "

# Save PM2 configuration
send "pm2 save\r"
expect "# "

# Setup PM2 startup
send "pm2 startup systemd -u root --hp /root || true\r"
expect "# "

# Show status
send "pm2 status\r"
expect "# "

# Check API health
send "sleep 3 && curl http://localhost:3001/api/health\r"
expect "# "

send "echo '\n✅ API deployed successfully!'\r"
expect "# "
send "echo 'API URL: https://miniapp.expert/api'\r"
expect "# "
send "echo 'Health check: https://miniapp.expert/api/health'\r"
expect "# "

send "exit\r"
expect eof
EOF

echo ""
echo "✅ API Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "1. Configure nginx to proxy /api/ to localhost:3001"
echo "2. Test health endpoint: https://miniapp.expert/api/health"
echo "3. Update site/payment.html to use backend API"
echo ""

