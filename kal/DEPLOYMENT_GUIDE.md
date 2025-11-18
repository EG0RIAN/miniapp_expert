# MiniApp Expert - Deployment Guide

Complete guide for deploying the project to the production server.

## Server Information

- **Server IP**: 195.2.73.224
- **User**: root
- **Password**: h374w#54EeCTWYLu_qRA
- **Project Directory**: /home/miniapp_expert

## Domains

- **miniapp.expert** - Static marketing site
- **www.miniapp.expert** - Static marketing site (alias)
- **demoapp.miniapp.expert** - React Mini App

## Prerequisites

Before deployment, make sure:
1. DNS records are configured:
   - `miniapp.expert` → 195.2.73.224 (A record)
   - `www.miniapp.expert` → 195.2.73.224 (A record)
   - `demoapp.miniapp.expert` → 195.2.73.224 (A record)
2. Server is accessible via SSH
3. You have root access

## Deployment Steps

### Step 1: Initial Server Setup (One-time)

Connect to the server:
```bash
ssh root@195.2.73.224
```

Run the full setup script:
```bash
cd /home/miniapp_expert
chmod +x deploy-configs/full-setup.sh
./deploy-configs/full-setup.sh
```

This will:
- Update system packages
- Install Node.js, nginx, certbot
- Configure firewall
- Create necessary directories

### Step 2: Deploy Files from Local Machine

From your local machine (in the project directory):

```bash
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

This script will:
1. Build the React app locally
2. Create a deployment package
3. Upload to the server
4. Extract files in the correct locations

### Step 3: Configure Nginx

On the server:
```bash
cd /home/miniapp_expert
chmod +x deploy-configs/setup-nginx.sh
./deploy-configs/setup-nginx.sh
```

This will:
- Copy nginx configurations
- Enable sites
- Test and reload nginx

Verify sites are accessible:
- http://miniapp.expert
- http://www.miniapp.expert
- http://demoapp.miniapp.expert

### Step 4: Setup SSL Certificates

On the server:
```bash
cd /home/miniapp_expert
chmod +x deploy-configs/setup-ssl.sh
./deploy-configs/setup-ssl.sh
```

This will:
- Install SSL certificates from Let's Encrypt
- Configure auto-renewal
- Enable HTTPS redirect

Sites will now be available via HTTPS:
- https://miniapp.expert ✅
- https://www.miniapp.expert ✅
- https://demoapp.miniapp.expert ✅

### Step 5: Setup Telegram Bot

On the server:

1. First, create the `.env` file with bot configuration:
```bash
cd /home/miniapp_expert/bot
nano .env
```

Add your configuration:
```env
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://demoapp.miniapp.expert
```

2. Run the bot setup script:
```bash
cd /home/miniapp_expert
chmod +x deploy-configs/bot-setup.sh
./deploy-configs/bot-setup.sh
```

This will:
- Create Python virtual environment
- Install dependencies
- Start bot with PM2
- Configure auto-start on reboot

## Updating the Deployment

When you make changes and want to redeploy:

### Update React App or Static Site

From local machine:
```bash
./deploy-to-server.sh
```

Then on server:
```bash
systemctl reload nginx
```

### Update Bot Code

1. Upload new bot files
2. On server:
```bash
cd /home/miniapp_expert
./deploy-configs/bot-setup.sh
```

## Useful Commands

### Nginx

```bash
# Check nginx status
systemctl status nginx

# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### SSL Certificates

```bash
# Check certificate status
certbot certificates

# Manually renew certificates
certbot renew

# Test auto-renewal
certbot renew --dry-run
```

### Bot (PM2)

```bash
# Check bot status
pm2 status

# View bot logs
pm2 logs miniapp-bot

# Restart bot
pm2 restart miniapp-bot

# Stop bot
pm2 stop miniapp-bot

# Start bot
pm2 start miniapp-bot
```

### Firewall

```bash
# Check firewall status
ufw status

# Allow a port
ufw allow 8000/tcp

# Deny a port
ufw deny 8000/tcp
```

## Troubleshooting

### Site not accessible

1. Check DNS records:
```bash
dig miniapp.expert
dig www.miniapp.expert
dig demoapp.miniapp.expert
```

2. Check nginx:
```bash
systemctl status nginx
nginx -t
```

3. Check firewall:
```bash
ufw status
```

### SSL certificate issues

```bash
# Check certificate expiry
certbot certificates

# Force renewal
certbot renew --force-renewal

# Check certbot logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

### Bot not working

```bash
# Check bot logs
pm2 logs miniapp-bot

# Check bot is running
pm2 status

# Restart bot
pm2 restart miniapp-bot

# Check Python environment
cd /home/miniapp_expert/bot
source venv/bin/activate
python bot.py  # Test manually
```

### Permission issues

```bash
# Fix web directory permissions
chown -R www-data:www-data /var/www/miniapp.expert
chown -R www-data:www-data /var/www/demoapp.miniapp.expert

# Fix project directory permissions
chown -R root:root /home/miniapp_expert
```

## Security Recommendations

1. **Change SSH port** from default 22:
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd
```

2. **Disable password authentication**, use SSH keys only:
```bash
nano /etc/ssh/sshd_config
# Set PasswordAuthentication no
systemctl restart sshd
```

3. **Install fail2ban** to prevent brute force:
```bash
apt-get install fail2ban
systemctl enable fail2ban
```

4. **Regular updates**:
```bash
apt-get update && apt-get upgrade -y
```

## Backup

Create regular backups:

```bash
# Backup web files
tar -czf backup-web-$(date +%Y%m%d).tar.gz /var/www/

# Backup project files
tar -czf backup-project-$(date +%Y%m%d).tar.gz /home/miniapp_expert/

# Download backups to local machine
scp root@195.2.73.224:/root/backup-*.tar.gz ./backups/
```

## Monitoring

Set up monitoring with PM2:

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# View monitoring dashboard
pm2 monit
```

## Support

For issues or questions:
- Check logs first
- Review nginx/certbot documentation
- Contact system administrator

---

**Last Updated**: $(date)
**Deployed By**: MiniApp Expert Team

