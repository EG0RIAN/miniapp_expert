# 🚀 Deploy MiniApp Expert in 3 Commands

## Server Info
- **IP**: 195.2.73.224
- **User**: root  
- **Password**: h374w#54EeCTWYLu_qRA
- **Directory**: /home/miniapp_expert

## Domains
- miniapp.expert + www.miniapp.expert → Static site
- demoapp.miniapp.expert → React Mini App

---

## Deploy Now (3 Commands)

### 1️⃣ Build and Package
```bash
./connect-and-deploy.sh
```

### 2️⃣ Upload to Server
```bash
scp miniapp-deploy.tar.gz root@195.2.73.224:/home/miniapp_expert/
```

### 3️⃣ Deploy on Server
```bash
ssh root@195.2.73.224

# Then on server:
cd /home/miniapp_expert
tar -xzf miniapp-deploy.tar.gz
chmod +x deploy-configs/one-command-deploy.sh
./deploy-configs/one-command-deploy.sh
```

**That's it!** ✅

---

## What Gets Deployed

### Static Site (miniapp.expert)
- Marketing landing page
- SSL certificate (HTTPS)
- Located in: `/var/www/miniapp.expert/`

### React App (demoapp.miniapp.expert)
- Telegram Mini App
- SSL certificate (HTTPS)
- Located in: `/var/www/demoapp.miniapp.expert/`

### Infrastructure
- ✅ Nginx web server
- ✅ Let's Encrypt SSL (auto-renews)
- ✅ Firewall configured
- ✅ PM2 process manager
- ✅ Node.js environment

---

## After Deployment

### Setup Telegram Bot (Optional)

```bash
# On server
cd /home/miniapp_expert/bot
nano .env

# Add:
BOT_TOKEN=your_token_here
WEBAPP_URL=https://demoapp.miniapp.expert

# Then:
cd /home/miniapp_expert
./deploy-configs/bot-setup.sh
```

### Verify Everything

```bash
# Check websites
curl -I https://miniapp.expert
curl -I https://demoapp.miniapp.expert

# Check SSL
certbot certificates

# Check nginx
systemctl status nginx

# Check bot (after bot-setup.sh)
pm2 status
```

---

## Update After Changes

```bash
# 1. Local: Build new version
./connect-and-deploy.sh

# 2. Upload
scp miniapp-deploy.tar.gz root@195.2.73.224:/home/miniapp_expert/

# 3. Server: Extract and reload
ssh root@195.2.73.224
cd /home/miniapp_expert
tar -xzf miniapp-deploy.tar.gz
cp -r dist/* /var/www/demoapp.miniapp.expert/
cp -r site/* /var/www/miniapp.expert/
systemctl reload nginx
```

---

## Troubleshooting

### Site not loading?
```bash
# Check nginx errors
tail -f /var/log/nginx/error.log

# Restart nginx
systemctl restart nginx
```

### SSL issues?
```bash
# Renew certificates
certbot renew --force-renewal

# Check status
certbot certificates
```

### Bot not working?
```bash
# View logs
pm2 logs miniapp-bot

# Restart
pm2 restart miniapp-bot
```

---

## Files Created

- `deploy-to-server.sh` - Automated deployment from local
- `connect-and-deploy.sh` - Build and prepare package
- `deploy-configs/` - All server configuration scripts
  - `full-setup.sh` - Initial server setup
  - `setup-nginx.sh` - Configure web server
  - `setup-ssl.sh` - Install SSL certificates
  - `bot-setup.sh` - Setup Telegram bot
  - `one-command-deploy.sh` - Deploy everything at once
  - `nginx-miniapp.conf` - Nginx config for static site
  - `nginx-demoapp.conf` - Nginx config for React app

---

## Support

📖 **Detailed Guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)  
⚡ **Quick Start**: See [QUICK_START.md](QUICK_START.md)

---

**Ready to deploy?** Run `./connect-and-deploy.sh` to start! 🚀

