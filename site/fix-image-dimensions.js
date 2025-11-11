const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🖼️  Adding width/height to all images (fix CLS)...\n');

// Get image dimensions using ImageMagick
function getImageDimensions(imagePath) {
    try {
        const output = execSync(`identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf8' });
        const [width, height] = output.trim().split('x');
        return { width: parseInt(width), height: parseInt(height) };
    } catch (error) {
        console.error(`  ⚠️  Error getting dimensions for ${imagePath}`);
        return null;
    }
}

// HTML files to process
const htmlFiles = [
    'index.html',
    'real-estate-solution.html',
    'login.html',
    'cabinet.html',
    'privacy.html',
    'product-manage.html'
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
    
    // Find all <img> tags without width/height
    const imgRegex = /<img\s+([^>]*?)>/gi;
    const matches = [...html.matchAll(imgRegex)];
    
    matches.forEach(match => {
        const fullTag = match[0];
        const attrs = match[1];
        
        // Skip if already has width and height
        if (attrs.includes('width=') && attrs.includes('height=')) {
            return;
        }
        
        // Extract src
        const srcMatch = attrs.match(/src=["']([^"']+)["']/);
        if (!srcMatch) return;
        
        const src = srcMatch[1];
        const imagePath = path.join(__dirname, src);
        
        if (!fs.existsSync(imagePath)) {
            // Try without leading slash
            const altPath = path.join(__dirname, src.replace(/^\//, ''));
            if (!fs.existsSync(altPath)) {
                return;
            }
        }
        
        const actualPath = fs.existsSync(imagePath) ? imagePath : path.join(__dirname, src.replace(/^\//, ''));
        const dimensions = getImageDimensions(actualPath);
        
        if (dimensions) {
            let newTag = fullTag;
            
            // Add width if missing
            if (!attrs.includes('width=')) {
                newTag = newTag.replace('<img', `<img width="${dimensions.width}"`);
            }
            
            // Add height if missing
            if (!attrs.includes('height=')) {
                newTag = newTag.replace('<img', `<img height="${dimensions.height}"`);
            }
            
            html = html.replace(fullTag, newTag);
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        fs.writeFileSync(filepath, html, 'utf8');
        console.log(`  ✅ Fixed ${fixedCount} images`);
        totalFixed += fixedCount;
    } else {
        console.log(`  ⏭️  No images to fix`);
    }
});

console.log(`\n✨ Image dimensions fix complete!`);
console.log(`📊 Total images fixed: ${totalFixed}`);
console.log(`\n🎯 This will significantly reduce CLS (Cumulative Layout Shift)!`);

