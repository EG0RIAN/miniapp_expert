// API Configuration
const API_BASE_URL = '/api';

// Get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('userToken');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return null;
        }
        
        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error('API request error:', error);
        return { error };
    }
}

// Check authentication
function checkAuth() {
    const token = getAuthToken();
    const userAuth = localStorage.getItem('userAuth');
    
    if (!token || userAuth !== 'true') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('userAuth');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
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
    const section = document.getElementById(`section-${sectionId}`);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Update sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('sidebar-active');
        if (link.dataset.section === sectionId) {
            link.classList.add('sidebar-active');
        }
    });
    
    // Update URL hash
    window.location.hash = sectionId;
    
    // Reload section data from API (data might have changed)
    switch(sectionId) {
        case 'products':
            loadProducts();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'partners':
            loadPartnersData();
            break;
    }
}

// Load user profile
async function loadProfile() {
    try {
        const result = await apiRequest('/auth/profile/');
        if (!result || result.error) {
            console.error('Failed to load profile:', result?.error);
            // Show error but don't block
            if (document.getElementById('userName')) {
                document.getElementById('userName').textContent = 'Ошибка загрузки';
            }
            return;
        }
        
        const user = result.data;
        
        // Update header
        const userName = user.name || user.email?.split('@')[0] || 'Клиент';
        const userEmail = user.email || '';
        const userInitial = userName.charAt(0).toUpperCase();
        
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = userName;
        }
        if (document.getElementById('userEmail')) {
            document.getElementById('userEmail').textContent = userEmail;
        }
        if (document.getElementById('userInitial')) {
            document.getElementById('userInitial').textContent = userInitial;
        }
        
        // Update profile form
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').value = user.name || '';
        }
        if (document.getElementById('profileEmail')) {
            document.getElementById('profileEmail').value = userEmail;
        }
        if (document.getElementById('profilePhone')) {
            document.getElementById('profilePhone').value = user.phone || '';
        }
        if (document.getElementById('profileDisplayName')) {
            document.getElementById('profileDisplayName').textContent = userName;
        }
        if (document.getElementById('profileDisplayEmail')) {
            document.getElementById('profileDisplayEmail').textContent = userEmail;
        }
        if (document.getElementById('profileInitial')) {
            document.getElementById('profileInitial').textContent = userInitial;
        }
        
        // Update member since
        if (user.created_at && document.getElementById('memberSince')) {
            const date = new Date(user.created_at);
            const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ];
            document.getElementById('memberSince').textContent = 
                monthNames[date.getMonth()] + ' ' + date.getFullYear();
        }
        
        // Update statistics from dashboard
        await loadDashboardStats();
    } catch (error) {
        console.error('Error in loadProfile:', error);
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const result = await apiRequest('/client/dashboard/');
        if (!result || result.error) {
            console.error('Failed to load dashboard:', result?.error);
            // Set defaults
            if (document.getElementById('statsProducts')) {
                document.getElementById('statsProducts').textContent = '0';
            }
            if (document.getElementById('statsSubscriptions')) {
                document.getElementById('statsSubscriptions').textContent = '0';
            }
            if (document.getElementById('statsPayments')) {
                document.getElementById('statsPayments').textContent = '0';
            }
            return;
        }
        
        const dashboard = result.data;
        
        // Update statistics
        if (document.getElementById('statsProducts')) {
            document.getElementById('statsProducts').textContent = dashboard.active_products || 0;
        }
        if (document.getElementById('statsSubscriptions')) {
            document.getElementById('statsSubscriptions').textContent = dashboard.subscriptions || 0;
        }
        if (document.getElementById('statsPayments')) {
            document.getElementById('statsPayments').textContent = dashboard.total_payments || 0;
        }
    } catch (error) {
        console.error('Error in loadDashboardStats:', error);
    }
}

// Save profile
async function saveProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    
    const result = await apiRequest('/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone }),
    });
    
    if (!result || result.error) {
        alert('❌ Ошибка сохранения профиля');
        return;
    }
    
    if (result.response.ok) {
        alert('✅ Профиль сохранен!');
        loadProfile();
    } else {
        alert('❌ ' + (result.data.message || 'Ошибка сохранения'));
    }
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('❌ Новые пароли не совпадают');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('❌ Пароль должен содержать минимум 6 символов');
        return;
    }
    
    // Note: Password change endpoint needs to be implemented in Django
    alert('⚠️ Изменение пароля временно недоступно. Обратитесь в поддержку.');
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Load products
async function loadProducts() {
    try {
        const result = await apiRequest('/client/products/');
        if (!result || result.error) {
            console.error('Failed to load products:', result?.error);
            showProductsError();
            return;
        }
        
        const products = result.data.products || result.data || [];
        const container = document.getElementById('productsList');
        
        if (!container) {
            console.error('Products container not found');
            return;
        }
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i data-lucide="package" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                    <p class="text-lg font-semibold mb-2">У вас пока нет продуктов</p>
                    <p class="text-sm mb-4">Закажите первый продукт и он появится здесь</p>
                    <a href="/real-estate-solution.html" class="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                        Заказать продукт
                    </a>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        container.innerHTML = products.map(product => {
            const statusClass = product.status === 'active' ? 'bg-green-500' : 
                               product.status === 'expired' ? 'bg-gray-500' : 'bg-yellow-500';
            const statusText = product.status === 'active' ? 'Активно' : 
                              product.status === 'expired' ? 'Истекло' : 
                              product.status === 'pending' ? 'Ожидает' : 
                              product.status === 'cancelled' ? 'Отменено' : 'Неизвестно';
            const startDate = product.start_date ? new Date(product.start_date).toLocaleDateString('ru-RU') : '-';
            const endDate = product.end_date ? new Date(product.end_date).toLocaleDateString('ru-RU') : null;
            const productName = product.product?.name || 'Продукт';
            const productDescription = product.product?.description || '';
            const renewalPrice = product.renewal_price || product.product?.price || 0;
            const isSubscription = product.product?.product_type === 'subscription';
            
            return `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-primary/20 card-hover">
                    <div class="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                        <i data-lucide="package" class="w-16 h-16 text-primary"></i>
                        <div class="absolute top-4 right-4">
                            <span class="${statusClass} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <i data-lucide="check-circle" class="w-3 h-3"></i>
                                <span>${statusText}</span>
                            </span>
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">${productName}</h3>
                        ${productDescription ? `<p class="text-gray-600 mb-2 text-sm">${productDescription.substring(0, 100)}${productDescription.length > 100 ? '...' : ''}</p>` : ''}
                        <p class="text-gray-600 mb-2 text-sm">Дата запуска: ${startDate}</p>
                        ${endDate ? `<p class="text-gray-600 mb-4 text-sm">Действует до: ${endDate}</p>` : ''}
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <a href="#" class="bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary/90 transition text-sm">
                                Приложение
                            </a>
                            <a href="#" class="border-2 border-primary text-primary text-center py-3 rounded-xl font-semibold hover:bg-primary/10 transition text-sm">
                                Админка
                            </a>
                        </div>
                        ${isSubscription && product.status === 'active' ? `
                            <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${renewalPrice}" 
                               class="block bg-gradient-to-r from-secondary to-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-xl transition flex items-center justify-center gap-2 mt-2">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span>Продлить подписку</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error in loadProducts:', error);
        showProductsError();
    }
}

function showProductsError() {
    const container = document.getElementById('productsList');
    container.innerHTML = `
        <div class="col-span-2 text-center py-12 text-red-500">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4"></i>
            <p>Ошибка загрузки продуктов</p>
        </div>
    `;
    lucide.createIcons();
}

// Load subscriptions
async function loadSubscriptions() {
    try {
        const result = await apiRequest('/client/products/');
        if (!result || result.error) {
            console.error('Failed to load subscriptions:', result?.error);
            const container = document.getElementById('subscriptionsList');
            if (container) {
                container.innerHTML = `
                    <div class="col-span-2 text-center py-12 text-red-500">
                        <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4"></i>
                        <p>Ошибка загрузки подписок</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
            return;
        }
        
        const products = result.data.products || result.data || [];
        const subscriptions = products.filter(p => p.product?.product_type === 'subscription');
        const container = document.getElementById('subscriptionsList');
        
        if (!container) {
            return;
        }
        
        if (subscriptions.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i data-lucide="repeat" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                    <p class="text-lg font-semibold mb-2">У вас пока нет подписок</p>
                    <p class="text-sm mb-4">Оформите подписку на один из наших продуктов</p>
                    <a href="/real-estate-solution.html" class="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                        Оформить подписку
                    </a>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        container.innerHTML = subscriptions.map(sub => {
            const statusClass = sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
            const statusText = sub.status === 'active' ? 'Активна' : 'Неактивна';
            const nextPayment = sub.end_date ? new Date(sub.end_date).toLocaleDateString('ru-RU') : '-';
            const price = sub.renewal_price || sub.product?.price || 0;
            const productName = sub.product?.name || 'Подписка';
            const productDescription = sub.product?.description || '';
            const subscriptionPeriod = sub.product?.subscription_period || 'monthly';
            const periodText = subscriptionPeriod === 'monthly' ? 'мес' : subscriptionPeriod === 'yearly' ? 'год' : '';
            
            return `
                <div class="bg-white rounded-2xl shadow-sm p-6 border-2 ${sub.status === 'active' ? 'border-green-500/20' : 'border-gray-200'}">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold">${productName}</h3>
                        <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold">
                            ${statusText}
                        </span>
                    </div>
                    ${productDescription ? `<p class="text-gray-600 mb-4">${productDescription.substring(0, 150)}${productDescription.length > 150 ? '...' : ''}</p>` : ''}
                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Стоимость:</span>
                            <span class="font-bold">${formatAmountRub(price)}/${periodText || 'мес'}</span>
                        </div>
                        ${sub.start_date ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Начало подписки:</span>
                                <span class="font-semibold">${new Date(sub.start_date).toLocaleDateString('ru-RU')}</span>
                            </div>
                        ` : ''}
                        ${sub.status === 'active' && sub.end_date ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Следующий платеж:</span>
                                <span class="font-bold">${nextPayment}</span>
                            </div>
                        ` : ''}
                        ${sub.status === 'expired' && sub.end_date ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Истекла:</span>
                                <span class="font-bold text-red-600">${nextPayment}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${sub.status === 'active' ? `
                        <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${price}" 
                           class="block w-full bg-gradient-to-r from-secondary to-blue-600 text-white py-2 rounded-xl font-semibold hover:shadow-xl transition text-center mb-2">
                            Продлить подписку
                        </a>
                        <button class="w-full border-2 border-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-50 transition">
                            Управлять подпиской
                        </button>
                    ` : `
                        <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${price}" 
                           class="block w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/90 transition text-center">
                            Подключить за ${formatAmountRub(price)}
                        </a>
                    `}
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error in loadSubscriptions:', error);
    }
}

// Load payments
async function loadPayments() {
    try {
        const result = await apiRequest('/client/payments/');
        if (!result || result.error) {
            console.error('Failed to load payments:', result?.error);
            showPaymentsError();
            return;
        }
        
        const payments = result.data.payments || result.data || [];
        const total = result.data.total_amount || 0;
        const tbody = document.getElementById('paymentsTableBody');
        
        if (!tbody) {
            console.error('Payments table body not found');
            return;
        }
        
        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Платежей пока нет</td></tr>`;
            if (document.getElementById('paymentsTotal')) {
                document.getElementById('paymentsTotal').textContent = '0 ₽';
            }
            return;
        }
        
        tbody.innerHTML = payments.map(payment => {
            const statusClass = payment.status === 'success' || payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                               payment.status === 'failed' || payment.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                               payment.status === 'pending' || payment.status === 'NEW' || payment.status === 'AUTHORIZING' ? 'bg-yellow-100 text-yellow-700' :
                               'bg-gray-100 text-gray-700';
            const statusText = payment.status === 'success' || payment.status === 'CONFIRMED' ? 'Оплачено' : 
                              payment.status === 'failed' || payment.status === 'REJECTED' ? 'Ошибка' : 
                              payment.status === 'pending' || payment.status === 'NEW' ? 'Ожидает' :
                              payment.status === 'AUTHORIZING' ? 'Авторизация' :
                              payment.status || 'Неизвестно';
            const date = payment.created_at ? new Date(payment.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
            const description = payment.order?.description || 
                               payment.order?.product?.name || 
                               payment.description || 
                               'Оплата заказа';
            const amount = payment.amount || 0;
            const currency = payment.currency || 'RUB';
            const receiptBtn = payment.receipt_url ? 
                `<a href="${payment.receipt_url}" target="_blank" class="text-secondary hover:text-secondary/80 font-semibold text-sm flex items-center gap-1">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>Скачать</span>
                </a>` : 
                '<span class="text-gray-400 text-sm">—</span>';
            const method = payment.method || payment.order?.payment_method || '';
            const methodText = method === 'card' ? '💳 Карта' : 
                              method === 'mit' ? '💳 Автосписание' :
                              method === 'rko' ? '🏦 РКО' :
                              method ? method : '';
            
            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${date}</td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-semibold">${description}</div>
                        ${methodText ? `<div class="text-xs text-gray-500">${methodText}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-primary">${formatAmountRub(amount)}</td>
                    <td class="px-6 py-4">
                        <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold">${statusText}</span>
                    </td>
                    <td class="px-6 py-4">${receiptBtn}</td>
                </tr>
            `;
        }).join('');
        
        if (document.getElementById('paymentsTotal')) {
            document.getElementById('paymentsTotal').textContent = formatAmountRub(total);
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error in loadPayments:', error);
        showPaymentsError();
    }
}

function showPaymentsError() {
    const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-red-500">Ошибка загрузки платежей</td></tr>`;
}

// Format helpers
function formatAmountRub(amount) {
    try {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
    } catch (_) {
        return amount + ' ₽';
    }
}

// Load partners data
async function loadPartnersData() {
    try {
        const result = await apiRequest('/client/referrals/');
        if (!result || result.error) {
            console.error('Failed to load referrals:', result?.error);
            // Set defaults
            if (document.getElementById('totalReferrals')) {
                document.getElementById('totalReferrals').textContent = '0';
            }
            if (document.getElementById('totalEarned')) {
                document.getElementById('totalEarned').textContent = '0 ₽';
            }
            if (document.getElementById('availableBalance')) {
                document.getElementById('availableBalance').textContent = '0 ₽';
            }
            if (document.getElementById('withdrawBalance')) {
                document.getElementById('withdrawBalance').textContent = '0 ₽';
            }
            if (document.getElementById('conversionRate')) {
                document.getElementById('conversionRate').textContent = '0%';
            }
            if (document.getElementById('referralLink')) {
                // Try to get referral code from profile
                const profileResult = await apiRequest('/auth/profile/');
                if (profileResult && profileResult.data && profileResult.data.referral_code) {
                    document.getElementById('referralLink').value = `https://miniapp.expert/?ref=${profileResult.data.referral_code}`;
                }
            }
            return;
        }
        
        const data = result.data;
        const stats = data.stats || {};
        const referrals = data.referrals || [];
        
        // Update stats
        if (document.getElementById('totalReferrals')) {
            document.getElementById('totalReferrals').textContent = stats.total_referrals || 0;
        }
        if (document.getElementById('totalEarned')) {
            document.getElementById('totalEarned').textContent = formatAmountRub(stats.total_earned || 0);
        }
        if (document.getElementById('availableBalance')) {
            document.getElementById('availableBalance').textContent = formatAmountRub(stats.available_balance || 0);
        }
        if (document.getElementById('withdrawBalance')) {
            document.getElementById('withdrawBalance').textContent = formatAmountRub(stats.available_balance || 0);
        }
        
        const conversionRate = stats.total_referrals > 0 && stats.active_referrals > 0 ? 
            ((stats.active_referrals / stats.total_referrals) * 100).toFixed(0) : 0;
        if (document.getElementById('conversionRate')) {
            document.getElementById('conversionRate').textContent = conversionRate + '%';
        }
        
        // Update referral link
        if (document.getElementById('referralLink')) {
            document.getElementById('referralLink').value = data.referral_link || '';
        }
        
        // Update referrals table
        const tbody = document.getElementById('referralsTableBody');
        if (tbody) {
            if (referrals.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center p-8 text-gray-500">
                            Пока нет рефералов. Поделитесь ссылкой!
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = referrals.map(ref => {
                    const date = ref.created_at ? new Date(ref.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : '-';
                    const statusClass = ref.status === 'active' ? 'bg-green-100 text-green-700' : 
                                       ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                       'bg-gray-100 text-gray-600';
                    const statusText = ref.status === 'active' ? 'Активен' : 
                                      ref.status === 'pending' ? 'Ожидает' :
                                      ref.status === 'inactive' ? 'Неактивен' :
                                      ref.status === 'cancelled' ? 'Отменен' : 'Неизвестно';
                    const referredUserName = ref.referred_user?.name || ref.referred_user?.email?.split('@')[0] || 'Пользователь';
                    const referredUserEmail = ref.referred_user?.email || '';
                    const totalEarned = ref.total_earned || 0;
                    const paidOut = ref.paid_out || 0;
                    const available = totalEarned - paidOut;
                    
                    return `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="p-4">
                                <div class="font-semibold">${referredUserName}</div>
                                <div class="text-xs text-gray-500">${referredUserEmail}</div>
                            </td>
                            <td class="p-4 text-sm text-gray-600">${date}</td>
                            <td class="p-4">
                                <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold">
                                    ${statusText}
                                </span>
                            </td>
                            <td class="p-4">
                                <div class="font-bold text-primary">+${formatAmountRub(totalEarned)}</div>
                                ${paidOut > 0 ? `<div class="text-xs text-gray-500">Выплачено: ${formatAmountRub(paidOut)}</div>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
        // Load payout history
        await loadPayoutHistory();
    } catch (error) {
        console.error('Error in loadPartnersData:', error);
    }
}

// Load payout history
async function loadPayoutHistory() {
    try {
        const result = await apiRequest('/client/referrals/payouts/');
        if (!result || result.error) {
            console.error('Failed to load payouts:', result?.error);
            const container = document.getElementById('withdrawalHistory');
            if (container) {
                container.innerHTML = '<div class="text-center p-8 text-gray-500">Ошибка загрузки истории выплат</div>';
            }
            return;
        }
        
        const payouts = result.data.payouts || result.data || [];
        const container = document.getElementById('withdrawalHistory');
        
        if (!container) {
            return;
        }
        
        if (payouts.length === 0) {
            container.innerHTML = '<div class="text-center p-8 text-gray-500">История выплат пуста</div>';
            return;
        }
        
        container.innerHTML = payouts.map(payout => {
            const date = payout.created_at ? new Date(payout.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
            const statusClass = payout.status === 'paid' ? 'bg-green-100 text-green-700' : 
                               payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                               payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                               payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                               'bg-gray-100 text-gray-700';
            const statusText = payout.status === 'paid' ? 'Выплачено' : 
                              payout.status === 'pending' ? 'Ожидает' : 
                              payout.status === 'processing' ? 'Обрабатывается' :
                              payout.status === 'failed' ? 'Ошибка' :
                              payout.status === 'cancelled' ? 'Отменено' :
                              payout.status || 'Неизвестно';
            const amount = payout.amount || 0;
            const method = payout.payment_method || '';
            const methodText = method === 'card' ? '💳 Карта' : 
                              method === 'yoomoney' ? '💵 ЮMoney' :
                              method === 'qiwi' ? '💸 Qiwi' :
                              method === 'paypal' ? '💳 PayPal' :
                              method || '';
            const notes = payout.notes || '';
            
            return `
                <div class="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50">
                    <div class="flex-1">
                        <div class="font-semibold text-lg">${formatAmountRub(amount)}</div>
                        <div class="text-sm text-gray-500">${date}</div>
                        ${methodText ? `<div class="text-xs text-gray-400 mt-1">${methodText}</div>` : ''}
                        ${notes ? `<div class="text-xs text-gray-400 mt-1">${notes}</div>` : ''}
                    </div>
                    <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold ml-4">
                        ${statusText}
                    </span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error in loadPayoutHistory:', error);
    }
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
    const balance = parseFloat(document.getElementById('availableBalance').textContent.replace(/[^\d.]/g, '')) || 0;
    
    if (balance === 0) {
        alert('⚠️ Недостаточно средств для вывода.\n\nПригласите клиентов, чтобы начать зарабатывать!');
        return;
    }
    
    const amount = prompt(`Доступно: ${formatAmountRub(balance)}\n\nВведите сумму для вывода:`);
    if (!amount) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > balance) {
        alert('❌ Неверная сумма');
        return;
    }
    
    const method = prompt('Выберите способ вывода:\n\n' +
                          '1. Банковская карта\n' +
                          '2. ЮMoney\n' +
                          '3. Qiwi\n' +
                          '4. PayPal\n\n' +
                          'Введите номер (1-4):');
    
    if (!method || method < 1 || method > 4) {
        return;
    }
    
    const methods = ['card', 'yoomoney', 'qiwi', 'paypal'];
    requestPayout(amountNum, methods[method - 1]);
}

// Request payout
async function requestPayout(amount, method) {
    const result = await apiRequest('/client/referrals/request-payout/', {
        method: 'POST',
        body: JSON.stringify({ amount, payment_method: method }),
    });
    
    if (!result || result.error) {
        alert('❌ Ошибка создания заявки на вывод');
        return;
    }
    
    if (result.response.ok) {
        alert(`✅ Заявка на вывод ${formatAmountRub(amount)} через ${method} создана!\n\n` +
              'Средства поступят в течение 1-3 рабочих дней.');
        loadPartnersData();
    } else {
        alert('❌ ' + (result.data.message || 'Ошибка создания заявки'));
    }
}

// Initialize - Load all data from API
document.addEventListener('DOMContentLoaded', async function() {
    // Check auth
    if (!checkAuth()) return;
    
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
    
    try {
        // Load profile first (this also loads dashboard stats)
        await loadProfile();
        
        // Pre-load all sections data in parallel
        await Promise.all([
            loadProducts(),
            loadSubscriptions(),
            loadPayments(),
            loadPartnersData()
        ]);
        
        // Check hash for section
        const hash = window.location.hash.replace('#', '');
        if (hash && ['products', 'subscriptions', 'payments', 'profile', 'partners'].includes(hash)) {
            showSection(hash);
        } else {
            showSection('products');
        }
    } catch (error) {
        console.error('Error loading cabinet data:', error);
        alert('❌ Ошибка загрузки данных. Обновите страницу.');
    } finally {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Refresh icons periodically (for dynamic content)
    setInterval(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 1000);
});
