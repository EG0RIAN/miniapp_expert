#!/bin/bash

echo "📐 Extracting critical CSS for above-the-fold content..."

# Extract only the most critical classes
cat > dist/critical.css << 'EOF'
/* Minimal critical CSS - only above-the-fold */
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}
html{line-height:1.5;-webkit-text-size-adjust:100%}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fixed{position:fixed}.relative{position:relative}
.top-0{top:0}.left-0{left:0}.right-0{right:0}
.z-50{z-index:50}
.flex{display:flex}.hidden{display:none}.block{display:block}
.items-center{align-items:center}.justify-between{justify-content:space-between}.justify-end{justify-content:flex-end}
.gap-4{gap:1rem}.space-x-2>:not([hidden])~:not([hidden]){margin-left:0.5rem}.space-x-3>:not([hidden])~:not([hidden]){margin-left:0.75rem}
.bg-white\/95{background-color:rgb(255 255 255/0.95)}.bg-primary{background-color:#10B981}.bg-gray-50{background-color:#f9fafb}
.backdrop-blur-md{backdrop-filter:blur(12px)}
.shadow-sm{box-shadow:0 1px 2px 0 rgb(0 0 0/0.05)}
.rounded-lg{border-radius:0.5rem}
.px-4{padding-left:1rem;padding-right:1rem}.py-3{padding-top:0.75rem;padding-bottom:0.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}
.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}
.font-bold{font-weight:700}.font-semibold{font-weight:600}
.max-w-7xl{max-width:80rem}.mx-auto{margin-left:auto;margin-right:auto}
.w-7{width:1.75rem}.h-7{height:1.75rem}.w-8{width:2rem}.h-8{height:2rem}
.gradient-text{background:linear-gradient(135deg,#10B981 0%,#0088CC 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
@media(min-width:768px){.md\:flex{display:flex}.md\:hidden{display:hidden}.md\:px-6{padding-left:1.5rem;padding-right:1.5rem}.md\:py-4{padding-top:1rem;padding-bottom:1rem}.md\:text-2xl{font-size:1.5rem}.md\:w-8{width:2rem}.md\:h-8{height:2rem}}
EOF

echo "✅ Critical CSS extracted ($(wc -c < dist/critical.css) bytes)"
echo "📊 Full CSS: $(wc -c < dist/styles.min.css) bytes"

