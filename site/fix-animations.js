const fs = require('fs');
const path = require('path');

console.log('🎨 Optimizing animations for better performance...\n');

const htmlFiles = ['index.html', 'real-estate-solution.html'];

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    let html = fs.readFileSync(filepath, 'utf8');
    let changesCount = 0;
    
    console.log(`📄 Optimizing ${filename}...`);
    
    // 1. Add will-change to animated elements
    html = html.replace(
        /class="([^"]*?)group-hover:scale-110 transition-transform duration-500([^"]*?)"/g,
        (match, before, after) => {
            if (!match.includes('will-change')) {
                changesCount++;
                return `class="${before}group-hover:scale-110 transition-transform duration-500${after}" style="will-change: transform"`;
            }
            return match;
        }
    );
    
    // 2. Optimize card hover animations
    html = html.replace(
        /class="([^"]*?)card-hover([^"]*?)"/g,
        (match, before, after) => {
            if (!match.includes('will-change')) {
                changesCount++;
                return `class="${before}card-hover${after}" style="will-change: transform"`;
            }
            return match;
        }
    );
    
    // 3. Add contain: layout to isolated components
    html = html.replace(
        /<div class="([^"]*?)bg-white rounded-2xl([^"]*?)"/g,
        (match, before, after) => {
            if (!match.includes('contain')) {
                changesCount++;
                return `<div class="${before}bg-white rounded-2xl${after}" style="contain: layout"`;
            }
            return match;
        }
    );
    
    // 4. Use transform instead of position animations
    // Already using transform, good!
    
    // 5. Add GPU acceleration hint
    html = html.replace(
        /<style>/,
        `<style>
/* GPU acceleration for animations */
.card-hover, .hero-slide, [class*="hover:scale"], [class*="animate-"] {
    will-change: transform;
    transform: translateZ(0);
}
`
    );
    
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  ✅ Optimized ${changesCount}+ animations`);
});

console.log(`\n✨ Animation optimization complete!`);
console.log(`\n🎯 Applied optimizations:`);
console.log(`   - Added will-change hints`);
console.log(`   - GPU acceleration (translateZ)`);
console.log(`   - Layout containment`);
console.log(`   - Composite layers optimization`);
console.log(`\nThis should eliminate "Avoid non-composited animations" warnings!`);

