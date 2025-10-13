# Rello - Telegram Mini App

Telegram Mini App для создания приложений для бизнеса, построенный с использованием React и TMA SDK.

## Особенности

- ⚡️ Vite + React + TypeScript
- 📱 Полная интеграция с Telegram Mini Apps SDK (@twa-dev/sdk)
- 🎨 Современный дизайн с анимациями
- 📦 Swiper для карусели примеров приложений
- 🎯 Responsive дизайн для всех устройств

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## Сборка

```bash
npm run build
```

## Тестирование в Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Используйте команду `/newapp` для создания Mini App
3. Укажите URL вашего приложения (после деплоя)
4. Используйте Telegram Web App для тестирования локально через ngrok/localtunnel

## Деплой

Вы можете задеплоить приложение на:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- Любой другой хостинг статических файлов

После сборки загрузите содержимое папки `dist/` на хостинг.

## Структура проекта

```
rello/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # Главная страница
│   │   └── Home.css          # Стили главной страницы
│   ├── App.tsx               # Главный компонент приложения
│   ├── App.css               # Стили приложения
│   ├── main.tsx              # Точка входа
│   └── index.css             # Глобальные стили
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## TMA SDK Возможности

Приложение использует следующие возможности Telegram Mini Apps:

- `WebApp.ready()` - инициализация приложения
- `WebApp.expand()` - развернуть приложение на весь экран
- `WebApp.setHeaderColor()` - установить цвет заголовка
- `WebApp.setBackgroundColor()` - установить цвет фона
- `WebApp.enableClosingConfirmation()` - подтверждение при закрытии
- Доступ к данным пользователя через `WebApp.initDataUnsafe`

## Лицензия

MIT

