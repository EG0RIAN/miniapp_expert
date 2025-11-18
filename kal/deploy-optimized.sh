#!/bin/bash

echo "🚀 Deploying PageSpeed-optimized version to miniapp.expert"
echo ""

# SSH to server and deploy
expect << 'EOF'
set timeout 300
spawn ssh root@85.198.110.66
expect "password:"
send "h421-5882p7vUqkFn+EF\r"
expect "# "
send "cd /home/miniapp_expert && git pull origin main\r"
expect "# "
send "cd /home/miniapp_expert/site && npm install\r"
expect "# "
send "cd /home/miniapp_expert/site && npm run build:css\r"
expect "# "
send "cd /home/miniapp_expert/site && node optimize-html.js\r"
expect "# "
send "cd /home/miniapp_expert/site && cp index.html index.html.backup && mv index-optimized.html index.html\r"
expect "# "
send "cd /home/miniapp_expert && cp -r site/* /var/www/miniapp.expert/\r"
expect "# "
send "systemctl reload nginx\r"
expect "# "
send "echo '\n✅ Deployment complete!'\r"
expect "# "
send "echo 'Test: https://miniapp.expert/'\r"
expect "# "
send "echo 'Run Lighthouse audit on mobile device'\r"
expect "# "
send "exit\r"
expect eof
EOF

echo ""
echo "✅ Optimized version deployed!"
echo ""
echo "📊 Next steps:"
echo "1. Open https://miniapp.expert/ in Chrome"
echo "2. Open DevTools → Lighthouse"
echo "3. Select 'Mobile' and 'Performance'"
echo "4. Click 'Analyze page load'"
echo "5. Verify Performance Score ≥ 90"
echo ""
echo "📱 Test on real mobile device:"
echo "   - Open https://miniapp.expert/ on Android/iOS"
echo "   - Check load speed and interactivity"
echo ""

