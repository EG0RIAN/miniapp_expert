const fs = require('fs');
const path = require('path');

console.log('🔗 Updating image links to WebP format...\n');

const htmlFiles = [
    'index.html',
    'real-estate-solution.html'
];

let updatedCount = 0;
let totalReplacements = 0;

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    try {
        let html = fs.readFileSync(filepath, 'utf8');
        let replacements = 0;
        
        // Replace PNG paths with WebP in image sources
        const imagePatterns = [
            { from: /images\/cases\/alfin\/([123])\.png/g, to: 'images/cases/alfin/$1.webp' },
            { from: /images\/cases\/kukushka\/([123])\.png/g, to: 'images/cases/kukushka/$1.webp' },
            { from: /images\/cases\/mosca\/([123])\.png/g, to: 'images/cases/mosca/$1.webp' },
            { from: /images\/cases\/ulybka\/([12])\.png/g, to: 'images/cases/ulybka/$1.webp' },
        ];
        
        imagePatterns.forEach(pattern => {
            const matches = html.match(pattern.from);
            if (matches) {
                html = html.replace(pattern.from, pattern.to);
                replacements += matches.length;
            }
        });
        
        if (replacements > 0) {
            fs.writeFileSync(filepath, html, 'utf8');
            console.log(`✅ ${filename}: ${replacements} image links updated`);
            updatedCount++;
            totalReplacements += replacements;
        } else {
            console.log(`⏭️  ${filename}: no PNG links found`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
    }
});

console.log(`\n✨ Image links update complete!`);
console.log(`📊 Updated: ${updatedCount} files`);
console.log(`🔗 Total replacements: ${totalReplacements}`);
console.log(`\nAll case study images now use WebP format for better performance! 🚀`);

