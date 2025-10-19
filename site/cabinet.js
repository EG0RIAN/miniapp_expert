// Check authentication
function checkAuth() {
    if (localStorage.getItem('userAuth') !== 'true') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('userAuth');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        window.location.href = '/login.html';
    }
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.cabinet-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');
    
    // Update sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('sidebar-active');
        if (link.dataset.section === sectionId) {
            link.classList.add('sidebar-active');
        }
    });
}

// Save profile
function saveProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    
    localStorage.setItem('userName', name);
    localStorage.setItem('userPhone', phone);
    
    alert('✅ Профиль сохранен!');
    loadProfile();
}

// Load profile
function loadProfile() {
    const name = localStorage.getItem('userName') || 'Клиент';
    const email = localStorage.getItem('userEmail') || '';
    const phone = localStorage.getItem('userPhone') || '';
    const regDate = localStorage.getItem('userRegistrationDate');
    
    // Update header
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userInitial').textContent = name.charAt(0).toUpperCase();
    
    // Update profile form
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = name;
        document.getElementById('profileEmail').value = email;
        document.getElementById('profilePhone').value = phone;
        document.getElementById('profileDisplayName').textContent = name;
        document.getElementById('profileDisplayEmail').textContent = email;
        document.getElementById('profileInitial').textContent = name.charAt(0).toUpperCase();
    }
    
    // Update member since
    if (regDate) {
        const date = new Date(regDate);
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        document.getElementById('memberSince').textContent = 
            monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }
}

// Load products
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('userProducts') || '[]');
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        // Show demo product if no products
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-primary/20">
            <div class="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                <span class="text-6xl">${product.icon || '📱'}</span>
                <div class="absolute top-4 right-4">
                    <span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ✅ ${product.status || 'Активно'}
                    </span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4 text-sm">Дата запуска: ${product.date || '-'}</p>
                <div class="flex gap-2">
                    <a href="${product.appLink || '#'}" target="_blank" class="flex-1 bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                        Открыть приложение
                    </a>
                    <a href="${product.adminLink || '#'}" target="_blank" class="flex-1 border-2 border-primary text-primary text-center py-3 rounded-xl font-semibold hover:bg-primary/10 transition">
                        Админ-панель
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Open admin panel
function openAdminPanel() {
    alert('🔐 Данные для входа в админ-панель:\n\n' +
          'Ссылка: https://your-agency.miniapp.expert/admin\n' +
          'Логин: admin\n' +
          'Пароль: [был отправлен на email]\n\n' +
          'Проверьте почту!');
}

// Copy referral link
function copyReferralLink() {
    const link = document.getElementById('referralLink');
    link.select();
    document.execCommand('copy');
    alert('✅ Ссылка скопирована!');
}

// Share to Telegram
function shareToTelegram() {
    const link = document.getElementById('referralLink').value;
    const text = '🚀 Создай своё Telegram Mini App вместе с MiniAppExpert!\n\n' +
                 '💰 Специальное предложение для тебя: используй мою реферальную ссылку и получи бонус!\n\n';
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Share to WhatsApp
function shareToWhatsApp() {
    const link = document.getElementById('referralLink').value;
    const text = '🚀 Создай своё Telegram Mini App вместе с MiniAppExpert!\n\n' +
                 '💰 Специальное предложение: используй мою реферальную ссылку!\n\n' + link;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Share by Email
function shareByEmail() {
    const link = document.getElementById('referralLink').value;
    const subject = 'Создай своё Telegram Mini App!';
    const body = 'Привет!\n\n' +
                 'Я пользуюсь MiniAppExpert для создания Telegram Mini Apps и очень доволен!\n\n' +
                 'Используй мою реферальную ссылку для получения бонуса:\n' + link + '\n\n' +
                 'С уважением!';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Open withdraw modal
function openWithdrawModal() {
    const balance = parseFloat(document.getElementById('availableBalance').textContent) || 0;
    
    if (balance === 0) {
        alert('⚠️ Недостаточно средств для вывода.\n\nПригласите клиентов, чтобы начать зарабатывать!');
        return;
    }
    
    const method = prompt('Выберите способ вывода:\n\n' +
                          '1. Банковская карта\n' +
                          '2. ЮMoney\n' +
                          '3. Qiwi\n' +
                          '4. PayPal\n\n' +
                          'Введите номер (1-4):');
    
    if (method && method >= 1 && method <= 4) {
        const methods = ['Банковская карта', 'ЮMoney', 'Qiwi', 'PayPal'];
        alert(`✅ Заявка на вывод ${balance} ₽ через ${methods[method-1]} создана!\n\n` +
              'Средства поступят в течение 1-3 рабочих дней.');
    }
}

// Load partners data
function loadPartnersData() {
    // Get user ID
    const userEmail = localStorage.getItem('userEmail') || '';
    const userId = userEmail.split('@')[0].toUpperCase();
    
    // Generate referral link
    document.getElementById('referralLink').value = `https://miniapp.expert/?ref=${userId}`;
    
    // Load referrals from localStorage
    const referrals = JSON.parse(localStorage.getItem('userReferrals') || '[]');
    
    // Calculate stats
    const totalReferrals = referrals.length;
    const totalEarned = referrals.reduce((sum, ref) => sum + (ref.earned || 0), 0);
    const availableBalance = totalEarned;
    const conversionRate = referrals.length > 0 ? 
        (referrals.filter(r => r.purchased).length / referrals.length * 100).toFixed(0) : 0;
    
    // Update stats
    document.getElementById('totalReferrals').textContent = totalReferrals;
    document.getElementById('totalEarned').textContent = `${totalEarned.toLocaleString('ru-RU')} ₽`;
    document.getElementById('availableBalance').textContent = `${availableBalance.toLocaleString('ru-RU')} ₽`;
    document.getElementById('withdrawBalance').textContent = `${availableBalance.toLocaleString('ru-RU')} ₽`;
    document.getElementById('conversionRate').textContent = `${conversionRate}%`;
    
    // Load referrals table
    if (referrals.length > 0) {
        const tbody = document.getElementById('referralsTableBody');
        tbody.innerHTML = referrals.map(ref => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="p-4">
                    <div class="font-semibold">${ref.name}</div>
                    <div class="text-xs text-gray-500">${ref.email}</div>
                </td>
                <td class="p-4 text-sm text-gray-600">${ref.registrationDate}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${ref.purchased ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                        ${ref.purchased ? '✅ Купил' : '⏳ Не купил'}
                    </span>
                </td>
                <td class="p-4">
                    <span class="font-bold text-primary">+${(ref.earned || 0).toLocaleString('ru-RU')} ₽</span>
                </td>
            </tr>
        `).join('');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    if (!checkAuth()) return;
    
    // Load profile
    loadProfile();
    
    // Load products
    loadProducts();
    
    // Load partners data if on partners section
    if (window.location.hash === '#partners') {
        showSection('partners');
        loadPartnersData();
    }
    
    // Demo referrals data (for testing)
    if (!localStorage.getItem('userReferrals')) {
        localStorage.setItem('userReferrals', JSON.stringify([
            {
                name: 'Иван Иванов',
                email: 'ivan@example.com',
                registrationDate: '15.10.2025',
                purchased: true,
                earned: 5000
            },
            {
                name: 'Петр Петров',
                email: 'petr@example.com',
                registrationDate: '17.10.2025',
                purchased: false,
                earned: 0
            }
        ]));
    }
});



