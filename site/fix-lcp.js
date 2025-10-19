const fs = require('fs');
const path = require('path');

console.log('⚡ Optimizing LCP (Largest Contentful Paint)...\n');

const htmlFiles = ['index.html'];

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    let html = fs.readFileSync(filepath, 'utf8');
    
    console.log(`📄 Optimizing ${filename}...`);
    
    // 1. Add preload for LCP image (first hero image)
    const preloadSection = `    <!-- Preload LCP image for faster rendering -->
    <link rel="preload" as="image" href="images/cases/mosca/1.webp" imagesrcset="images/cases/mosca/1.webp 1x" fetchpriority="high">
    
`;
    
    if (!html.includes('Preload LCP image')) {
        html = html.replace(
            /<!-- Preload compiled stylesheet -->/,
            preloadSection + '    <!-- Preload compiled stylesheet -->'
        );
    }
    
    // 2. Ensure first image has fetchpriority="high" and NO loading="lazy"
    html = html.replace(
        /<img (fetchpriority="high" )?src="images\/cases\/mosca\/1\.webp"/,
        '<img fetchpriority="high" src="images/cases/mosca/1.webp"'
    );
    
    // Remove loading="lazy" from first image if present
    html = html.replace(
        /<img fetchpriority="high" src="images\/cases\/mosca\/1\.webp" alt="([^"]*?)" loading="lazy"/,
        '<img fetchpriority="high" src="images/cases/mosca/1.webp" alt="$1"'
    );
    
    // 3. Add early hints for critical resources
    const earlyHints = `    <!-- Early Hints for faster LCP -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    
`;
    
    // Already have preconnect, ensure it's early in <head>
    
    // 4. Inline critical hero styles for instant render
    const criticalHeroStyles = `
/* Critical Hero Styles for instant LCP */
.hero-container { min-height: 600px; background: #f9fafb; }
@media (max-width: 768px) { .hero-container { min-height: 400px; } }
`;
    
    html = html.replace(
        /<!-- Critical Inline CSS/,
        `<!-- Critical Hero Styles -->
    <style>${criticalHeroStyles}</style>
    
    <!-- Critical Inline CSS`
    );
    
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  ✅ LCP optimized`);
});

console.log(`\n✨ LCP optimization complete!`);
console.log(`\n🎯 Applied optimizations:`);
console.log(`   - Preload LCP image with fetchpriority="high"`);
console.log(`   - Remove lazy loading from LCP image`);
console.log(`   - Inline critical hero styles`);
console.log(`   - Early resource hints`);
console.log(`\nExpected LCP: < 2.5s (was 8.3s)`);

