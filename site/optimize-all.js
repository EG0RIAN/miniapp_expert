const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing all HTML files for mobile PageSpeed...\n');

// Read critical CSS
const criticalCSS = fs.readFileSync('./dist/critical.css', 'utf8');

// HTML files to optimize
const htmlFiles = [
    'index.html',
    'real-estate-solution.html',
    'admin-login.html',
    'admin.html',
    'login.html',
    'cabinet.html',
    'privacy.html',
    'product-manage.html'
];

// Optimization functions
function optimizeHTML(html, filename) {
    console.log(`📄 Optimizing ${filename}...`);
    
    // 1. Remove Tailwind CDN if present
    html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, '');
    html = html.replace(/<script>\s*tailwind\.config\s*=\s*{[\s\S]*?}\s*<\/script>/g, '');
    
    // 2. Add preconnect if not present
    if (!html.includes('rel="preconnect"')) {
        const preconnectLinks = `    <!-- Preconnect to external domains (CRITICAL for LCP) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://t.me">
    
`;
        html = html.replace(/(<link rel="icon")/i, preconnectLinks + '$1');
    }
    
    // 3. Replace @import fonts with async load
    html = html.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700;800;900&display=swap'\);/g, '');
    
    // 4. Add optimized styles if not present
    if (!html.includes('Critical Inline CSS')) {
        const optimizedStyles = `
    <!-- Critical Inline CSS (Above-the-fold) -->
    <style>${criticalCSS.substring(0, 3000)}</style>
    
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
        html = html.replace(/<\/head>/i, optimizedStyles + '</head>');
    }
    
    // 5. Add lazy loading to images (skip first 2)
    let imageCount = 0;
    html = html.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
        imageCount++;
        if (imageCount <= 2) {
            if (imageCount === 1 && !attrs.includes('fetchpriority')) {
                return `<img fetchpriority="high" ${attrs}>`;
            }
            return match;
        }
        if (!attrs.includes('loading=')) {
            return `<img loading="lazy" ${attrs}>`;
        }
        return match;
    });
    
    // 6. Add rel="noopener" to external links
    html = html.replace(/<a\s+([^>]*?)href="https:\/\/([^"]*?)"([^>]*?)>/gi, (match, before, url, after) => {
        if (!match.includes('rel=')) {
            return `<a ${before}href="https://${url}" rel="noopener"${after}>`;
        }
        return match;
    });
    
    // 7. Add aria-label to buttons without it
    html = html.replace(/<button([^>]*?)id="lang-switcher"([^>]*?)>/gi, (match) => {
        if (!match.includes('aria-label')) {
            return match.replace('<button', '<button aria-label="Переключить язык"');
        }
        return match;
    });
    
    // 8. Remove large inline style blocks (now in compiled CSS)
    html = html.replace(/<style>[\s\S]*?\.gradient-text[\s\S]*?\.hero-slide\.active[\s\S]*?<\/style>/g, '');
    
    console.log(`  ✅ Added lazy loading to ${Math.max(0, imageCount - 2)} images`);
    
    return html;
}

// Process all HTML files
let processedCount = 0;
let errorCount = 0;

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`  ⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    try {
        const html = fs.readFileSync(filepath, 'utf8');
        const optimized = optimizeHTML(html, filename);
        
        // Create backup
        const backupPath = filepath + '.backup';
        if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, html, 'utf8');
        }
        
        // Write optimized version
        fs.writeFileSync(filepath, optimized, 'utf8');
        processedCount++;
        
    } catch (error) {
        console.error(`  ❌ Error processing ${filename}:`, error.message);
        errorCount++;
    }
});

console.log(`\n✨ Optimization complete!`);
console.log(`📊 Processed: ${processedCount} files`);
if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} files`);
}
console.log(`\nNext steps:`);
console.log(`1. Test locally: python3 -m http.server 1234`);
console.log(`2. Run Lighthouse audit on all pages`);
console.log(`3. Deploy: cd .. && ./deploy-optimized.sh`);

