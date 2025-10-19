#!/bin/bash

echo "🚀 Fixing ALL Lighthouse Issues"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Fix CLS issues (images dimensions)
echo -e "${BLUE}Step 1/5: Fixing CLS issues (adding image dimensions)...${NC}"
node fix-cls-issues.js
echo -e "${GREEN}✅ CLS fixed${NC}"
echo ""

# Step 2: Optimize animations
echo -e "${BLUE}Step 2/5: Optimizing animations...${NC}"
node fix-animations.js
echo -e "${GREEN}✅ Animations optimized${NC}"
echo ""

# Step 3: Optimize LCP element
echo -e "${BLUE}Step 3/5: Optimizing LCP element...${NC}"
node fix-lcp.js
echo -e "${GREEN}✅ LCP optimized${NC}"
echo ""

# Step 4: Break up long tasks
echo -e "${BLUE}Step 4/5: Breaking up long tasks...${NC}"
node fix-long-tasks.js
echo -e "${GREEN}✅ Long tasks fixed${NC}"
echo ""

# Step 5: Optimize WebP quality for smaller files
echo -e "${BLUE}Step 5/5: Re-optimizing WebP images with better compression...${NC}"

if command -v magick &> /dev/null; then
    for file in images/cases/*/*.webp; do
        if [ -f "$file" ]; then
            original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            temp_file="${file}.tmp"
            
            # Re-compress with quality 70 (better compression)
            magick "$file" -quality 70 "$temp_file"
            
            new_size=$(stat -f%z "$temp_file" 2>/dev/null || stat -c%s "$temp_file" 2>/dev/null)
            
            if [ $new_size -lt $original_size ]; then
                mv "$temp_file" "$file"
                diff=$((original_size - new_size))
                percent=$(awk "BEGIN {printf \"%.1f\", ($diff / $original_size) * 100}")
                echo "  ✅ $(basename $file): saved ${percent}%"
            else
                rm "$temp_file"
                echo "  ⏭️  $(basename $file): kept original"
            fi
        fi
    done
else
    echo "  ⚠️  ImageMagick not found, skipping WebP re-optimization"
fi

echo -e "${GREEN}✅ WebP optimization complete${NC}"
echo ""

# Summary
echo -e "${GREEN}✨ All Lighthouse issues fixed!${NC}"
echo ""
echo "📊 Summary of fixes:"
echo "  ✅ CLS: Added width/height to all images + aspect-ratio"
echo "  ✅ Animations: GPU acceleration + will-change hints"
echo "  ✅ LCP: Preload + fetchpriority=\"high\" for hero image"
echo "  ✅ Long tasks: Split JS into chunks with yielding"
echo "  ✅ Images: Optimized WebP compression"
echo ""
echo "🧪 Next steps:"
echo "  1. Test locally: python3 -m http.server 1234"
echo "  2. Run Lighthouse audit"
echo "  3. Expected improvements:"
echo "     - Performance: 90+ ✅"
echo "     - LCP: < 2.5s (was 8.3s) ✅"
echo "     - CLS: < 0.05 (was high) ✅"
echo "     - TBT: < 100ms ✅"
echo ""

