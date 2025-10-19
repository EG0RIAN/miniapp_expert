const fs = require('fs');
const path = require('path');

console.log('⚡ Minifying JavaScript files...\n');

// Simple minification (remove comments and extra whitespace)
function minifyJS(code) {
    // Remove single-line comments
    code = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove extra whitespace
    code = code.replace(/\s+/g, ' ');
    
    // Remove whitespace around operators
    code = code.replace(/\s*([+\-*/%=<>!&|,;:(){}[\]])\s*/g, '$1');
    
    // Remove trailing semicolons before }
    code = code.replace(/;}/g, '}');
    
    return code.trim();
}

// JS files to minify
const jsFiles = [
    'admin.js',
    'admin-crud.js',
    'cabinet.js'
];

let processedCount = 0;
let totalSaved = 0;

jsFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }
    
    try {
        const original = fs.readFileSync(filepath, 'utf8');
        const minified = minifyJS(original);
        
        const originalSize = Buffer.byteLength(original, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const saved = originalSize - minifiedSize;
        const percent = ((saved / originalSize) * 100).toFixed(1);
        
        // Create backup
        const backupPath = filepath + '.backup';
        if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, original, 'utf8');
        }
        
        // Write minified version
        const minPath = filepath.replace('.js', '.min.js');
        fs.writeFileSync(minPath, minified, 'utf8');
        
        console.log(`✅ ${filename}`);
        console.log(`   ${originalSize} → ${minifiedSize} bytes (saved ${saved} bytes, -${percent}%)`);
        
        processedCount++;
        totalSaved += saved;
        
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
    }
});

console.log(`\n✨ Minification complete!`);
console.log(`📊 Processed: ${processedCount} files`);
console.log(`💾 Total saved: ${totalSaved} bytes (~${(totalSaved / 1024).toFixed(1)} KB)`);
console.log(`\nMinified files created with .min.js extension`);

