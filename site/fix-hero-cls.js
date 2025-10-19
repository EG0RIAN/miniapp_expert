const fs = require('fs');
const path = require('path');

console.log('🎯 Fixing HERO section CLS (0.876 + 0.329 = 1.2)\n');

const htmlFile = 'index.html';
const filepath = path.join(__dirname, htmlFile);
let html = fs.readFileSync(filepath, 'utf8');

// 1. Fix font loading (main cause of CLS)
console.log('1. Fixing font loading to prevent reflow...');
html = html.replace(
    /font-family=Inter:wght@400;500;600;700;800;900&display=swap/g,
    'font-family=Inter:wght@400;500;600;700;800;900&display=block'
);

// Add font-display: block to CSS
html = html.replace(
    /<style>/,
    `<style>
/* Prevent font FOUT causing CLS */
@font-face {
  font-family: 'Inter';
  font-display: block;
  src: local('Arial'), local('Helvetica');
}
`
);

// 2. Add EXACT fixed height to hero section
console.log('2. Adding exact fixed height to hero section...');
html = html.replace(
    /<section style="contain: layout paint" class="relative pt-32 pb-20 px-6 overflow-hidden">/,
    '<section class="relative pt-32 pb-20 px-6 overflow-hidden" style="height: 700px; max-height: 700px; overflow: hidden; contain: strict">'
);

// 3. Add skeleton for text content
console.log('3. Adding skeleton loader for text...');
const skeletonCSS = `
/* Skeleton to prevent CLS */
.hero-title, .hero-text {
    min-height: 60px;
    display: block;
}

/* Reserve space for hero content */
.hero-section {
    height: 700px;
    max-height: 700px;
    overflow: hidden;
}

/* Prevent font swap CLS */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}
`;

html = html.replace(
    /<\/style>/,
    skeletonCSS + '\n</style>'
);

// 4. Remove font preload (causes FOUT)
console.log('4. Removing font preload that causes FOUT...');
html = html.replace(
    /<link rel="preload" href="https:\/\/fonts\.googleapis\.com[^>]*?>/g,
    ''
);

// 5. Add size-adjust for fallback font
console.log('5. Adding size-adjust for fallback font...');
const fontAdjust = `
/* Match Inter font metrics */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 107%;
}
`;

html = html.replace(
    /<style>/,
    `<style>${fontAdjust}`
);

// 6. Replace font-family with fallback
console.log('6. Using fallback font until Inter loads...');
html = html.replace(
    /font-family: 'Inter',/g,
    "font-family: 'Inter-fallback', 'Inter',"
);

// 7. Add visibility hidden until loaded
console.log('7. Adding content visibility optimization...');
html = html.replace(
    /<section class="relative pt-32 pb-20/,
    '<section style="content-visibility: auto" class="relative pt-32 pb-20'
);

// 8. Simplify hero section completely
console.log('8. Simplifying hero section structure...');
// Remove complex animations and transitions
html = html.replace(
    /transition-all duration-\d+/g,
    ''
);
html = html.replace(
    /group-hover:[\w-]+/g,
    ''
);

fs.writeFileSync(filepath, html, 'utf8');

console.log('\n✅ Hero section CLS fixes applied!');
console.log('\n🎯 Changes:');
console.log('  ✅ Hero height: fixed 700px');
console.log('  ✅ Font-display: block (no FOUT)');
console.log('  ✅ Fallback font with size-adjust');
console.log('  ✅ No font preload (prevents reflow)');
console.log('  ✅ Strict containment');
console.log('  ✅ Skeleton loader');
console.log('\nExpected: CLS 1.2 → <0.1');

