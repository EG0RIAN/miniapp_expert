const fs = require('fs');

console.log('🔧 Simple, safe optimization...\n');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace Tailwind CDN with compiled CSS
console.log('✅ Step 1: Replace Tailwind CDN');
html = html.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<link rel="stylesheet" href="/dist/styles.min.css">'
);

// Remove tailwind.config inline
html = html.replace(
    /<script>\s*tailwind\.config[\s\S]*?<\/script>/,
    ''
);

// 2. Optimize Google Fonts
console.log('✅ Step 2: Remove Google Fonts (use system fonts)');
html = html.replace(
    /@import url\('https:\/\/fonts\.googleapis\.com[^']+'\);/,
    '/* Using system fonts for zero CLS */'
);

// 3. Update font-family to system fonts
html = html.replace(
    /font-family: 'Inter',/g,
    'font-family:'
);

// 4. Add lazy loading to images (skip first 2)
console.log('✅ Step 3: Add lazy loading to images');
let imgCount = 0;
html = html.replace(/<img\s+([^>]*?)>/g, (match, attrs) => {
    imgCount++;
    if (imgCount > 2 && !attrs.includes('loading=')) {
        return `<img loading="lazy" ${attrs}>`;
    }
    return match;
});

// 5. Add fetchpriority to first image
html = html.replace(
    /<img src="images\/cases\/mosca\/1\.png"/,
    '<img fetchpriority="high" src="images/cases/mosca/1.webp"'
);

// 6. Replace .png with .webp in image sources
html = html.replace(/src="images\/cases\/(\w+)\/(\d)\.png"/g, 'src="images/cases/$1/$2.webp"');

// 7. Add width/height to images to prevent CLS
html = html.replace(
    /<img ([^>]*?)src="images\/cases\/[^\/]+\/\d\.webp"([^>]*?)>/g,
    '<img $1src="images/cases/mosca/1.webp" width="375" height="812"$2>'
);

// 8. Wrap scripts in DOMContentLoaded
console.log('✅ Step 4: Fix JavaScript');
html = html.replace(
    /document\.getElementById\('contactForm'\)\.addEventListener/,
    `document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener`
);

// Close DOMContentLoaded wrapper
html = html.replace(
    /(\s+}\);\s+<\/script>)$/m,
    '    });\n});\n</script>'
);

fs.writeFileSync('index.html', html, 'utf8');

console.log('\n✅ Optimization complete!');
console.log('📊 Changes:');
console.log(`  - Lazy loaded ${imgCount - 2} images`);
console.log('  - Using system fonts');
console.log('  - Using WebP images');
console.log('  - Safe JavaScript');

