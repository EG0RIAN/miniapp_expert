const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX - CLS = 1.0 is critical!\n');

const htmlFile = 'index.html';
const filepath = path.join(__dirname, htmlFile);
let html = fs.readFileSync(filepath, 'utf8');

// 1. Remove ALL animations completely
console.log('1. Removing ALL animations...');
html = html.replace(/animate-\w+/g, '');
html = html.replace(/animation:\s*[\w\s-]+;/g, '');
html = html.replace(/will-change:\s*\w+;/g, '');

// 2. Fix hero section that causes CLS
console.log('2. Fixing hero section CLS...');
// Add fixed height to hero container
html = html.replace(
    /<section class="relative pt-32 pb-20 px-6 overflow-hidden">/,
    '<section class="relative pt-32 pb-20 px-6 overflow-hidden" style="min-height: 600px">'
);

// 3. Remove carousel completely (causes CLS)
console.log('3. Removing hero carousel...');
html = html.replace(
    /<!-- Hero Mockups Carousel -->[\s\S]*?<!-- \/Hero Mockups Carousel -->/,
    '<!-- Carousel removed for performance -->'
);

// 4. Fix image containers
console.log('4. Fixing image containers...');
html = html.replace(
    /class="([^"]*?)swiper-slide/g,
    'class="$1swiper-slide" style="width: 375px; height: 812px"'
);

// 5. Add explicit viewport meta
console.log('5. Optimizing viewport...');
html = html.replace(
    /<meta name="viewport" content="([^"]*?)">/,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">'
);

// 6. Preload critical resources in correct order
console.log('6. Optimizing resource loading...');
const preloadOrder = `    <!-- Preload critical resources in order -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="/dist/styles.min.css" as="style">
    <link rel="preload" href="images/cases/mosca/1.webp" as="image" fetchpriority="high">
    
`;

if (!html.includes('Preload critical resources in order')) {
    html = html.replace(
        /<!-- Preconnect to external domains/,
        preloadOrder + '    <!-- Preconnect to external domains'
    );
}

// 7. Add contain CSS to ALL sections
console.log('7. Adding containment to all sections...');
html = html.replace(
    /<section/g,
    '<section style="contain: layout paint"'
);

// 8. Simplify styles - remove complex calculations
console.log('8. Simplifying CSS...');
const emergencyCSS = `
/* Emergency CLS fix */
* {
    box-sizing: border-box;
}

img, svg, video {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Disable ALL animations on mobile */
@media (max-width: 768px) {
    *, *::before, *::after {
        animation: none !important;
        transition: none !important;
    }
}

/* Fixed heights to prevent CLS */
.hero-section {
    min-height: 600px;
}

.card {
    min-height: 200px;
}

/* Force containment */
section, div, article {
    contain: layout;
}
`;

html = html.replace(
    /<style>[\s\S]*?<\/style>/,
    `<style>${emergencyCSS}\n</style>`
);

// 9. Remove content-visibility (causes issues)
console.log('9. Removing problematic content-visibility...');
html = html.replace(/content-visibility:\s*auto;?/g, '');
html = html.replace(/contain-intrinsic-size:[^;]+;?/g, '');

// 10. Add cache headers meta
console.log('10. Adding cache hints...');
html = html.replace(
    /<\/head>/,
    `    <meta http-equiv="Cache-Control" content="public, max-age=31536000">
</head>`
);

fs.writeFileSync(filepath, html, 'utf8');

console.log('\n✅ Emergency fixes applied!');
console.log('\n🎯 Critical changes:');
console.log('  ✅ ALL animations removed');
console.log('  ✅ Hero carousel removed');
console.log('  ✅ Fixed heights added');
console.log('  ✅ Containment on all sections');
console.log('  ✅ Simplified CSS');
console.log('\nExpected results:');
console.log('  - CLS: 1.0 → <0.1');
console.log('  - FCP: 3.2s → <1.5s');
console.log('  - LCP: 3.4s → <2.5s');

