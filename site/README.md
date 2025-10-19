# 🚀 miniapp.expert - Static Site

Статический сайт с оптимизацией под Mobile PageSpeed (90+).

## 📦 Технологии

- **HTML5** - Статическая разметка
- **Tailwind CSS** - Утилитарный CSS (compiled)
- **Vanilla JavaScript** - Без фреймворков
- **WebP/AVIF** - Оптимизированные изображения

## ⚡ Quick Start

### 1. Установка зависимостей
```bash
cd site
npm install
```

### 2. Сборка CSS
```bash
npm run build:css
```

### 3. Локальный сервер
```bash
python3 -m http.server 1234
# Откройте: http://localhost:1234
```

### 4. Оптимизация HTML
```bash
node optimize-html.js
```

### 5. Деплой на продакшн
```bash
cd ..
./deploy-optimized.sh
```

---

## 🛠️ Основные команды

| Команда | Описание |
|---------|----------|
| `npm run build:css` | Компилирует Tailwind CSS |
| `npm run watch` | Watch mode для разработки |
| `node optimize-html.js` | Оптимизирует HTML для PageSpeed |
| `python3 -m http.server 1234` | Локальный dev сервер |

---

## 📁 Структура проекта

```
site/
├── package.json              # Зависимости (Tailwind)
├── tailwind.config.js        # Конфигурация Tailwind
├── optimize-html.js          # Скрипт оптимизации
│
├── src/
│   └── input.css            # Исходный CSS (редактируем здесь)
│
├── dist/
│   ├── styles.min.css       # Скомпилированный CSS (50KB)
│   └── critical.css         # Критический CSS (3KB, inline)
│
├── images/                   # Изображения (WebP/AVIF)
│   ├── cases/
│   └── screenshots/
│
├── *.html                    # HTML страницы
├── *.js                      # JavaScript модули
├── robots.txt               # SEO
└── sitemap.xml              # SEO карта сайта
```

---

## 🎨 Добавление стилей

### Шаг 1: Редактируем CSS
```bash
# Откройте и редактируйте
nano src/input.css
```

### Шаг 2: Добавляем класс
```css
@layer utilities {
  .my-custom-class {
    background: linear-gradient(135deg, #10B981 0%, #0088CC 100%);
    padding: 1rem;
  }
}
```

### Шаг 3: Компилируем
```bash
npm run build:css
```

### Шаг 4: Используем в HTML
```html
<div class="my-custom-class">
  Content
</div>
```

### Шаг 5: Оптимизируем и деплоим
```bash
node optimize-html.js
cd .. && ./deploy-optimized.sh
```

---

## 🖼️ Работа с изображениями

### Оптимизация новых изображений

#### Конвертация в WebP:
```bash
cd images
convert image.jpg -quality 80 image.webp
```

#### Конвертация в AVIF (лучше):
```bash
convert image.jpg -quality 60 image.avif
```

#### Массовая конвертация:
```bash
for file in *.{jpg,jpeg,png}; do
  convert "$file" -quality 80 "${file%.*}.webp"
done
```

### Использование в HTML

#### Above-the-fold (LCP):
```html
<img src="/hero.webp" 
     alt="Hero Image" 
     fetchpriority="high"
     width="1200" 
     height="600">
```

#### Below-the-fold:
```html
<img src="/image.webp" 
     alt="Description" 
     loading="lazy"
     width="800" 
     height="400">
```

**Важно:** Всегда указывайте `width` и `height` для предотвращения CLS!

---

## 📄 Создание новой страницы

### 1. Создаем HTML файл
```bash
touch new-page.html
```

### 2. Добавляем в Tailwind config
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./*.html",
    "./new-page.html",  // Добавляем здесь
    // ...
  ],
  // ...
}
```

### 3. Компилируем CSS
```bash
npm run build:css
```

### 4. Оптимизируем
```bash
node optimize-html.js
```

---

## 🧪 Тестирование производительности

### Lighthouse Audit (Chrome DevTools)
```bash
1. Запустить локальный сервер: python3 -m http.server 1234
2. Открыть Chrome DevTools (F12)
3. Вкладка Lighthouse
4. Выбрать: Mobile + Performance
5. Нажать "Analyze page load"
6. Проверить: Score ≥ 90
```

### PageSpeed Insights (онлайн)
```
1. Открыть: https://pagespeed.web.dev/
2. URL: https://miniapp.expert/
3. Выбрать: Mobile
4. Проверить метрики
```

### Целевые метрики (Mobile):
- ✅ **Performance:** ≥ 90
- ✅ **FCP:** < 1.5s
- ✅ **LCP:** < 2.5s
- ✅ **CLS:** < 0.1
- ✅ **TBT:** < 200ms
- ✅ **Speed Index:** < 3.0s

---

## 🚫 Что НЕ делать

### ❌ НЕ добавляйте Tailwind CDN
```html
<!-- ❌ НИКОГДА -->
<script src="https://cdn.tailwindcss.com"></script>
```

### ❌ НЕ используйте @import для шрифтов
```css
/* ❌ НИКОГДА */
@import url('https://fonts.googleapis.com/...');
```

### ❌ НЕ удаляйте критический CSS
```html
<!-- ✅ ОБЯЗАТЕЛЬНО оставить -->
<style>
/* Critical CSS for above-the-fold content */
...
</style>
```

### ❌ НЕ удаляйте preconnect
```html
<!-- ✅ ОБЯЗАТЕЛЬНО оставить -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
```

### ❌ НЕ удаляйте lazy loading
```html
<!-- ✅ ОБЯЗАТЕЛЬНО для off-screen изображений -->
<img loading="lazy" ...>
```

---

## 🔧 Отладка проблем

### Проблема: Стили не применяются
**Решение:**
```bash
# 1. Очистить кэш сборки
rm -rf dist/
npm run build:css

# 2. Проверить tailwind.config.js content
# 3. Пересобрать
npm run build:css
node optimize-html.js
```

### Проблема: Performance упал после изменений
**Решение:**
```bash
# 1. Запустить Lighthouse
# 2. Проверить "Opportunities" и "Diagnostics"
# 3. Пересобрать CSS и оптимизировать HTML
npm run build:css
node optimize-html.js

# 4. Проверить размер bundle
ls -lh dist/styles.min.css  # Должен быть ~50KB
```

### Проблема: Изображения загружаются медленно
**Решение:**
```bash
# 1. Конвертировать в WebP/AVIF
# 2. Добавить lazy loading (кроме LCP)
# 3. Указать width/height
# 4. Оптимизировать качество (70-80)
```

---

## 📚 Документация

- **[PAGESPEED_OPTIMIZATION.md](../PAGESPEED_OPTIMIZATION.md)** - Детальная документация по оптимизации
- **[OPTIMIZATION_REPORT.md](../OPTIMIZATION_REPORT.md)** - Отчет о результатах
- **[.cursorrules](../.cursorrules)** - Правила для Cursor AI

---

## 🌐 Деплой

### Автоматический деплой:
```bash
cd /Users/arkhiptsev/dev/rello
./deploy-optimized.sh
```

### Ручной деплой:
```bash
# 1. Коммит изменений
git add -A
git commit -m "Update site"
git push origin main

# 2. SSH на сервер
ssh root@85.198.110.66

# 3. Обновление на сервере
cd /home/miniapp_expert
git pull origin main
cd site && npm install && npm run build:css
node optimize-html.js
cp index-optimized.html index.html
cd .. && cp -r site/* /var/www/miniapp.expert/
systemctl reload nginx
```

---

## ✅ Чеклист перед коммитом

- [ ] Запущен `npm run build:css` (если изменился CSS)
- [ ] Запущен `node optimize-html.js` (если изменился HTML)
- [ ] Проверен локально (python3 -m http.server 1234)
- [ ] Lighthouse Score ≥ 90 (mobile)
- [ ] Нет ошибок в консоли
- [ ] Burger menu работает на мобильных
- [ ] Все изображения загружаются
- [ ] Шрифты загружаются без задержки
- [ ] Все ссылки работают

---

## 📞 Support

**При проблемах:**
1. Проверьте консоль браузера (F12)
2. Запустите Lighthouse audit
3. Проверьте Network tab
4. Сравните с backup: `index.html.backup`
5. Откатите если нужно: `cp index.html.backup index.html`

**Полезные ссылки:**
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Last Updated:** 19 October 2025  
**Performance:** 90+ (Mobile) ✅  
**Status:** Production Ready 🚀

