const fs = require('fs');

console.log('💳 Adding T-Bank payment buttons...\n');

// Add to real-estate-solution.html
console.log('1. Adding payment button to real-estate-solution.html...');
let realEstate = fs.readFileSync('real-estate-solution.html', 'utf8');

// Find the demo button and add payment button next to it
realEstate = realEstate.replace(
    /<a href="https:\/\/t\.me\/MiniAppExpertDemoBot" target="_blank" rel="noopener" class="([^"]*?)">[\s\S]*?Попробовать демо[\s\S]*?<\/a>/,
    `<a href="https://t.me/MiniAppExpertDemoBot" target="_blank" rel="noopener" class="$1">
                        🎮 Попробовать демо
                    </a>
                    <a href="/payment.html?product=Mini App для недвижимости&price=150000" class="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition">
                        💳 Оплатить сейчас - 150 000 ₽
                    </a>
                    <div class="text-center">
                        <img src="https://acdn.tinkoff.ru/static/documents/logo.svg" alt="T-Bank" class="h-6 inline-block mr-2">
                        <span class="text-sm text-gray-600">Рассрочка 0-0-12 без переплат</span>
                    </div>`
);

fs.writeFileSync('real-estate-solution.html', realEstate, 'utf8');
console.log('  ✅ Payment button added');

console.log('\n✅ Payment buttons added!');
console.log('\n📄 Updated files:');
console.log('  - real-estate-solution.html');
console.log('\n🔗 Payment flow:');
console.log('  1. User clicks "Оплатить сейчас"');
console.log('  2. Redirects to /payment.html');
console.log('  3. Choose payment method (full/installment)');
console.log('  4. T-Bank payment window opens');
console.log('  5. Success → /payment-success.html');

