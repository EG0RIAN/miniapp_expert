#!/bin/bash

# Setup and start Telegram bot with PM2

set -e

cd /home/miniapp_expert/bot

echo "🤖 Setting up Telegram bot..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env file with your bot token and configuration"
    echo ""
    echo "Example:"
    echo "BOT_TOKEN=your_bot_token_here"
    echo "WEBAPP_URL=https://demoapp.miniapp.expert"
    exit 1
fi

# Stop existing bot process if running
echo "🛑 Stopping existing bot process..."
pm2 delete miniapp-bot 2>/dev/null || true

# Start bot with PM2
echo "🚀 Starting bot with PM2..."
pm2 start bot.py --name miniapp-bot --interpreter venv/bin/python

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Bot setup completed!"
echo ""
echo "Bot status:"
pm2 status

echo ""
echo "Useful commands:"
echo "  pm2 status        - Check bot status"
echo "  pm2 logs miniapp-bot - View bot logs"
echo "  pm2 restart miniapp-bot - Restart bot"
echo "  pm2 stop miniapp-bot - Stop bot"

