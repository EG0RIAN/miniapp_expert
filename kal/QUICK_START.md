# Quick Deployment Guide

## Fastest Way to Deploy (Step by Step)

### Step 1: Prepare Locally

```bash
cd /Users/arkhiptsev/dev/rello
chmod +x connect-and-deploy.sh
./connect-and-deploy.sh
```

This will build your app and create `miniapp-deploy.tar.gz`.

### Step 2: Upload to Server

```bash
scp miniapp-deploy.tar.gz root@195.2.73.224:/home/miniapp_expert/
```

**Password**: `h374w#54EeCTWYLu_qRA`

### Step 3: Connect to Server

```bash
ssh root@195.2.73.224
```

**Password**: `h374w#54EeCTWYLu_qRA`

### Step 4: Deploy on Server

Once connected to the server, run:

```bash
cd /home/miniapp_expert
tar -xzf miniapp-deploy.tar.gz
chmod +x deploy-configs/*.sh

# Run all setup commands in sequence
./deploy-configs/full-setup.sh
./deploy-configs/setup-nginx.sh
./deploy-configs/setup-ssl.sh
```

### Step 5: Configure Bot (Optional)

```bash
cd /home/miniapp_expert/bot
nano .env
```

Add:
```
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://demoapp.miniapp.expert
```

Then:
```bash
cd /home/miniapp_expert
./deploy-configs/bot-setup.sh
```

## Done! ✅

Your sites are now live:
- 🌐 https://miniapp.expert
- 🌐 https://www.miniapp.expert
- 📱 https://demoapp.miniapp.expert

## Verify Deployment

Check sites in browser:
```bash
curl https://miniapp.expert
curl https://demoapp.miniapp.expert
```

Check SSL certificates:
```bash
certbot certificates
```

Check bot status:
```bash
pm2 status
```

## Troubleshooting

If something goes wrong, check logs:

```bash
# Nginx logs
tail -f /var/log/nginx/error.log

# Bot logs
pm2 logs miniapp-bot

# Certbot logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

## Update Later

To update the app after making changes:

1. **On local machine:**
```bash
./connect-and-deploy.sh
scp miniapp-deploy.tar.gz root@195.2.73.224:/home/miniapp_expert/
```

2. **On server:**
```bash
cd /home/miniapp_expert
tar -xzf miniapp-deploy.tar.gz
cp -r dist/* /var/www/demoapp.miniapp.expert/
cp -r site/* /var/www/miniapp.expert/
systemctl reload nginx
```

3. **To update bot:**
```bash
pm2 restart miniapp-bot
```

---

**Need help?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

