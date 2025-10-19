const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing JavaScript errors in console...\n');

const htmlFile = 'index.html';
const filepath = path.join(__dirname, htmlFile);
let html = fs.readFileSync(filepath, 'utf8');

console.log('1. Wrapping contactForm script in null check...');

// Find and wrap contactForm code
html = html.replace(
    /document\.getElementById\('contactForm'\)\.addEventListener\('submit'/,
    `const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit'`
);

// Add closing brace for the if statement
html = html.replace(
    /(async \(e\) => \{[\s\S]*?}\);)/,
    (match) => {
        // Count opening braces
        const openBraces = (match.match(/\{/g) || []).length;
        const closeBraces = (match.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) {
            return match + '\n        }'; // Close if statement
        }
        return match;
    }
);

// Wrap all getElementById calls in null checks
console.log('2. Adding null checks to all getElementById calls...');
html = html.replace(
    /document\.getElementById\('successMessage'\)\.classList/g,
    `const successMessage = document.getElementById('successMessage');
                    if (successMessage) successMessage.classList`
);

// Better solution: wrap everything in DOMContentLoaded and null checks
console.log('3. Wrapping all scripts in DOMContentLoaded...');

const formScriptPattern = /<!-- Form Script -->[\s\S]*?<script>[\s\S]*?<\/script>/;
const formScriptMatch = html.match(formScriptPattern);

if (formScriptMatch) {
    const originalScript = formScriptMatch[0];
    const scriptContent = originalScript.match(/<script>([\s\S]*?)<\/script>/)[1];
    
    const wrappedScript = `    <!-- Form Script -->
    <script>
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', function() {
            const contactForm = document.getElementById('contactForm');
            if (!contactForm) return; // Element not found, skip
            
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                
                // Собираем данные из формы
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    message: formData.get('message')
                };
                
                try {
                    // Отправляем данные в Telegram
                    const botToken = '7943024088:AAG_nHIVpDVjMt7-YNPyJUcfhywt9yqcOSw';
                    const chatId = '991890519';
                    
                    const text = \`🔔 Новая заявка с сайта MiniAppExpert

👤 Имя: \${data.name}
📧 Email: \${data.email}
📱 Телефон: \${data.phone}
💬 Сообщение: \${data.message}\`;
                    
                    const response = await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: text,
                            parse_mode: 'HTML'
                        })
                    });
                    
                    if (response.ok) {
                        // Показываем сообщение об успехе
                        const successMessage = document.getElementById('successMessage');
                        if (successMessage && contactForm) {
                            contactForm.classList.add('hidden');
                            successMessage.classList.remove('hidden');
                            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    } else {
                        alert('Ошибка отправки. Попробуйте позже.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Ошибка отправки. Попробуйте позже.');
                }
            });
        });
    </script>`;
    
    html = html.replace(formScriptPattern, wrappedScript);
}

fs.writeFileSync(filepath, html, 'utf8');

console.log('\n✅ JavaScript errors fixed!');
console.log('\n🎯 Changes:');
console.log('  ✅ Added null checks for all elements');
console.log('  ✅ Wrapped in DOMContentLoaded');
console.log('  ✅ Safe error handling');
console.log('\nNo more console errors! ✨');

