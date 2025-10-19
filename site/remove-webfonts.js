const fs = require('fs');
const path = require('path');

console.log('🚨 REMOVING WEB FONTS - Using system fonts only\n');
console.log('Reason: Web font loading causes 0.876 CLS\n');

const htmlFile = 'index.html';
const filepath = path.join(__dirname, htmlFile);
let html = fs.readFileSync(filepath, 'utf8');

// 1. Remove ALL Google Fonts references
console.log('1. Removing ALL Google Fonts...');
html = html.replace(
    /<link[^>]*?fonts\.googleapis\.com[^>]*?>/g,
    ''
);
html = html.replace(
    /<link[^>]*?fonts\.gstatic\.com[^>]*?>/g,
    ''
);
html = html.replace(
    /<noscript>[\s\S]*?fonts\.googleapis\.com[\s\S]*?<\/noscript>/g,
    ''
);

// 2. Replace with system font stack
console.log('2. Using optimized system font stack...');
const systemFontCSS = `
/* System fonts - zero CLS, instant load */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Remove all font-face declarations */
@font-face { font-family: 'Inter'; src: local('Arial'); }
@font-face { font-family: 'Inter-fallback'; src: local('Arial'); }
`;

// Replace font-family in all CSS
html = html.replace(
    /font-family: 'Inter-fallback', 'Inter',[^;]+;/g,
    "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;"
);

html = html.replace(
    /font-family: 'Inter',[^;]+;/g,
    "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;"
);

// 3. Update inline styles
html = html.replace(
    /<style>/,
    `<style>${systemFontCSS}\n`
);

// 4. Remove font-display declarations
html = html.replace(
    /@font-face\s*\{[\s\S]*?\}/g,
    ''
);

// 5. Remove preconnect to fonts
console.log('3. Removing font preconnects...');
html = html.replace(
    /<link rel="(?:preconnect|dns-prefetch)" href="https:\/\/fonts\.[^"]*?"[^>]*?>/g,
    ''
);

// 6. Add performance hints
console.log('4. Adding performance meta tags...');
const perfHints = `    <!-- Performance hints -->
    <meta http-equiv="x-dns-prefetch-control" content="on">
    
`;

html = html.replace(
    /<link rel="icon"/,
    perfHints + '    <link rel="icon"'
);

fs.writeFileSync(filepath, html, 'utf8');

console.log('\n✅ Web fonts removed!');
console.log('\n🎯 Changes:');
console.log('  ✅ Google Fonts → System fonts');
console.log('  ✅ Zero font download');
console.log('  ✅ Zero FOUT/FOIT');
console.log('  ✅ Zero CLS from fonts');
console.log('\n💡 System fonts used:');
console.log('  - macOS/iOS: San Francisco');
console.log('  - Windows: Segoe UI');
console.log('  - Android: Roboto');
console.log('  - Fallback: Arial');
console.log('\nExpected CLS: 0.876 → 0');

