# 🚨 Исправление утечки SMTP credentials

## Проблема
GitGuardian обнаружил SMTP пароль в публичном репозитории GitHub.

## Срочные действия

### 1. Сменить пароль SMTP (СДЕЛАТЬ СЕЙЧАС!)

1. Зайдите на https://mail.ru
2. Войдите в `no-reply@miniapp.expert`
3. Настройки → Пароль и безопасность → Пароли приложений
4. Удалите старый пароль для SMTP
5. Создайте новый пароль для приложений

### 2. Удалить credentials из Git истории

```bash
cd /Users/arkhiptsev/dev/rello

# Создать файл с паттернами для удаления
cat > passwords.txt << 'EOF'
DXoz9JYNKhWaqK1QDgq3
SMTP_PASS=DXoz9JYNKhWaqK1QDgq3
EOF

# Использовать git filter-repo для очистки истории
pip3 install git-filter-repo

git filter-repo --replace-text passwords.txt --force

# Удалить временный файл
rm passwords.txt

# Force push (ВНИМАНИЕ: это перезапишет историю!)
git push origin main --force
```

### 3. Обновить .env на сервере

```bash
ssh root@85.198.110.66

# Откройте .env
nano /home/miniapp_expert/.env

# Замените строку:
SMTP_PASS=НОВЫЙ_ПАРОЛЬ_ИЗ_MAIL_RU

# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Перезапустите API
cd /home/miniapp_expert
docker compose restart api
```

### 4. Добавить .env в .gitignore

```bash
cd /Users/arkhiptsev/dev/rello

# Убедитесь что .env в .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
echo ".env.*" >> .gitignore

git add .gitignore
git commit -m "chore: Update .gitignore to prevent env leaks"
git push origin main
```

## Альтернативный метод (если git filter-repo не работает)

### Использовать BFG Repo-Cleaner

```bash
# Установить BFG
brew install bfg  # macOS
# или скачать с https://rtyley.github.io/bfg-repo-cleaner/

# Создать файл с паролями для замены
echo "DXoz9JYNKhWaqK1QDgq3" > passwords.txt

# Очистить репозиторий
bfg --replace-text passwords.txt

# Очистить и force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin main --force

# Удалить временный файл
rm passwords.txt
```

## Проверка

После очистки проверьте:

```bash
# Поиск старого пароля в истории
git log -S "DXoz9JYNKhWaqK1QDgq3" --all

# Должно вернуть пустой результат
```

## Важные файлы для проверки

Убедитесь, что эти файлы НЕ содержат credentials:

- ✅ `EMAIL_SETUP.md` - содержит пароль (нужно удалить)
- ✅ `QUICK_EMAIL_SETUP.sh` - содержит пароль (нужно удалить)
- ✅ `api-adonis/start/env.ts` - только схема, без значений (OK)
- ✅ `.env` файлы - должны быть в .gitignore

## После исправления

1. ✅ Пароль изменён в Mail.ru
2. ✅ История Git очищена
3. ✅ Force push выполнен
4. ✅ .env обновлён на сервере
5. ✅ API перезапущен
6. ✅ .gitignore обновлён

## Уведомить GitGuardian

После исправления отметьте инцидент как "Resolved" в GitGuardian Dashboard.

---

**ВАЖНО:** После force push все, кто клонировал репозиторий, должны сделать:

```bash
git fetch origin
git reset --hard origin/main
```

