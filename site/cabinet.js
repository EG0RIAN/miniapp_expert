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
        window.location.href = '/login.html';
    }
}

// ===== Per-user namespaced storage helpers =====
function getUserEmail() {
    return localStorage.getItem('userEmail') || '';
}

function getNsKey(key) {
    const email = getUserEmail();
    const safe = email ? email.toLowerCase() : 'anon';
    return `user:${safe}:${key}`;
}

function setUserData(key, value) {
    try { localStorage.setItem(getNsKey(key), JSON.stringify(value)); } catch (_) {}
}

function getUserData(key, fallback = null) {
    try {
        const raw = localStorage.getItem(getNsKey(key));
        return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
        return fallback;
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
    setUserData('name', name);
    setUserData('phone', phone);
    
    alert('✅ Профиль сохранен!');
    loadProfile();
}

// Load profile
function loadProfile() {
    const email = getUserEmail();
    const name = getUserData('name', 'Клиент');
    const phone = getUserData('phone', '');
    const regDate = getUserData('registrationDate', null);
    
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
    const products = getUserData('products', []);
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        // Nothing to render yet
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

// Load subscriptions
function loadSubscriptions() {
    const subs = getUserData('subscriptions', []);
    const container = document.getElementById('subscriptionsList');
    if (!container) return;
    if (!Array.isArray(subs) || subs.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">Подписок пока нет</div>';
        return;
    }
    container.innerHTML = subs.map(s => `
        <div class="bg-white rounded-2xl shadow p-4 border-2 border-gray-100">
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold">${s.name || 'Подписка'}</div>
                    <div class="text-xs text-gray-500">Следующий платеж: ${formatDate(s.nextPayment)}</div>
                </div>
                <div class="text-primary font-bold">${formatAmountRub(s.price || 0)}</div>
            </div>
            <div class="mt-2 text-xs">Статус: ${s.status || 'active'}</div>
        </div>
    `).join('');
}

// Format helpers
function formatAmountRub(amount) {
    try { return Number(amount || 0).toLocaleString('ru-RU') + ' ₽'; } catch (_) { return amount + ' ₽'; }
}

function formatDate(dateStr) {
    try { return new Date(dateStr).toLocaleDateString('ru-RU'); } catch (_) { return dateStr || '-'; }
}

function renderStatusBadge(status) {
    const ok = status === 'CONFIRMED' || status === 'AUTHORIZED' || status === 'PAID' || status === 'CONFIRMING';
    const cls = ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
    const text = ok ? 'Оплачено' : (status || '—');
    return `<span class="${cls} px-3 py-1 rounded-full text-xs font-bold">${text}</span>`;
}

// Load payments from backend
async function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    try {
        const email = localStorage.getItem('userEmail') || '';
        const phone = getUserData('phone', '');
        const params = new URLSearchParams();
        if (email) params.append('email', email);
        if (phone) params.append('phone', phone);

        const res = await fetch(`/api/payments?${params.toString()}`);
        const data = await res.json();

        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Платежей пока нет</td></tr>`;
            document.getElementById('paymentsTotal').textContent = '0 ₽';
            return;
        }

        let total = 0;
        tbody.innerHTML = items.map(p => {
            total += Number(p.amount || 0);
            const receiptBtn = p.paymentId ? `<button class="text-secondary hover:text-secondary/80 font-semibold text-sm" onclick="downloadReceipt('${p.paymentId}')">📄 Скачать</button>` : '<span class="text-gray-400 text-sm">—</span>';
            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${formatDate(p.createdAt)}</td>
                    <td class="px-6 py-4 text-sm font-semibold">${p.description || 'Оплата заказа'}</td>
                    <td class="px-6 py-4 text-sm font-bold text-primary">${formatAmountRub((p.amount || 0))}</td>
                    <td class="px-6 py-4">${renderStatusBadge(p.status)}</td>
                    <td class="px-6 py-4">${receiptBtn}</td>
                </tr>`;
        }).join('');

        document.getElementById('paymentsTotal').textContent = formatAmountRub(total);
    } catch (e) {
        console.error('Load payments error:', e);
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-red-500">Ошибка загрузки платежей</td></tr>`;
    }
}

// Download receipt via backend
async function downloadReceipt(paymentId) {
    try {
        const res = await fetch(`/api/payment/receipt?paymentId=${encodeURIComponent(paymentId)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Receipt not available');

        const blob = new Blob([data.html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${paymentId}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Receipt download error:', e);
        alert('Чек пока недоступен. Проверьте почту — фискальный чек отправляется банком.');
    }
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
    const userEmail = getUserEmail();
    const userId = userEmail.split('@')[0].toUpperCase();
    
    // Generate referral link
    document.getElementById('referralLink').value = `https://miniapp.expert/?ref=${userId}`;
    
    // Load referrals from localStorage
    const referrals = getUserData('referrals', []);
    
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

    // Load payments when opening payments section or on hash
    if (window.location.hash === '#payments') {
        showSection('payments');
        loadPayments();
    }

    // Observe sidebar clicks to trigger loadPayments
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (link.dataset.section === 'payments') {
                setTimeout(loadPayments, 0);
            }
        });
    });
    
    // Load partners data if on partners section
    if (window.location.hash === '#partners') {
        showSection('partners');
        loadPartnersData();
    }
    
    // No demo referrals seeding
});



