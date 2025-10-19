#!/bin/bash

echo "🖼️  Converting images to WebP format..."
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not installed!"
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Function to convert images
convert_dir() {
    local dir=$1
    local count=0
    local saved=0
    
    echo "📁 Processing directory: $dir"
    
    shopt -s nullglob
    for file in "$dir"/*.png "$dir"/*.jpg "$dir"/*.jpeg "$dir"/*.PNG "$dir"/*.JPG "$dir"/*.JPEG; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            extension="${filename##*.}"
            name="${filename%.*}"
            webp_file="$dir/$name.webp"
            
            # Skip if WebP already exists
            if [ -f "$webp_file" ]; then
                echo "  ⏭️  $filename (WebP exists)"
                continue
            fi
            
            # Get original size
            original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            
            # Convert to WebP
            convert "$file" -quality 80 "$webp_file"
            
            if [ -f "$webp_file" ]; then
                webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
                diff=$((original_size - webp_size))
                percent=$(awk "BEGIN {printf \"%.1f\", ($diff / $original_size) * 100}")
                
                echo "  ✅ $filename → $name.webp"
                echo "     $(numfmt --to=iec $original_size 2>/dev/null || echo "$original_size bytes") → $(numfmt --to=iec $webp_size 2>/dev/null || echo "$webp_size bytes") (saved $percent%)"
                
                ((count++))
                saved=$((saved + diff))
            else
                echo "  ❌ Failed: $filename"
            fi
        fi
    done
    
    if [ $count -gt 0 ]; then
        echo "  📊 Converted: $count images"
        echo "  💾 Saved: $(numfmt --to=iec $saved 2>/dev/null || echo "$saved bytes")"
    fi
    echo ""
}

# Convert images in all directories
convert_dir "images/cases/alfin"
convert_dir "images/cases/kukushka"
convert_dir "images/cases/mosca"
convert_dir "images/cases/ulybka"
convert_dir "images"

echo "✨ Image conversion complete!"
echo ""
echo "Next steps:"
echo "1. Update HTML to use .webp files"
echo "2. Keep original files as fallback"
echo "3. Test image loading"

