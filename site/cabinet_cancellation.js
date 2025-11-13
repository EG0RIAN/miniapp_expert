/**
 * Система отмены подписки через реферала
 */

console.log('🔵 Loading cabinet_cancellation.js...');

// API базовый URL
const API_BASE_URL = 'https://miniapp.expert/api';

/**
 * Запросить отмену подписки
 */
async function requestCancellation(subscriptionId, productName) {
    console.log('🔵 requestCancellation called', { subscriptionId, productName });
    
    try {
        // Показать модальное окно с причиной отмены
        const reason = await promptModal(
            'Почему вы хотите отменить подписку?',
            '',
            'Укажите причину отмены (необязательно)',
            'text'
        );
        
        if (reason === null) {
            // Пользователь нажал "Отмена"
            return;
        }
        
        // Отправить запрос на отмену
        const response = await fetch(`${API_BASE_URL}/client/cancellation-requests/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
                user_product_id: subscriptionId,
                cancellation_reason: reason || 'Не указана'
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal({
                title: 'Запрос отправлен',
                message: data.message || 'Ваш реферал примет решение в течение 24 часов.',
                type: 'success',
                confirmText: 'ОК',
            });
            
            // Обновить список подписок
            if (typeof loadSubscriptions === 'function') {
                setTimeout(() => loadSubscriptions(), 1000);
            }
        } else {
            showModal({
                title: 'Ошибка',
                message: data.error || data.errors ? JSON.stringify(data.errors) : 'Не удалось отправить запрос',
                type: 'error',
                confirmText: 'ОК',
            });
        }
    } catch (error) {
        console.error('Error requesting cancellation:', error);
        showModal({
            title: 'Ошибка',
            message: 'Произошла ошибка при отправке запроса на отмену',
            type: 'error',
            confirmText: 'ОК',
        });
    }
}

/**
 * Загрузить мои запросы на отмену
 */
async function loadMyCancellationRequests() {
    console.log('🔵 Loading my cancellation requests...');
    
    const container = document.getElementById('myCancellationRequestsContainer');
    const emptyState = document.getElementById('myCancellationRequestsEmpty');
    
    if (!container || !emptyState) {
        console.error('Cancellation requests containers not found');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/client/my-cancellation-requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
        });
        
        const data = await response.json();
        
        if (data.success && data.requests && data.requests.length > 0) {
            container.innerHTML = data.requests.map(req => `
                <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">${req.product_name}</h3>
                            <p class="text-sm text-gray-600 mt-1">Запрос от ${new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(req.status)}">
                            ${getStatusLabel(req.status)}
                        </span>
                    </div>
                    
                    ${req.cancellation_reason ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-600"><strong>Причина:</strong> ${req.cancellation_reason}</p>
                        </div>
                    ` : ''}
                    
                    ${req.status === 'pending' && req.time_left ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                            <p class="text-sm text-yellow-800">
                                <i data-lucide="clock" class="w-4 h-4 inline-block"></i>
                                <strong>Осталось времени:</strong> ${req.time_left}
                            </p>
                            ${req.referrer_email ? `
                                <p class="text-sm text-yellow-800 mt-1">
                                    Реферал ${req.referrer_email} принимает решение
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${req.status === 'approved' || req.status === 'expired' ? `
                        <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                            <p class="text-sm text-red-800">
                                <i data-lucide="check-circle" class="w-4 h-4 inline-block"></i>
                                Подписка отменена
                            </p>
                        </div>
                    ` : ''}
                    
                    ${req.status === 'rejected' ? `
                        <div class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                            <p class="text-sm text-green-800">
                                <i data-lucide="check-circle" class="w-4 h-4 inline-block"></i>
                                Подписка сохранена
                            </p>
                            ${req.decision_comment ? `
                                <p class="text-sm text-green-700 mt-2"><strong>Комментарий:</strong> ${req.decision_comment}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            emptyState.classList.add('hidden');
            container.classList.remove('hidden');
            
            // Re-render icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading cancellation requests:', error);
        container.innerHTML = '<p class="text-red-600">Ошибка загрузки запросов</p>';
    }
}

/**
 * Загрузить запросы на отмену от моих рефералов
 */
async function loadReferralCancellationRequests() {
    console.log('🔵 Loading referral cancellation requests...');
    
    const container = document.getElementById('referralCancellationRequestsContainer');
    const emptyState = document.getElementById('referralCancellationRequestsEmpty');
    
    if (!container || !emptyState) {
        console.error('Referral cancellation requests containers not found');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/client/referral-cancellation-requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
        });
        
        const data = await response.json();
        
        if (data.success && data.pending && data.pending.length > 0) {
            container.innerHTML = data.pending.map(req => `
                <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">${req.product_name}</h3>
                            <p class="text-sm text-gray-600 mt-1">От: ${req.user_email}</p>
                            <p class="text-sm text-gray-600">Запрос от ${new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                            ${req.time_left}
                        </span>
                    </div>
                    
                    ${req.cancellation_reason ? `
                        <div class="mb-4 bg-gray-50 rounded-xl p-3">
                            <p class="text-sm text-gray-700"><strong>Причина отмены:</strong></p>
                            <p class="text-sm text-gray-800 mt-1">${req.cancellation_reason}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <i data-lucide="alert-triangle" class="w-4 h-4 inline-block"></i>
                            <strong>Внимание:</strong> Если вы не примете решение в течение ${req.time_left}, подписка будет автоматически отменена.
                        </p>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            onclick="decideCancellationRequest('${req.id}', 'reject', '${req.user_email}', '${req.product_name}')"
                            class="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                        >
                            <i data-lucide="check" class="w-5 h-5 inline-block"></i>
                            Сохранить подписку
                        </button>
                        <button 
                            onclick="decideCancellationRequest('${req.id}', 'approve', '${req.user_email}', '${req.product_name}')"
                            class="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
                        >
                            <i data-lucide="x" class="w-5 h-5 inline-block"></i>
                            Отменить подписку
                        </button>
                    </div>
                </div>
            `).join('');
            
            emptyState.classList.add('hidden');
            container.classList.remove('hidden');
            
            // Re-render icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading referral cancellation requests:', error);
        container.innerHTML = '<p class="text-red-600">Ошибка загрузки запросов</p>';
    }
}

/**
 * Принять решение по запросу на отмену
 */
async function decideCancellationRequest(requestId, decision, userEmail, productName) {
    console.log('🔵 decideCancellationRequest called', { requestId, decision });
    
    try {
        const actionText = decision === 'approve' ? 'отменить подписку' : 'сохранить подписку';
        const confirmed = await confirmModal(
            `Вы уверены, что хотите ${actionText} для ${userEmail}?`,
            'Подтверждение действия'
        );
        
        if (!confirmed) {
            return;
        }
        
        // Запросить комментарий
        const comment = await promptModal(
            'Комментарий (необязательно)',
            '',
            'Ваш комментарий к решению',
            'text'
        );
        
        // Отправить решение
        const response = await fetch(`${API_BASE_URL}/client/cancellation-requests/${requestId}/decision/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
                decision: decision,
                comment: comment || ''
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal({
                title: 'Решение принято',
                message: data.message,
                type: 'success',
                confirmText: 'ОК',
            });
            
            // Обновить список запросов
            setTimeout(() => loadReferralCancellationRequests(), 1000);
        } else {
            showModal({
                title: 'Ошибка',
                message: data.error || 'Не удалось принять решение',
                type: 'error',
                confirmText: 'ОК',
            });
        }
    } catch (error) {
        console.error('Error deciding cancellation request:', error);
        showModal({
            title: 'Ошибка',
            message: 'Произошла ошибка при принятии решения',
            type: 'error',
            confirmText: 'ОК',
        });
    }
}

/**
 * Вспомогательные функции для статусов
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
        case 'expired':
            return 'bg-red-100 text-red-800';
        case 'rejected':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'pending':
            return 'Ожидает решения';
        case 'approved':
            return 'Одобрено';
        case 'rejected':
            return 'Отклонено';
        case 'expired':
            return 'Истекло';
        default:
            return status;
    }
}

// Экспортировать функции глобально
if (typeof window !== 'undefined') {
    window.requestCancellation = requestCancellation;
    window.loadMyCancellationRequests = loadMyCancellationRequests;
    window.loadReferralCancellationRequests = loadReferralCancellationRequests;
    window.decideCancellationRequest = decideCancellationRequest;
    
    console.log('✅ Cancellation functions exported to window');
}

