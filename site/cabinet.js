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
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('API Request:', url, { headers, ...options });
        
        const response = await fetch(url, {
            ...options,
            headers,
        });
        
        console.log('API Response status:', response.status, response.statusText);
        
        if (response.status === 401) {
            // Token expired or invalid
            console.error('Unauthorized - redirecting to login');
            logout();
            return null;
        }
        
        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('API Error body:', errorText);
            return { error: { status: response.status, message: errorText } };
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        // API returns data directly, not wrapped in 'data' field
        return { response, data: data };
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
        localStorage.removeItem('userAuth');
    localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
        window.location.href = '/login.html';
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
        case 'cards':
            loadPaymentMethods();
            break;
    }
}

// Load user profile - ONLY from API, never from localStorage
async function loadProfile() {
    try {
        console.log('🔄 Loading profile from API...');
        
        // Clear any localStorage data that might be displayed
        // We ONLY use API data, never localStorage for profile display
        console.log('🧹 Clearing localStorage profile data (using API only)');
        
        const result = await apiRequest('/auth/profile/');
        console.log('📦 Profile API response:', result);
        
        if (!result || result.error) {
            console.error('❌ Failed to load profile:', result?.error);
            // Show error but don't block
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            if (userNameEl) {
                userNameEl.textContent = 'Ошибка загрузки';
            }
            if (userEmailEl) {
                userEmailEl.textContent = 'Ошибка';
            }
            return;
        }
        
        const user = result.data;
        console.log('👤 User data from API:', user);
        
        if (!user) {
            console.error('❌ No user data in response');
            return;
        }
        
        // Extract data from API response - NEVER use localStorage
        const userName = user.name || user.email?.split('@')[0] || 'Клиент';
        const userEmail = user.email || '';
        const userPhone = user.phone || '';
        const userInitial = userName.charAt(0).toUpperCase();
        const emailVerified = user.email_verified || false;
        
        console.log('✅ Updating profile from API:', { userName, userEmail, userPhone, userInitial, emailVerified });
        
        // Update email verification status
        updateEmailVerificationStatus(emailVerified);
        
        // Force update header immediately - OVERWRITE any existing values
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userInitialEl = document.getElementById('userInitial');
        
        if (userNameEl) {
            userNameEl.textContent = userName; // Force update from API
            console.log('✅ Updated userName to:', userName);
        }
        if (userEmailEl) {
            userEmailEl.textContent = userEmail; // Force update from API
            console.log('✅ Updated userEmail to:', userEmail);
        }
        if (userInitialEl) {
            userInitialEl.textContent = userInitial; // Force update from API
            console.log('✅ Updated userInitial to:', userInitial);
        }
        
        // Update profile form fields - ONLY from API
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profilePhoneEl = document.getElementById('profilePhone');
        const profileDisplayNameEl = document.getElementById('profileDisplayName');
        const profileDisplayEmailEl = document.getElementById('profileDisplayEmail');
        const profileInitialEl = document.getElementById('profileInitial');
        
        if (profileNameEl) {
            profileNameEl.value = user.name || ''; // From API
        }
        if (profileEmailEl) {
            profileEmailEl.value = userEmail; // From API
        }
        if (profilePhoneEl) {
            profilePhoneEl.value = userPhone; // From API
        }
        if (profileDisplayNameEl) {
            profileDisplayNameEl.textContent = userName; // From API
        }
        if (profileDisplayEmailEl) {
            profileDisplayEmailEl.textContent = userEmail; // From API
        }
        if (profileInitialEl) {
            profileInitialEl.textContent = userInitial; // From API
        }
        
        // Update member since - ONLY from API
        const memberSinceEl = document.getElementById('memberSince');
        if (user.created_at && memberSinceEl) {
            try {
                const date = new Date(user.created_at);
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
                const memberSinceText = monthNames[date.getMonth()] + ' ' + date.getFullYear();
                memberSinceEl.textContent = memberSinceText; // From API
                console.log('✅ Updated memberSince to:', memberSinceText);
            } catch (e) {
                console.error('❌ Error parsing created_at:', e);
                memberSinceEl.textContent = '—';
            }
        } else if (memberSinceEl) {
            memberSinceEl.textContent = '—';
        }
        
        // Update statistics from dashboard
        await loadDashboardStats();
        
        // Load signed documents in profile
        const signedList = document.getElementById('signedDocumentsList');
        if (signedList) {
            try {
                const docsResult = await apiRequest('/client/documents/');
                if (docsResult && docsResult.data) {
                    const signedDocuments = docsResult.data.signed_documents || [];
                    await loadSignedDocumentsInProfile(signedDocuments);
                }
            } catch (error) {
                console.error('Error loading documents in profile:', error);
            }
        }
        
        console.log('✅ Profile loaded successfully from API');
    } catch (error) {
        console.error('❌ Error in loadProfile:', error);
    }
}

// Update email verification status display (banners inside main container + profile badges)
function updateEmailVerificationStatus(emailVerified) {
    // Banners inside main container (shown on all pages)
    const verificationBanner = document.getElementById('emailVerificationBanner');
    const verifiedBanner = document.getElementById('emailVerifiedBanner');
    
    // Profile page badges (only on profile page)
    const verifiedBadge = document.getElementById('emailVerifiedBadge');
    const unverifiedBadge = document.getElementById('emailUnverifiedBadge');
    
    if (emailVerified) {
        // Show verified banner, hide unverified banner
        if (verificationBanner) {
            verificationBanner.classList.add('hidden');
        }
        if (verifiedBanner) {
            verifiedBanner.classList.remove('hidden');
        }
        
        // Update profile badges if on profile page
        if (verifiedBadge) {
            verifiedBadge.classList.remove('hidden');
        }
        if (unverifiedBadge) {
            unverifiedBadge.classList.add('hidden');
        }
    } else {
        // Show unverified banner, hide verified banner
        if (verificationBanner) {
            verificationBanner.classList.remove('hidden');
        }
        if (verifiedBanner) {
            verifiedBanner.classList.add('hidden');
        }
        
        // Update profile badges if on profile page
        if (verifiedBadge) {
            verifiedBadge.classList.add('hidden');
        }
        if (unverifiedBadge) {
            unverifiedBadge.classList.remove('hidden');
        }
    }
    
    // Re-initialize Lucide icons after showing/hiding elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Resend verification email
async function resendVerificationEmail() {
    const btn = document.getElementById('resendVerificationBtn');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Отправка...';
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    try {
        const result = await apiRequest('/auth/resend-verification/', {
            method: 'POST',
        });
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при отправке письма');
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        if (result.data.success) {
            notifySuccess('Письмо с подтверждением отправлено на ваш email. Пожалуйста, проверьте почту.');
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            let errorMessage = result.data.message || 'Ошибка при отправке письма';
            if (result.data.error_code === 'EMAIL_SEND_FAILED') {
                errorMessage = 'Не удалось отправить письмо. Попробуйте позже или обратитесь в поддержку.';
            }
            notifyError(errorMessage);
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Error resending verification email:', error);
        notifyError('Ошибка при отправке письма. Попробуйте позже.');
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
        notifyError('Ошибка сохранения профиля');
        return;
    }
    
    if (result.response.ok) {
        notifySuccess('Профиль сохранен!');
        loadProfile();
    } else {
        notifyError(result.data.message || 'Ошибка сохранения');
    }
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        notifyError('Новые пароли не совпадают');
        return;
    }
    
    if (newPassword.length < 6) {
        notifyError('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    // Note: Password change endpoint needs to be implemented in Django
    notifyWarning('Изменение пароля временно недоступно. Обратитесь в поддержку.');
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Load products
async function loadProducts() {
    try {
        console.log('🔄 Loading products from API...');
        const result = await apiRequest('/client/products/');
        console.log('📦 API response:', result);
        
        if (!result || result.error) {
            console.error('❌ Failed to load products:', result?.error);
            showProductsError();
            return;
        }
        
        // Check response structure - API returns {success: true, products: [...]}
        // apiRequest wraps it in {response, data: {...}}
        let products = [];
        
        if (result && result.data) {
            console.log('📋 Response data structure:', {
                hasSuccess: 'success' in result.data,
                hasProducts: 'products' in result.data,
                success: result.data.success,
                productsType: Array.isArray(result.data.products),
                productsLength: Array.isArray(result.data.products) ? result.data.products.length : 0,
                dataType: Array.isArray(result.data),
                dataKeys: Object.keys(result.data)
            });
            
            if (result.data.success && Array.isArray(result.data.products)) {
                products = result.data.products;
                console.log('✅ Using result.data.products:', products.length);
            } else if (Array.isArray(result.data.products)) {
                products = result.data.products;
                console.log('✅ Using result.data.products (no success field):', products.length);
            } else if (Array.isArray(result.data)) {
                products = result.data;
                console.log('✅ Using result.data as array:', products.length);
            } else {
                console.warn('⚠️ Unknown response structure:', result.data);
            }
        } else {
            console.error('❌ No data in response:', result);
        }
        
        console.log('📦 Products loaded:', products.length, products);
        
        const container = document.getElementById('productsList');
        
        if (!container) {
            console.error('❌ Products container not found');
            return;
        }
        
        // Clear container first
        container.innerHTML = '';
    
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
    
        // Render products from API
        // Filter out subscriptions (they should be shown in subscriptions section)
        const oneTimeProducts = products.filter(p => {
            const productType = p.product?.product_type || p.product_type;
            return productType !== 'subscription';
        });
        
        console.log('📦 One-time products (excluding subscriptions):', oneTimeProducts.length);
        
        if (oneTimeProducts.length === 0) {
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
        
        const productsHTML = oneTimeProducts.map(product => {
            console.log('🎨 Rendering product:', product);
            const statusClass = product.status === 'active' ? 'bg-green-500' : 
                               product.status === 'expired' ? 'bg-gray-500' : 
                               product.status === 'pending' ? 'bg-yellow-500' : 
                               product.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500';
            const statusText = product.status === 'active' ? 'Активно' : 
                              product.status === 'expired' ? 'Истекло' : 
                              product.status === 'pending' ? 'Ожидает' : 
                              product.status === 'cancelled' ? 'Отменено' : 'Неизвестно';
            const startDate = product.start_date ? new Date(product.start_date).toLocaleDateString('ru-RU') : '-';
            const endDate = product.end_date ? new Date(product.end_date).toLocaleDateString('ru-RU') : null;
            const productName = product.product?.name || product.name || 'Продукт';
            const productDescription = product.product?.description || product.description || '';
            const renewalPrice = product.renewal_price || product.product?.price || product.price || 0;
            const isSubscription = (product.product?.product_type === 'subscription') || (product.product_type === 'subscription');
            
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
        
        container.innerHTML = productsHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('Products rendered:', products.length);
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
        console.log('🔄 Loading subscriptions from API...');
        const result = await apiRequest('/client/products/');
        console.log('📦 Subscriptions API response:', result);
        
        if (!result || result.error) {
            console.error('❌ Failed to load subscriptions:', result?.error);
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
        
        // API returns {success: true, products: [...]}
        // apiRequest wraps it in {response, data: {...}}
        let products = [];
        
        if (result && result.data) {
            console.log('📋 Subscriptions response data structure:', {
                hasSuccess: 'success' in result.data,
                hasProducts: 'products' in result.data,
                success: result.data.success,
                productsType: Array.isArray(result.data.products),
                productsLength: Array.isArray(result.data.products) ? result.data.products.length : 0,
                dataType: Array.isArray(result.data),
                dataKeys: Object.keys(result.data)
            });
            
            if (result.data.success && Array.isArray(result.data.products)) {
                products = result.data.products;
                console.log('✅ Using result.data.products for subscriptions:', products.length);
            } else if (Array.isArray(result.data.products)) {
                products = result.data.products;
                console.log('✅ Using result.data.products (no success field) for subscriptions:', products.length);
            } else if (Array.isArray(result.data)) {
                products = result.data;
                console.log('✅ Using result.data as array for subscriptions:', products.length);
            } else {
                console.warn('⚠️ Unknown subscriptions response structure:', result.data);
            }
        }
        
        // Filter subscriptions only
        const subscriptions = products.filter(p => {
            const productType = p.product?.product_type || p.product_type;
            return productType === 'subscription';
        });
        
        console.log('📦 Subscriptions filtered:', subscriptions.length, subscriptions);
        
        const container = document.getElementById('subscriptionsList');
        
        if (!container) {
            console.error('❌ Subscriptions container not found');
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
            console.log('🎨 Rendering subscription:', sub);
            const statusClass = sub.status === 'active' ? 'bg-green-100 text-green-700' : 
                               sub.status === 'expired' ? 'bg-red-100 text-red-700' : 
                               sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                               'bg-gray-100 text-gray-600';
            const statusText = sub.status === 'active' ? 'Активна' : 
                              sub.status === 'expired' ? 'Истекла' : 
                              sub.status === 'pending' ? 'Ожидает' : 
                              sub.status === 'cancelled' ? 'Отменена' : 'Неактивна';
            const nextPayment = sub.end_date ? new Date(sub.end_date).toLocaleDateString('ru-RU') : '-';
            const price = sub.renewal_price || sub.product?.price || sub.price || 0;
            const productName = sub.product?.name || sub.name || 'Подписка';
            const productDescription = sub.product?.description || sub.description || '';
            const subscriptionPeriod = sub.product?.subscription_period || sub.subscription_period || 'monthly';
            const periodText = subscriptionPeriod === 'monthly' ? 'мес' : 
                              subscriptionPeriod === 'yearly' ? 'год' : 
                              subscriptionPeriod === 'weekly' ? 'нед' : 'мес';
            
            // Get subscription terms from product
            const subscriptionTerms = sub.product?.subscription_terms;
            let subscriptionTermsUrl = null;
            if (subscriptionTerms) {
                // Use slug if available, otherwise fallback to document type
                if (subscriptionTerms.slug) {
                    subscriptionTermsUrl = `/document/${subscriptionTerms.slug}.html`;
                } else if (subscriptionTerms.document_type === 'subscription_terms') {
                    subscriptionTermsUrl = '/subscription-terms.html';
                }
            }
            
            return `
                <div class="bg-white rounded-2xl shadow-sm p-6 border-2 ${sub.status === 'active' ? 'border-green-500/20' : 'border-gray-200'}">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold">${productName}</h3>
                        <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold">
                            ${statusText}
                        </span>
                    </div>
                    ${productDescription ? `<p class="text-gray-600 mb-4 text-sm">${productDescription.substring(0, 150)}${productDescription.length > 150 ? '...' : ''}</p>` : ''}
                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Стоимость:</span>
                            <span class="font-bold">${formatAmountRub(price)}/${periodText}</span>
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
                                <span class="font-bold text-green-600">${nextPayment}</span>
                            </div>
                        ` : ''}
                        ${sub.status === 'expired' && sub.end_date ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Истекла:</span>
                                <span class="font-bold text-red-600">${nextPayment}</span>
                            </div>
                        ` : ''}
                        ${sub.status === 'pending' ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Статус:</span>
                                <span class="font-semibold text-yellow-600">Ожидает активации</span>
                            </div>
                        ` : ''}
                        ${subscriptionTermsUrl ? `
                            <div class="pt-2 border-t border-gray-200">
                                <a href="${subscriptionTermsUrl}" target="_blank" 
                                   class="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-semibold">
                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                    <span>Условия подписки</span>
                                    <i data-lucide="external-link" class="w-3 h-3"></i>
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    ${sub.status === 'active' ? `
                        <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${price}&subscription=monthly" 
                           class="block w-full bg-gradient-to-r from-secondary to-blue-600 text-white py-2 rounded-xl font-semibold hover:shadow-xl transition text-center mb-2">
                            Продлить подписку
                        </a>
                        <button class="w-full border-2 border-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-50 transition text-gray-700">
                            Управлять подпиской
                        </button>
                    ` : sub.status === 'expired' ? `
                        <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${price}&subscription=monthly" 
                           class="block w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/90 transition text-center">
                            Восстановить подписку за ${formatAmountRub(price)}
                        </a>
                    ` : `
                        <a href="/payment.html?product=${encodeURIComponent(productName)}&price=${price}&subscription=monthly" 
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
        
        console.log('✅ Subscriptions rendered:', subscriptions.length);
    } catch (error) {
        console.error('❌ Error in loadSubscriptions:', error);
        const container = document.getElementById('subscriptionsList');
        if (container) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-red-500">
                    <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4"></i>
                    <p class="font-semibold">Ошибка загрузки подписок</p>
                    <p class="text-sm text-gray-600 mt-2">${error.message || 'Неизвестная ошибка'}</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
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
        
        // API returns {success: true, payments: [...], total_amount: ...}
        const payments = (result.data && result.data.payments) ? result.data.payments : (Array.isArray(result.data) ? result.data : []);
        const total = (result.data && result.data.total_amount !== undefined) ? result.data.total_amount : 0;
        const tbody = document.getElementById('paymentsTableBody');
        
        if (!tbody) {
            console.error('Payments table body not found');
            return;
        }
        
        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Платежей пока нет</td></tr>`;
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
            // Кнопка для получения/скачивания чека
            const paymentId = payment.id || payment.payment_id;
            const hasReceipt = payment.receipt_url;
            const isSuccess = payment.status === 'success' || payment.status === 'CONFIRMED';
            
            let receiptBtn = '<span class="text-gray-400 text-sm">—</span>';
            
            if (hasReceipt) {
                // Если есть URL чека, показываем кнопку скачивания
                receiptBtn = `
                    <a href="${payment.receipt_url}" target="_blank" 
                       class="text-secondary hover:text-secondary/80 font-semibold text-sm flex items-center gap-1 transition"
                       title="Скачать чек">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                        <span>Чек</span>
                    </a>
                `;
            } else if (isSuccess && paymentId) {
                // Если платеж успешен, но чека нет, показываем кнопку для запроса чека
                receiptBtn = `
                    <button onclick="requestReceipt('${paymentId}', this)" 
                            class="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1 transition receipt-btn"
                            data-payment-id="${paymentId}"
                            title="Получить чек">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>Получить</span>
                    </button>
                `;
            }
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

// Load partners data - ONLY from API
async function loadPartnersData() {
    try {
        console.log('🔄 Loading partners data from API...');
        
        // First, check if user has accepted affiliate terms
        const profileResult = await apiRequest('/auth/profile/');
        if (!profileResult || profileResult.error) {
            console.error('❌ Failed to load profile:', profileResult?.error);
            return;
        }
        
        const user = profileResult.data;
        const hasAcceptedTerms = user.offer_accepted_at !== null && user.offer_accepted_at !== undefined;
        
        console.log('📋 User affiliate terms accepted:', hasAcceptedTerms);
        
        // Show/hide agreement form and content based on acceptance
        const agreementForm = document.getElementById('affiliateTermsAgreement');
        const partnersContent = document.getElementById('partnersContent');
        
        if (!hasAcceptedTerms) {
            // Show agreement form, hide content
            if (agreementForm) {
                agreementForm.classList.remove('hidden');
            }
            if (partnersContent) {
                partnersContent.classList.add('hidden');
            }
            
            // Load affiliate terms content
            await loadAffiliateTermsContent();
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            console.log('⚠️ User has not accepted affiliate terms, showing agreement form');
            return; // Don't load data until terms are accepted
        } else {
            // Hide agreement form, show content
            if (agreementForm) {
                agreementForm.classList.add('hidden');
            }
            if (partnersContent) {
                partnersContent.classList.remove('hidden');
            }
        }
        
        const result = await apiRequest('/client/referrals/');
        console.log('📦 Referrals API response:', result);
        
        if (!result || result.error) {
            console.error('❌ Failed to load referrals:', result?.error);
            
            // Set defaults
            const totalReferralsEl = document.getElementById('totalReferrals');
            const totalEarnedEl = document.getElementById('totalEarned');
            const availableBalanceEl = document.getElementById('availableBalance');
            const withdrawBalanceEl = document.getElementById('withdrawBalance');
            const conversionRateEl = document.getElementById('conversionRate');
            const referralLinkEl = document.getElementById('referralLink');
            
            if (totalReferralsEl) {
                totalReferralsEl.textContent = '0';
            }
            if (totalEarnedEl) {
                totalEarnedEl.textContent = '0 ₽';
            }
            if (availableBalanceEl) {
                availableBalanceEl.textContent = '0 ₽';
            }
            if (withdrawBalanceEl) {
                withdrawBalanceEl.textContent = '0 ₽';
            }
            if (conversionRateEl) {
                conversionRateEl.textContent = '0%';
            }
            
            // Try to get referral link from profile if referrals API fails
            if (referralLinkEl && !referralLinkEl.value) {
                console.log('⚠️ Trying to get referral link from profile...');
                const profileResult = await apiRequest('/auth/profile/');
                if (profileResult && profileResult.data && profileResult.data.referral_code) {
                    const referralLink = `https://miniapp.expert/?ref=${profileResult.data.referral_code}`;
                    referralLinkEl.value = referralLink;
                    console.log('✅ Loaded referral link from profile:', referralLink);
                }
            }
            return;
        }
        
        const data = result.data;
        console.log('👤 Referrals data from API:', data);
        
        const stats = data.stats || {};
        const referrals = data.referrals || [];
        const referralLink = data.referral_link || '';
        const commissionRate = data.commission_rate || 20.00; // Default 20%
        
        console.log('📊 Stats from API:', stats);
        console.log('🔗 Referral link from API:', referralLink);
        console.log('👥 Referrals from API:', referrals.length);
        console.log('💰 Commission rate from API:', commissionRate + '%');
        
        // Update stats - FORCE update from API
        const totalReferralsEl = document.getElementById('totalReferrals');
        const totalEarnedEl = document.getElementById('totalEarned');
        const availableBalanceEl = document.getElementById('availableBalance');
        const withdrawBalanceEl = document.getElementById('withdrawBalance');
        const conversionRateEl = document.getElementById('conversionRate');
        const referralLinkEl = document.getElementById('referralLink');
        const commissionRateTextEl = document.getElementById('commissionRateText');
        const commissionRateDisplayEl = document.getElementById('commissionRateDisplay');
        
        if (totalReferralsEl) {
            totalReferralsEl.textContent = stats.total_referrals || 0;
            console.log('✅ Updated totalReferrals to:', stats.total_referrals || 0);
        }
        if (totalEarnedEl) {
            totalEarnedEl.textContent = formatAmountRub(stats.total_earned || 0);
            console.log('✅ Updated totalEarned to:', stats.total_earned || 0);
        }
        if (availableBalanceEl) {
            availableBalanceEl.textContent = formatAmountRub(stats.available_balance || 0);
            console.log('✅ Updated availableBalance to:', stats.available_balance || 0);
        }
        if (withdrawBalanceEl) {
            withdrawBalanceEl.textContent = formatAmountRub(stats.available_balance || 0);
            console.log('✅ Updated withdrawBalance to:', stats.available_balance || 0);
        }
        
        // Calculate conversion rate
        const conversionRate = stats.total_referrals > 0 && stats.active_referrals > 0 ? 
            ((stats.active_referrals / stats.total_referrals) * 100).toFixed(0) : 0;
        if (conversionRateEl) {
            conversionRateEl.textContent = conversionRate + '%';
            console.log('✅ Updated conversionRate to:', conversionRate + '%');
        }
        
        // Update referral link - FORCE update from API
        if (referralLinkEl) {
            referralLinkEl.value = referralLink;
            console.log('✅ Updated referralLink to:', referralLink);
        } else {
            console.error('❌ Referral link element not found');
        }
        
        // Update commission rate - FROM API
        if (commissionRateTextEl) {
            commissionRateTextEl.textContent = `${commissionRate}% от каждой покупки`;
            console.log('✅ Updated commissionRateText to:', commissionRate + '%');
        }
        if (commissionRateDisplayEl) {
            commissionRateDisplayEl.textContent = commissionRate + '%';
            console.log('✅ Updated commissionRateDisplay to:', commissionRate + '%');
        }
        
        // Update referrals table - ONLY from API
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
                console.log('✅ Updated referrals table: No referrals');
            } else {
                console.log('✅ Rendering referrals:', referrals.length);
                tbody.innerHTML = referrals.map(ref => {
                    const date = ref.created_at ? new Date(ref.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : '-';
                    const statusClass = ref.status === 'active' ? 'bg-green-100 text-green-700' : 
                                       ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                       ref.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                                       ref.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                       'bg-gray-100 text-gray-600';
                    const statusText = ref.status === 'active' ? 'Активен' : 
                                      ref.status === 'pending' ? 'Ожидает' :
                                      ref.status === 'inactive' ? 'Неактивен' :
                                      ref.status === 'cancelled' ? 'Отменен' : 
                                      'Неизвестно';
                    const referredUserName = ref.referred_user?.name || ref.referred_user?.email?.split('@')[0] || 'Пользователь';
                    const referredUserEmail = ref.referred_user?.email || '';
                    const totalEarned = ref.total_earned || 0;
                    const paidOut = ref.paid_out || 0;
                    
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
                console.log('✅ Updated referrals table:', referrals.length, 'referrals');
            }
        } else {
            console.error('❌ Referrals table body not found');
        }
        
        // Load payout history
        await loadPayoutHistory();
        
        // Initialize icons after updating HTML
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('✅ Partners data loaded successfully from API');
    } catch (error) {
        console.error('❌ Error in loadPartnersData:', error);
    }
}

// Load affiliate terms content
async function loadAffiliateTermsContent() {
    const contentEl = document.getElementById('affiliateTermsContent');
    if (!contentEl) return;
    
    // Show loading state
    contentEl.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p class="mt-4 text-gray-600">Загрузка условий...</p></div>';
    
    try {
        console.log('🔄 Loading affiliate terms from API...');
        const result = await apiRequest('/documents/affiliate_terms/');
        console.log('📦 Affiliate terms API response:', result);
        
        if (result && result.data) {
            // API может возвращать данные в разных форматах
            let document = null;
            
            if (result.data.document) {
                // Формат: {success: true, document: {...}}
                document = result.data.document;
            } else if (result.data.content) {
                // Формат: {success: true, content: "...", title: "..."}
                document = result.data;
            } else if (result.data.success && result.data.document) {
                // Вложенный формат
                document = result.data.document;
            }
            
            if (document && document.content) {
                const content = document.content || '';
                const title = document.title || 'Условия партнерской программы';
                
                // Показываем HTML контент (уже отформатированный)
                // Контент уже содержит HTML с классами Tailwind, поэтому просто вставляем его
                contentEl.innerHTML = content;
                console.log('✅ Affiliate terms loaded successfully');
            } else {
                throw new Error('Document content not found');
            }
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('❌ Error loading affiliate terms:', error);
        contentEl.innerHTML = `
            <div class="text-center py-8">
                <i data-lucide="alert-circle" class="w-12 h-12 text-yellow-500 mx-auto mb-4"></i>
                <p class="text-gray-700 mb-4">Не удалось загрузить условия партнерской программы.</p>
                <p class="text-sm text-gray-600 mb-4">Пожалуйста, ознакомьтесь с условиями на странице документа.</p>
                <a href="/affiliate-terms.html" target="_blank" class="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                    <span>Открыть условия партнерской программы</span>
                </a>
            </div>
        `;
        // Re-initialize icons after error
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Accept affiliate terms
async function acceptAffiliateTerms() {
    const checkbox = document.getElementById('affiliateTermsCheckbox');
    const btn = document.getElementById('acceptAffiliateTermsBtn');
    
    if (!checkbox || !checkbox.checked) {
        notifyError('Пожалуйста, подтвердите согласие с условиями партнерской программы');
        return;
    }
    
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Обработка...';
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    try {
        const result = await apiRequest('/auth/accept-affiliate-terms/', {
            method: 'POST',
        });
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при принятии условий');
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        if (result.data.success) {
            notifySuccess('Условия партнерской программы приняты! Теперь вы можете участвовать в программе.');
            
            // Hide agreement form and show content
            const agreementForm = document.getElementById('affiliateTermsAgreement');
            const partnersContent = document.getElementById('partnersContent');
            
            if (agreementForm) {
                agreementForm.classList.add('hidden');
            }
            if (partnersContent) {
                partnersContent.classList.remove('hidden');
            }
            
            // Load partners data
            await loadPartnersData();
            
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            notifyError(result.data.message || 'Ошибка при принятии условий');
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Error accepting affiliate terms:', error);
        notifyError('Ошибка при принятии условий. Попробуйте позже.');
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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

// Copy referral link - get from API if not set
async function copyReferralLink() {
    const linkEl = document.getElementById('referralLink');
    if (!linkEl) {
        notifyError('Ссылка не найдена');
        return;
    }
    
    let link = linkEl.value;
    
    // If link is empty, try to load from API
    if (!link) {
        console.log('⚠️ Referral link is empty, loading from API...');
        const result = await apiRequest('/client/referrals/');
        if (result && result.data && result.data.referral_link) {
            link = result.data.referral_link;
            linkEl.value = link;
            console.log('✅ Loaded referral link from API:', link);
        } else {
            // Try profile as fallback
            const profileResult = await apiRequest('/auth/profile/');
            if (profileResult && profileResult.data && profileResult.data.referral_code) {
                link = `https://miniapp.expert/?ref=${profileResult.data.referral_code}`;
                linkEl.value = link;
                console.log('✅ Loaded referral link from profile:', link);
            }
        }
    }
    
    if (!link) {
        notifyError('Не удалось получить реферальную ссылку');
        return;
    }
    
    // Copy to clipboard
    linkEl.select();
    linkEl.setSelectionRange(0, 99999); // For mobile devices
    try {
    document.execCommand('copy');
        notifySuccess('Скопировано');
        console.log('✅ Referral link copied:', link);
    } catch (err) {
        // Fallback: use Clipboard API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
                notifySuccess('Скопировано');
                console.log('✅ Referral link copied (Clipboard API):', link);
            }).catch(() => {
                notifyError('Не удалось скопировать ссылку');
                console.error('❌ Failed to copy referral link');
            });
        } else {
            notifyError('Не удалось скопировать ссылку');
            console.error('❌ Clipboard API not available');
        }
    }
}

// Share to Telegram - get link from API if not set
async function shareToTelegram() {
    const linkEl = document.getElementById('referralLink');
    if (!linkEl) {
        notifyError('Ссылка не найдена');
        return;
    }
    
    let link = linkEl.value;
    
    // If link is empty, load from API
    if (!link) {
        const result = await apiRequest('/client/referrals/');
        if (result && result.data && result.data.referral_link) {
            link = result.data.referral_link;
            linkEl.value = link;
        }
    }
    
    if (!link) {
        notifyError('Не удалось получить реферальную ссылку');
        return;
    }
    
    const text = '🚀 Создай своё Telegram Mini App вместе с MiniAppExpert!\n\n' +
                 '💰 Специальное предложение для тебя: используй мою реферальную ссылку и получи бонус!\n\n';
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Share to WhatsApp - get link from API if not set
async function shareToWhatsApp() {
    const linkEl = document.getElementById('referralLink');
    if (!linkEl) {
        notifyError('Ссылка не найдена');
        return;
    }
    
    let link = linkEl.value;
    
    // If link is empty, load from API
    if (!link) {
        const result = await apiRequest('/client/referrals/');
        if (result && result.data && result.data.referral_link) {
            link = result.data.referral_link;
            linkEl.value = link;
        }
    }
    
    if (!link) {
        notifyError('Не удалось получить реферальную ссылку');
        return;
    }
    
    const text = '🚀 Создай своё Telegram Mini App вместе с MiniAppExpert!\n\n' +
                 '💰 Специальное предложение: используй мою реферальную ссылку!\n\n' + link;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Share by Email - get link from API if not set
async function shareByEmail() {
    const linkEl = document.getElementById('referralLink');
    if (!linkEl) {
        notifyError('Ссылка не найдена');
        return;
    }
    
    let link = linkEl.value;
    
    // If link is empty, load from API
    if (!link) {
        const result = await apiRequest('/client/referrals/');
        if (result && result.data && result.data.referral_link) {
            link = result.data.referral_link;
            linkEl.value = link;
        }
    }
    
    if (!link) {
        notifyError('Не удалось получить реферальную ссылку');
        return;
    }
    
    const subject = 'Создай своё Telegram Mini App!';
    const body = 'Привет!\n\n' +
                 'Я пользуюсь MiniAppExpert для создания Telegram Mini Apps и очень доволен!\n\n' +
                 'Используй мою реферальную ссылку для получения бонуса:\n' + link + '\n\n' +
                 'С уважением!';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Open withdraw modal
async function openWithdrawModal() {
    const balance = parseFloat(document.getElementById('availableBalance').textContent.replace(/[^\d.]/g, '')) || 0;
    
    if (balance === 0) {
        notifyWarning('Недостаточно средств для вывода.\n\nПригласите клиентов, чтобы начать зарабатывать!');
        return;
    }
    
    // Show amount input modal
    const amount = await promptModal(
        `Доступно: ${formatAmountRub(balance)}`,
        '',
        'Введите сумму для вывода',
        'number'
    );
    
    if (!amount || amount === null) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > balance) {
        notifyError('Неверная сумма');
        return;
    }
    
    // Show method selection modal
    showModal({
        title: 'Выберите способ вывода',
        message: 'Как вы хотите получить средства?',
        type: 'info',
        html: `
            <div class="space-y-2 mt-4">
                <button onclick="selectPaymentMethod('card')" class="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition">
                    <div class="font-semibold">💳 Банковская карта</div>
                </button>
                <button onclick="selectPaymentMethod('yoomoney')" class="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition">
                    <div class="font-semibold">💵 ЮMoney</div>
                </button>
                <button onclick="selectPaymentMethod('qiwi')" class="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition">
                    <div class="font-semibold">💸 Qiwi</div>
                </button>
                <button onclick="selectPaymentMethod('paypal')" class="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition">
                    <div class="font-semibold">💳 PayPal</div>
                </button>
            </div>
        `,
        confirmText: 'Отмена',
        onConfirm: () => closeModal(),
        onCancel: () => closeModal()
    });
    
    // Store amount for method selection
    window._pendingPayoutAmount = amountNum;
}

// Select payment method (called from modal buttons)
function selectPaymentMethod(method) {
    closeModal();
    if (window._pendingPayoutAmount) {
        requestPayout(window._pendingPayoutAmount, method);
        window._pendingPayoutAmount = null;
    }
}

// Request payout
async function requestPayout(amount, method) {
    const result = await apiRequest('/client/referrals/request-payout/', {
        method: 'POST',
        body: JSON.stringify({ amount, payment_method: method }),
    });
    
    if (!result || result.error) {
        notifyError('Ошибка создания заявки на вывод');
        return;
    }
    
    if (result.response.ok) {
        notifySuccess(`Заявка на вывод ${formatAmountRub(amount)} через ${method} создана!\n\nСредства поступят в течение 1-3 рабочих дней.`);
        await loadPartnersData();
    } else {
        notifyError(result.data?.message || 'Ошибка создания заявки');
    }
}

// Request receipt for payment
async function requestReceipt(paymentId, buttonElement = null) {
    try {
        console.log('Requesting receipt for payment:', paymentId);
        
        // Получаем кнопку из параметра или из DOM по data-атрибуту
        let button = buttonElement;
        if (!button && paymentId) {
            // Ищем кнопку по data-payment-id
            button = document.querySelector(`button[data-payment-id="${paymentId}"]`);
        }
        
        // Сохраняем оригинальный HTML для восстановления
        let originalHTML = null;
        if (button) {
            originalHTML = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Загрузка...</span>';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        const result = await apiRequest(`/client/payments/${paymentId}/receipt/`);
        
        if (!result || result.error) {
            notifyError('Ошибка получения чека');
            if (button && originalHTML) {
                button.disabled = false;
                button.innerHTML = originalHTML;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
            return;
        }
        
        if (result.data && result.data.receipt_url) {
            // Открываем чек в новой вкладке
            window.open(result.data.receipt_url, '_blank');
            notifySuccess('Чек открыт в новой вкладке');
            
            // Перезагружаем список платежей, чтобы обновить кнопку
            await loadPayments();
        } else {
            notifyWarning(result.data?.message || 'Чек еще не доступен. Чек будет отправлен на ваш email после обработки платежа.');
            if (button && originalHTML) {
                button.disabled = false;
                button.innerHTML = originalHTML;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    } catch (error) {
        console.error('Error requesting receipt:', error);
        notifyError('Ошибка получения чека');
        // Восстанавливаем кнопку при ошибке
        if (buttonElement) {
            const button = buttonElement;
            button.disabled = false;
            // Восстанавливаем через поиск по data-атрибуту, если нужно
            if (paymentId) {
                const btn = document.querySelector(`button[data-payment-id="${paymentId}"]`);
                if (btn) {
                    btn.disabled = false;
                    // Просто перезагружаем платежи, чтобы восстановить кнопку
                    await loadPayments();
                }
            }
        }
    }
}

// Load email verification status - called on all pages
async function loadEmailVerificationStatus() {
    try {
        const result = await apiRequest('/auth/profile/');
        if (!result || result.error) {
            console.error('Failed to load email verification status:', result?.error);
            return;
        }
        
        const user = result.data;
        if (user && typeof user.email_verified !== 'undefined') {
            updateEmailVerificationStatus(user.email_verified);
        }
    } catch (error) {
        console.error('Error loading email verification status:', error);
    }
}

// Load payment methods (cards)
async function loadPaymentMethods() {
    try {
        console.log('🔄 Loading payment methods from API...');
        const result = await apiRequest('/client/payment-methods/');
        console.log('📦 Payment methods API response:', result);
        
        if (!result || result.error) {
            console.error('❌ Failed to load payment methods:', result?.error);
            const cardsList = document.getElementById('cardsList');
            if (cardsList) {
                cardsList.innerHTML = '<div class="text-center py-12 text-gray-500">Ошибка загрузки карт</div>';
            }
            return;
        }
        
        const methods = result.data.methods || [];
        const cardsList = document.getElementById('cardsList');
        
        if (!cardsList) return;
        
        if (methods.length === 0) {
            cardsList.innerHTML = `
                <div class="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <i data-lucide="credit-card" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                    <p class="text-gray-600 mb-2">У вас нет привязанных карт</p>
                    <p class="text-sm text-gray-500">Карта автоматически привязывается при первой оплате</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        cardsList.innerHTML = methods.map(method => {
            const isDefault = method.is_default || false;
            const cardType = method.card_type || 'Карта';
            const panMask = method.pan_mask || '**** **** **** ****';
            const expDate = method.exp_date || '';
            
            return `
                <div class="bg-white rounded-2xl shadow-sm p-6 border-2 ${isDefault ? 'border-primary' : 'border-gray-200'}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                                <i data-lucide="credit-card" class="w-6 h-6 text-white"></i>
                            </div>
                            <div>
                                <div class="font-bold text-lg">${panMask}</div>
                                <div class="text-sm text-gray-600">${cardType}${expDate ? ' · ' + expDate : ''}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            ${isDefault ? `
                                <span class="bg-primary text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                    Основная
                        </span>
                            ` : ''}
                            ${!isDefault ? `
                                <button 
                                    onclick="setDefaultCard('${method.id}')" 
                                    class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                                >
                                    Сделать основной
                                </button>
                            ` : ''}
                            ${!isDefault ? `
                                <button 
                                    onclick="deleteCard('${method.id}')" 
                                    class="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
                                >
                                    Удалить
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('✅ Payment methods loaded successfully');
    } catch (error) {
        console.error('❌ Error in loadPaymentMethods:', error);
        const cardsList = document.getElementById('cardsList');
        if (cardsList) {
            cardsList.innerHTML = '<div class="text-center py-12 text-gray-500">Ошибка загрузки карт</div>';
        }
    }
}

// Set default card
async function setDefaultCard(methodId) {
    try {
        const result = await apiRequest(`/client/payment-methods/${methodId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ is_default: true }),
        });
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при установке карты как основной');
            return;
        }
        
        notifySuccess('Карта установлена как основная');
        await loadPaymentMethods();
    } catch (error) {
        console.error('Error setting default card:', error);
        notifyError('Ошибка при установке карты как основной');
    }
}

// Delete card
async function deleteCard(methodId) {
    if (!confirm('Вы уверены, что хотите удалить эту карту?')) {
        return;
    }
    
    try {
        const result = await apiRequest(`/client/payment-methods/${methodId}/`, {
            method: 'DELETE',
        });
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при удалении карты');
            return;
        }
        
        notifySuccess('Карта успешно удалена');
        await loadPaymentMethods();
    } catch (error) {
        console.error('Error deleting card:', error);
        notifyError('Ошибка при удалении карты');
    }
}

// Store documents to sign globally for access in functions
let globalDocumentsToSign = [];

// Check documents status (for banner on all pages)
async function checkDocumentsStatus() {
    try {
        const result = await apiRequest('/client/documents/');
        if (!result || result.error) {
            return;
        }
        
        const documentsToSign = result.data.documents_to_sign || [];
        const signedDocuments = result.data.signed_documents || [];
        
        // Store globally for use in other functions
        globalDocumentsToSign = documentsToSign;
        
        // Show/hide banner if there are documents to sign
        const banner = document.getElementById('documentsToSignBanner');
        const bannerList = document.getElementById('documentsToSignList');
        
        if (documentsToSign.length > 0) {
            if (banner) {
                banner.classList.remove('hidden');
            }
            if (bannerList) {
                    bannerList.innerHTML = documentsToSign.map(doc => {
                        const documentTypeLabels = {
                            'privacy': 'Политика конфиденциальности',
                            'affiliate_terms': 'Условия партнерской программы',
                            'cabinet_terms': 'Условия использования личного кабинета',
                            'subscription_terms': 'Условия подписки',
                        };
                        const label = documentTypeLabels[doc.document_type] || doc.title;
                        const hasNewVersion = doc.is_signed && doc.signed_version < doc.current_version;
                        // Use slug from API response for document URL
                        const docUrl = doc.slug ? `/document/${doc.slug}.html` : (
                            doc.document_type === 'privacy' ? '/privacy.html' :
                            doc.document_type === 'affiliate_terms' ? '/affiliate-terms.html' :
                            doc.document_type === 'cabinet_terms' ? '/cabinet-terms.html' :
                            doc.document_type === 'subscription_terms' ? '/subscription-terms.html' : '#'
                        );
                        
                        return `
                            <div class="bg-white rounded-lg p-3 border border-yellow-300 mb-2">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-900 text-sm">${label}</h4>
                                        ${hasNewVersion ? `
                                            <p class="text-xs text-gray-600 mt-1">
                                                Подписана версия ${doc.signed_version}, доступна версия ${doc.current_version}
                                            </p>
                                        ` : `
                                            <p class="text-xs text-gray-600 mt-1">Требуется подпись</p>
                                        `}
                                        <a href="${docUrl}" target="_blank" class="text-primary hover:text-primary/80 text-xs mt-1 inline-flex items-center gap-1">
                                            <i data-lucide="external-link" class="w-3 h-3"></i>
                                            <span>Открыть документ</span>
                                        </a>
                                    </div>
                                    <button 
                                        onclick="signDocument('${doc.document_type}', false, ${doc.id ? `'${doc.id}'` : 'null'})" 
                                        class="bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-700 transition text-xs ml-3 flex-shrink-0"
                                    >
                                        Подписать
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
            }
        } else {
            if (banner) {
                banner.classList.add('hidden');
            }
        }
        
        // Load signed documents in profile (if on profile page)
        const signedList = document.getElementById('signedDocumentsList');
        if (signedList) {
            await loadSignedDocumentsInProfile(signedDocuments);
        }
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error checking documents status:', error);
    }
}

// Load signed documents in profile section
async function loadSignedDocumentsInProfile(signedDocuments) {
    const signedList = document.getElementById('signedDocumentsList');
    if (!signedList) return;
    
    if (signedDocuments.length === 0) {
        signedList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i data-lucide="file-text" class="w-8 h-8 mx-auto mb-2 text-gray-300"></i>
                <p class="text-sm">Нет подписанных документов</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    signedList.innerHTML = signedDocuments.map(doc => {
        const documentTypeLabels = {
            'privacy': 'Политика конфиденциальности',
            'affiliate_terms': 'Условия партнерской программы',
            'cabinet_terms': 'Условия использования личного кабинета',
            'subscription_terms': 'Условия подписки',
        };
        const label = documentTypeLabels[doc.document_type] || doc.title;
        const signedDate = doc.signed_at ? new Date(doc.signed_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : '';
        
        // Use slug from API response, fallback to document type URL
        const docUrl = doc.slug ? `/document/${doc.slug}.html` : (
            doc.document_type === 'privacy' ? '/privacy.html' :
            doc.document_type === 'affiliate_terms' ? '/affiliate-terms.html' :
            doc.document_type === 'cabinet_terms' ? '/cabinet-terms.html' :
            doc.document_type === 'subscription_terms' ? '/subscription-terms.html' : '#'
        );
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm text-gray-900 truncate">${label}</h4>
                        <p class="text-xs text-gray-600">Версия ${doc.current_version} · ${signedDate}</p>
                    </div>
                </div>
                <a 
                    href="${docUrl}" 
                    target="_blank"
                    class="text-primary hover:text-primary/80 font-semibold text-xs flex items-center gap-1 ml-2 flex-shrink-0"
                    title="Открыть документ"
                >
                    <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
            </div>
        `;
    }).join('');
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


// Sign document
async function signDocument(documentType, skipConfirm = false, documentId = null) {
    if (!skipConfirm) {
        const confirmed = await new Promise((resolve) => {
            showModal({
                title: 'Подписать документ',
                message: 'Вы уверены, что хотите подписать этот документ?',
                type: 'confirm',
                confirmText: 'Подписать',
                cancelText: 'Отмена',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
        
        if (!confirmed) {
            return false;
        }
    }
    
    try {
        const body = {};
        // If documentId is provided (for subscription_terms with different documents per product), send it in body
        if (documentId && documentId !== 'null' && documentId !== null) {
            body.document_id = documentId.toString();
        }
        
        const requestOptions = {
            method: 'POST',
        };
        
        if (Object.keys(body).length > 0) {
            requestOptions.body = JSON.stringify(body);
        }
        
        const result = await apiRequest(`/client/documents/accept/${documentType}/`, requestOptions);
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при подписании документа');
            return false;
        }
        
        notifySuccess('Документ успешно подписан');
        
        // Reload documents status (banner and profile list)
        await checkDocumentsStatus();
        
        // If it's affiliate_terms, reload partners data
        if (documentType === 'affiliate_terms') {
            await loadPartnersData();
        }
        
        return true;
    } catch (error) {
        console.error('Error signing document:', error);
        notifyError('Ошибка при подписании документа');
        return false;
    }
}

// Show documents modal for viewing all documents
function showDocumentsModal() {
    if (!globalDocumentsToSign || globalDocumentsToSign.length === 0) {
        notifyWarning('Нет документов для просмотра');
        return;
    }
    
    const documentTypeLabels = {
        'privacy': 'Политика конфиденциальности',
        'affiliate_terms': 'Условия партнерской программы',
        'cabinet_terms': 'Условия использования личного кабинета',
        'subscription_terms': 'Условия подписки',
    };
    
    const documentsHtml = globalDocumentsToSign.map(doc => {
        const label = documentTypeLabels[doc.document_type] || doc.title;
        const hasNewVersion = doc.is_signed && doc.signed_version < doc.current_version;
        const docUrl = doc.slug ? `/document/${doc.slug}.html` : (
            doc.document_type === 'privacy' ? '/privacy.html' :
            doc.document_type === 'affiliate_terms' ? '/affiliate-terms.html' :
            doc.document_type === 'cabinet_terms' ? '/cabinet-terms.html' :
            doc.document_type === 'subscription_terms' ? '/subscription-terms.html' : '#'
        );
        
        return `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-2">${label}</h4>
                        ${hasNewVersion ? `
                            <p class="text-xs text-gray-600 mb-2">
                                Подписана версия ${doc.signed_version}, доступна версия ${doc.current_version}
                            </p>
                        ` : `
                            <p class="text-xs text-gray-600 mb-2">Требуется подпись</p>
                        `}
                        <a 
                            href="${docUrl}" 
                            target="_blank"
                            class="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm"
                        >
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                            <span>Открыть полный текст документа</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    showModal({
        title: 'Документы для подписания',
        html: `
            <div class="space-y-3 max-h-96 overflow-y-auto">
                ${documentsHtml}
            </div>
        `,
        type: 'info',
        confirmText: 'Закрыть',
        cancelText: '',
        onConfirm: () => {
            // Just close the modal
        },
        onCancel: null
    });
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// Sign all documents
async function signAllDocuments() {
    if (!globalDocumentsToSign || globalDocumentsToSign.length === 0) {
        notifyWarning('Нет документов для подписания');
        return;
    }
    
    const confirmed = await new Promise((resolve) => {
        showModal({
            title: 'Подписать все документы',
            message: `Вы уверены, что хотите подписать все ${globalDocumentsToSign.length} документ(ов)?`,
            type: 'confirm',
            confirmText: 'Подписать все',
            cancelText: 'Отмена',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
    
    if (!confirmed) {
        return;
    }
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        // Show loading notification
        if (typeof notifyInfo === 'function') {
            notifyInfo('Подписание документов...');
        }
        
        // Sign all documents sequentially
        for (const doc of globalDocumentsToSign) {
            try {
                const body = {};
                if (doc.id) {
                    body.document_id = doc.id.toString();
                }
                
                const result = await apiRequest(`/client/documents/accept/${doc.document_type}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
                });
                
                if (result && !result.error) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Error signing document:', doc.document_type, result?.error);
                }
            } catch (error) {
                errorCount++;
                console.error('Error signing document:', doc.document_type, error);
            }
        }
        
        // Reload documents status
        await checkDocumentsStatus();
        
        // Reload partners data if affiliate_terms was signed
        const hasAffiliateTerms = globalDocumentsToSign.some(doc => doc.document_type === 'affiliate_terms');
        if (hasAffiliateTerms) {
            await loadPartnersData();
        }
        
        // Show result notification
        if (errorCount === 0) {
            notifySuccess(`Все документы успешно подписаны (${successCount})`);
        } else {
            notifyWarning(`Подписано: ${successCount}, ошибок: ${errorCount}`);
        }
    } catch (error) {
        console.error('Error signing all documents:', error);
        notifyError('Ошибка при подписании документов');
    }
}

// Show document acceptance modal
async function showDocumentAcceptanceModal(documentType, documentTitle, documentUrl) {
    return new Promise(async (resolve) => {
        const documentTypeLabels = {
            'privacy': 'Политика конфиденциальности',
            'affiliate_terms': 'Условия партнерской программы',
            'cabinet_terms': 'Условия использования личного кабинета',
            'subscription_terms': 'Условия подписки',
        };
        
        const title = documentTypeLabels[documentType] || documentTitle;
        const checkboxId = `docAcceptCheckbox_${documentType}_${Date.now()}`;
        const acceptBtnId = `docAcceptBtn_${documentType}_${Date.now()}`;
        const modalId = `docModal_${documentType}_${Date.now()}`;
        
        const modalHtml = `
            <div class="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-8">
                <div class="text-center mb-6">
                    <i data-lucide="file-text" class="w-16 h-16 text-primary mx-auto mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">${title}</h2>
                    <p class="text-gray-700">
                        Для продолжения необходимо ознакомиться и принять условия.
                    </p>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6 mb-6 text-left max-h-96 overflow-y-auto border border-gray-200">
                    <div class="prose prose-sm max-w-none">
                        <p class="text-sm text-gray-700 mb-4">
                            Пожалуйста, ознакомьтесь с полным текстом документа, нажав на ссылку ниже.
                        </p>
                        <a href="${documentUrl}" target="_blank" class="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                            <span>Открыть полный текст документа</span>
                        </a>
                    </div>
                </div>
                
                <label class="flex items-start justify-center gap-3 mb-6 cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="${checkboxId}"
                        class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                    >
                    <span class="text-sm text-gray-700">
                        Я ознакомился и принимаю <a href="${documentUrl}" target="_blank" class="text-primary hover:underline font-semibold">${title.toLowerCase()}</a>
                    </span>
                </label>
                
                <div class="flex gap-3 justify-center">
                    <button 
                        id="${acceptBtnId}"
                        class="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        Принять
                    </button>
                    <button 
                        class="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        `;
        
        // Create modal
        const modalContainer = document.createElement('div');
        modalContainer.id = modalId;
        modalContainer.className = 'fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4';
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Get elements
        const checkbox = document.getElementById(checkboxId);
        const acceptBtn = document.getElementById(acceptBtnId);
        const cancelBtn = modalContainer.querySelector('button:last-child');
        
        // Checkbox handler
        if (checkbox && acceptBtn) {
            checkbox.addEventListener('change', function() {
                acceptBtn.disabled = !this.checked;
            });
        }
        
        // Accept button handler
        if (acceptBtn) {
            acceptBtn.addEventListener('click', async function() {
                if (checkbox && checkbox.checked) {
                    acceptBtn.disabled = true;
                    acceptBtn.textContent = 'Обработка...';
                    
                    // Sign document
                    const signed = await signDocument(documentType, true);
                    if (signed) {
                        modalContainer.remove();
                        resolve(true);
                    } else {
                        acceptBtn.disabled = false;
                        acceptBtn.textContent = 'Принять';
                    }
                }
            });
        }
        
        // Cancel button handler
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                modalContainer.remove();
                resolve(false);
            });
        }
        
        // Close on backdrop click
        modalContainer.addEventListener('click', function(e) {
            if (e.target === modalContainer) {
                modalContainer.remove();
                resolve(false);
            }
        });
    });
}

// Check and sign required documents on first login
async function checkAndSignRequiredDocuments() {
    try {
        const result = await apiRequest('/client/documents/');
        if (!result || result.error) {
            return;
        }
        
        const documentsToSign = result.data.documents_to_sign || [];
        const documentUrls = {
            'privacy': '/privacy.html',
            'cabinet_terms': '/cabinet-terms.html',
            'affiliate_terms': '/affiliate-terms.html',
            'subscription_terms': '/subscription-terms.html',
        };
        
        // Check for privacy policy (required on first login)
        const privacyDoc = documentsToSign.find(doc => doc.document_type === 'privacy');
        if (privacyDoc) {
            const docUrl = privacyDoc.slug ? `/document/${privacyDoc.slug}.html` : (documentUrls['privacy'] || '/privacy.html');
            const accepted = await showDocumentAcceptanceModal(
                'privacy',
                'Политика конфиденциальности',
                docUrl
            );
            if (!accepted) {
                // User cancelled, but we can continue (document will remain unsigned)
                console.log('Privacy policy acceptance cancelled');
            }
        }
        
        // Check for cabinet terms (required on first login)
        const cabinetTermsDoc = documentsToSign.find(doc => doc.document_type === 'cabinet_terms');
        if (cabinetTermsDoc) {
            const docUrl = cabinetTermsDoc.slug ? `/document/${cabinetTermsDoc.slug}.html` : (documentUrls['cabinet_terms'] || '/cabinet-terms.html');
            const accepted = await showDocumentAcceptanceModal(
                'cabinet_terms',
                'Условия использования личного кабинета',
                docUrl
            );
            if (!accepted) {
                // User cancelled, but we can continue (document will remain unsigned)
                console.log('Cabinet terms acceptance cancelled');
            }
        }
        
        // Reload documents status after signing
        await checkDocumentsStatus();
    } catch (error) {
        console.error('Error checking required documents:', error);
    }
}

// Initialize - Load all data from API
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Cabinet page loaded, initializing...');
    
    // Check auth
    if (!checkAuth()) {
        console.log('Auth check failed, redirecting to login');
        return;
    }
    
    // Load email verification status on all pages
    await loadEmailVerificationStatus();
    
    console.log('Auth check passed, loading data...');
    
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
    
    try {
        // Load profile FIRST and IMMEDIATELY (before other data)
        console.log('Loading profile...');
        await loadProfile();
        console.log('Profile loaded');
        
        // Pre-load all sections data in parallel (but profile is already loaded)
        console.log('Loading other sections...');
        await Promise.all([
            loadProducts(),
            loadSubscriptions(),
            loadPayments(),
            loadPartnersData()
        ]);
        console.log('All sections loaded');
        
        // Check documents status (loads banner on all pages and documents in profile)
        await checkDocumentsStatus();
        
        // Check and auto-sign required documents on first login
        await checkAndSignRequiredDocuments();
        
        // Check hash for section
        const hash = window.location.hash.replace('#', '');
        if (hash && ['products', 'subscriptions', 'payments', 'profile', 'partners', 'cards'].includes(hash)) {
            showSection(hash);
        } else {
            showSection('products');
        }
    } catch (error) {
        console.error('Error loading cabinet data:', error);
        notifyError('Ошибка загрузки данных. Обновите страницу.');
    } finally {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
    }
    
    // Check and auto-sign required documents on first login (after UI is loaded)
    // This is done separately to avoid blocking the UI if there's an error
    try {
        await checkAndSignRequiredDocuments();
    } catch (error) {
        console.error('Error checking required documents:', error);
        // Don't show error to user, just log it - document signing is not critical for basic functionality
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
    
    console.log('Cabinet initialization complete');
});

// Check and sign required documents on first login
async function checkAndSignRequiredDocuments() {
    try {
        const result = await apiRequest('/client/documents/');
        if (!result || result.error) {
            return;
        }
        
        const documentsToSign = result.data.documents_to_sign || [];
        const documentUrls = {
            'privacy': '/privacy.html',
            'cabinet_terms': '/cabinet-terms.html',
            'affiliate_terms': '/affiliate-terms.html',
            'subscription_terms': '/subscription-terms.html',
        };
        
        // Check for privacy policy (required on first login)
        const privacyDoc = documentsToSign.find(doc => doc.document_type === 'privacy');
        if (privacyDoc) {
            const docUrl = privacyDoc.slug ? `/document/${privacyDoc.slug}.html` : (documentUrls['privacy'] || '/privacy.html');
            const accepted = await showDocumentAcceptanceModal(
                'privacy',
                'Политика конфиденциальности',
                docUrl
            );
            if (!accepted) {
                // User cancelled, but we can continue (document will remain unsigned)
                console.log('Privacy policy acceptance cancelled');
            }
        }
        
        // Check for cabinet terms (required on first login)
        const cabinetTermsDoc = documentsToSign.find(doc => doc.document_type === 'cabinet_terms');
        if (cabinetTermsDoc) {
            const docUrl = cabinetTermsDoc.slug ? `/document/${cabinetTermsDoc.slug}.html` : (documentUrls['cabinet_terms'] || '/cabinet-terms.html');
            const accepted = await showDocumentAcceptanceModal(
                'cabinet_terms',
                'Условия использования личного кабинета',
                docUrl
            );
            if (!accepted) {
                // User cancelled, but we can continue (document will remain unsigned)
                console.log('Cabinet terms acceptance cancelled');
            }
        }
        
        // Reload documents status after signing
        await checkDocumentsStatus();
    } catch (error) {
        console.error('Error checking required documents:', error);
    }
}

// Initialize - Load all data from API
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Cabinet page loaded, initializing...');
    
    // Check auth
    if (!checkAuth()) {
        console.log('Auth check failed, redirecting to login');
        return;
    }
    
    // Load email verification status on all pages
    await loadEmailVerificationStatus();
    
    console.log('Auth check passed, loading data...');
    
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
    
    try {
        // Load profile FIRST and IMMEDIATELY (before other data)
        console.log('Loading profile...');
        await loadProfile();
        console.log('Profile loaded');
        
        // Pre-load all sections data in parallel (but profile is already loaded)
        console.log('Loading other sections...');
        await Promise.all([
            loadProducts(),
            loadSubscriptions(),
            loadPayments(),
            loadPartnersData()
        ]);
        console.log('All sections loaded');
        
        // Check documents status (loads banner on all pages and documents in profile)
        await checkDocumentsStatus();
        
        // Check and auto-sign required documents on first login
        await checkAndSignRequiredDocuments();
        
        // Check hash for section
        const hash = window.location.hash.replace('#', '');
        if (hash && ['products', 'subscriptions', 'payments', 'profile', 'partners', 'cards'].includes(hash)) {
            showSection(hash);
        } else {
            showSection('products');
        }
    } catch (error) {
        console.error('Error loading cabinet data:', error);
        notifyError('Ошибка загрузки данных. Обновите страницу.');
    } finally {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
    }
    
    // Check and auto-sign required documents on first login (after UI is loaded)
    // This is done separately to avoid blocking the UI if there's an error
    try {
        await checkAndSignRequiredDocuments();
    } catch (error) {
        console.error('Error checking required documents:', error);
        // Don't show error to user, just log it - document signing is not critical for basic functionality
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
    
    console.log('Cabinet initialization complete');
});
