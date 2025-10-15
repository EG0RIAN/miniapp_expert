# 🌐 Настройка DNS для установки SSL

## ❌ Проблема

Certbot не может получить SSL сертификаты, потому что домены не указывают на ваш сервер.

**Текущая ошибка:**
```
DNS problem: NXDOMAIN looking up A for miniapp.expert
DNS problem: NXDOMAIN looking up A for www.miniapp.expert  
DNS problem: NXDOMAIN looking up A for demoapp.miniapp.expert
```

---

## ✅ Решение: Добавьте DNS записи

Зайдите в панель управления вашим доменом (где покупали `miniapp.expert`) и добавьте эти A-записи:

### Необходимые DNS записи:

| Имя хоста | Тип | Значение (IP) | TTL |
|-----------|-----|---------------|-----|
| @ | A | 85.198.110.66 | 3600 |
| www | A | 85.198.110.66 | 3600 |
| demoapp | A | 85.198.110.66 | 3600 |

**Расшифровка:**
- `@` означает `miniapp.expert`
- `www` означает `www.miniapp.expert`
- `demoapp` означает `demoapp.miniapp.expert`

---

## 🕐 Ожидание распространения DNS

После добавления DNS записей, подождите 5-30 минут для распространения.

Проверьте DNS с вашего компьютера:

```bash
dig miniapp.expert +short
dig www.miniapp.expert +short
dig demoapp.miniapp.expert +short
```

Все три команды должны вернуть: **85.198.110.66**

---

## 🔒 Установка SSL после настройки DNS

Когда DNS заработает, выполните на сервере:

```bash
ssh root@85.198.110.66
# Пароль: h421-5882p7vUqkFn+EF

cd /home/miniapp_expert
certbot --nginx -d miniapp.expert -d www.miniapp.expert -d demoapp.miniapp.expert --non-interactive --agree-tos --email hello@miniapp.expert --redirect
```

Или автоматически с вашего компьютера:

```bash
cd /Users/arkhiptsev/dev/rello
./install-ssl-when-dns-ready.sh
```

---

## ✅ Что уже работает (без SSL):

Пока DNS настраивается, ваши сайты уже доступны по HTTP:

- 🌐 **http://85.198.110.66** - работает nginx
- 🤖 **Telegram бот** - запущен и работает (токен: 8395636611:AAH...)

Проверьте:
```bash
curl -I http://85.198.110.66
```

---

## 📋 После получения SSL:

Ваши сайты будут доступны:

🌐 **https://miniapp.expert**  
🌐 **https://www.miniapp.expert**  
📱 **https://demoapp.miniapp.expert**

---

## 🔍 Проверка статуса

На сервере выполните:

```bash
# Статус nginx
systemctl status nginx

# Статус бота
pm2 status

# Логи бота
pm2 logs miniapp-bot

# Проверка когда DNS заработает
certbot certificates
```

---

## 📝 Где настроить DNS?

Обычно DNS настраивается в:
- **Регистратор домена** (где покупали miniapp.expert): REG.RU, TIMEWEB, GoDaddy и т.д.
- **Cloudflare** (если используете)
- **Панель хостинга** (если домен управляется там)

Найдите раздел "DNS Management" или "DNS зона" или "Управление DNS".

---

## ⏱️ Время ожидания

- **Минимум**: 5-10 минут
- **Обычно**: 30 минут
- **Максимум**: до 48 часов (редко)

Проверяйте командой `dig` каждые 10 минут.

---

**Сервер:** 85.198.110.66  
**Бот:** ✅ Работает  
**Nginx:** ✅ Работает  
**Осталось:** Настроить DNS → Получить SSL






