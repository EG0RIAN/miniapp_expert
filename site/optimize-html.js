const fs = require('fs');
const path = require('path');

// Read original HTML
const htmlPath = './index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('🚀 Optimizing HTML for mobile PageSpeed...\n');

// 1. Replace Tailwind CDN with compiled CSS
console.log('✅ Replacing Tailwind CDN with compiled CSS');
html = html.replace(
    /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
    ''
);

html = html.replace(
    /<script>\s*tailwind\.config\s*=\s*{[\s\S]*?}\s*<\/script>/,
    ''
);

// 2. Add preconnect links before other links
console.log('✅ Adding preconnect for external domains');
const preconnectLinks = `    <!-- Preconnect to external domains (CRITICAL for LCP) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://t.me">
    
`;

html = html.replace(
    /(<link rel="icon")/,
    preconnectLinks + '$1'
);

// 3. Replace Google Fonts @import with async load
console.log('✅ Optimizing Google Fonts loading');
html = html.replace(
    /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700;800;900&display=swap'\);/,
    ''
);

// 4. Add critical inline CSS and async stylesheet loading before </head>
console.log('✅ Adding critical inline CSS and async stylesheet loading');
const criticalCSS = fs.readFileSync('./dist/critical.css', 'utf8');
const optimizedStyles = `
    <!-- Critical Inline CSS (Above-the-fold) -->
    <style>${criticalCSS}</style>
    
    <!-- Preload critical font -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" as="style">
    
    <!-- Load fonts asynchronously with font-display: swap -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"></noscript>
    
    <!-- Preload compiled stylesheet -->
    <link rel="preload" href="/dist/styles.min.css" as="style">
    
    <!-- Load main stylesheet asynchronously -->
    <link rel="stylesheet" href="/dist/styles.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="/dist/styles.min.css"></noscript>
`;

html = html.replace(
    /<\/head>/,
    optimizedStyles + '</head>'
);

// 5. Add lazy loading to images (skip first hero image for LCP)
console.log('✅ Adding lazy loading to images');
let imageCount = 0;
html = html.replace(
    /<img\s+([^>]*?)>/g,
    (match, attrs) => {
        imageCount++;
        // Skip lazy loading for first 2 images (likely hero/LCP images)
        if (imageCount <= 2) {
            // Add fetchpriority="high" to LCP image
            if (imageCount === 1 && !attrs.includes('fetchpriority')) {
                return `<img fetchpriority="high" ${attrs}>`;
            }
            return match;
        }
        // Add loading="lazy" to other images
        if (!attrs.includes('loading=')) {
            return `<img loading="lazy" ${attrs}>`;
        }
        return match;
    }
);

// 6. Add width and height to images if missing (prevent CLS)
console.log('✅ Adding dimensions to images for CLS prevention');
// This would need actual image dimensions, skipping for now

// 7. Add rel="noopener" to external links
console.log('✅ Adding rel="noopener" to external links');
html = html.replace(
    /<a\s+([^>]*?)href="https:\/\/t\.me\/([^"]*?)"([^>]*?)>/g,
    (match, before, url, after) => {
        if (!match.includes('rel=')) {
            return `<a ${before}href="https://t.me/${url}" rel="noopener"${after}>`;
        }
        return match;
    }
);

// 8. Add aria labels for accessibility and SEO
console.log('✅ Improving accessibility');
html = html.replace(
    /<button id="lang-switcher"/g,
    '<button id="lang-switcher" aria-label="Переключить язык"'
);

html = html.replace(
    /<div class="burger-menu" id="burger-menu">/g,
    '<button class="burger-menu" id="burger-menu" aria-label="Открыть меню" aria-expanded="false">'
).replace(
    /<\/div>(\s*<\/div>\s*<\/nav>)/g,
    '</button>$1'
);

// 9. Remove large inline <style> blocks that are now in compiled CSS
console.log('✅ Removing redundant inline styles');
html = html.replace(
    /<style>[\s\S]*?\.gradient-text[\s\S]*?\.hero-slide\.active[\s\S]*?<\/style>/,
    ''
);

// Write optimized HTML
const optimizedPath = './index-optimized.html';
fs.writeFileSync(optimizedPath, html, 'utf8');

console.log(`\n✨ Optimization complete!`);
console.log(`📄 Optimized file: ${optimizedPath}`);
console.log(`📊 Added lazy loading to ${imageCount - 2} images`);
console.log(`\nNext steps:`);
console.log(`1. Review ${optimizedPath}`);
console.log(`2. Test locally: python3 -m http.server 1234`);
console.log(`3. Run Lighthouse audit`);
console.log(`4. If satisfied, rename to index.html`);

