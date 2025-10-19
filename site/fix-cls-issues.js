const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing CLS issues - Adding dimensions and optimizing layout...\n');

// Known image dimensions (from actual files)
const imageDimensions = {
    // Case study images (WebP conversions)
    'images/cases/alfin/1.webp': { width: 375, height: 812 },
    'images/cases/alfin/2.webp': { width: 375, height: 812 },
    'images/cases/alfin/3.webp': { width: 375, height: 812 },
    'images/cases/kukushka/1.webp': { width: 375, height: 812 },
    'images/cases/kukushka/2.webp': { width: 375, height: 812 },
    'images/cases/kukushka/3.webp': { width: 375, height: 812 },
    'images/cases/mosca/1.webp': { width: 375, height: 812 },
    'images/cases/mosca/2.webp': { width: 375, height: 812 },
    'images/cases/mosca/3.webp': { width: 375, height: 812 },
    'images/cases/ulybka/1.webp': { width: 375, height: 812 },
    'images/cases/ulybka/2.webp': { width: 375, height: 812 },
    // SVG logos
    'images/cases/alfin/logo.svg': { width: 120, height: 40 },
    'images/cases/kukushka/logo.svg': { width: 120, height: 40 },
    'images/cases/mosca/logo.svg': { width: 120, height: 40 },
    'images/cases/ulybka/logo.svg': { width: 120, height: 40 },
};

const htmlFiles = [
    'index.html',
    'real-estate-solution.html'
];

let totalFixed = 0;

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    let html = fs.readFileSync(filepath, 'utf8');
    let fixedCount = 0;
    
    console.log(`📄 Processing ${filename}...`);
    
    // Fix images without dimensions
    Object.keys(imageDimensions).forEach(src => {
        const { width, height } = imageDimensions[src];
        
        // Pattern: <img ... src="path" ...> without width/height
        const regex = new RegExp(`<img\\s+([^>]*?)src=["']${src}["']([^>]*?)>`, 'gi');
        
        html = html.replace(regex, (match, before, after) => {
            // Check if width/height already exist
            if (match.includes('width=') && match.includes('height=')) {
                return match;
            }
            
            // Add width/height
            let newMatch = match;
            if (!match.includes('width=')) {
                newMatch = newMatch.replace('<img', `<img width="${width}"`);
                fixedCount++;
            }
            if (!match.includes('height=')) {
                newMatch = newMatch.replace('<img', `<img height="${height}"`);
            }
            
            return newMatch;
        });
    });
    
    // Add aspect-ratio to prevent CLS
    html = html.replace(
        /<img\s+([^>]*?)class="([^"]*?)w-full h-full object-contain([^"]*?)"([^>]*?)>/gi,
        '<img $1class="$2w-full h-full object-contain$3" style="aspect-ratio: 375/812"$4>'
    );
    
    // Add aspect-ratio to cover images
    html = html.replace(
        /<img\s+([^>]*?)class="([^"]*?)w-full h-full object-cover([^"]*?)"([^>]*?)>/gi,
        '<img $1class="$2w-full h-full object-cover$3" style="aspect-ratio: 375/812"$4>'
    );
    
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  ✅ Fixed ${fixedCount}+ images and added aspect-ratios`);
    totalFixed += fixedCount;
});

console.log(`\n✨ CLS fixes applied!`);
console.log(`📊 Total images fixed: ${totalFixed}+`);
console.log(`\n🎯 Benefits:`);
console.log(`   - Images have explicit dimensions`);
console.log(`   - Aspect-ratio CSS prevents layout shifts`);
console.log(`   - CLS should be < 0.1 now`);

