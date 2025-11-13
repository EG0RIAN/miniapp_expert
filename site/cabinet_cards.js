/**
 * Payment Methods (Cards) Management
 */

// Load payment methods
async function loadPaymentMethods() {
    try {
        console.log('Loading payment methods...');
        const result = await apiRequest('/client/payment-methods/');
        
        if (result.success && result.data?.methods) {
            displayPaymentMethods(result.data.methods);
        } else {
            displayPaymentMethods([]);
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
        displayPaymentMethods([]);
    }
}

// Display payment methods
function displayPaymentMethods(methods) {
    const grid = document.getElementById('cardsGrid');
    const emptyState = document.getElementById('cardsEmpty');
    
    if (!grid || !emptyState) return;
    
    // Hide empty state by default
    emptyState.classList.add('hidden');
    
    if (!methods || methods.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    // Show grid
    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Render cards
    grid.innerHTML = methods.map(method => {
        const isDefault = method.is_default;
        const cardIcon = getCardBrandIcon(method.card_type);
        const cardBrand = method.card_type || 'Card';
        
        return `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <!-- Card Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        ${cardIcon}
                        <div>
                            <div class="font-semibold text-gray-900">${cardBrand}</div>
                            <div class="text-sm text-gray-500">•••• ${method.pan_mask}</div>
                        </div>
                    </div>
                    ${isDefault ? `
                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Основная
                        </span>
                    ` : ''}
                </div>
                
                <!-- Card Details -->
                <div class="space-y-2 mb-4">
                    ${method.exp_date ? `
                        <div class="text-sm text-gray-600">
                            <span class="text-gray-500">Срок действия:</span> ${method.exp_date}
                        </div>
                    ` : ''}
                    <div class="text-sm text-gray-600">
                        <span class="text-gray-500">Добавлена:</span> ${formatDate(method.created_at)}
                    </div>
                </div>
                
                <!-- Card Actions -->
                <div class="flex gap-2">
                    ${!isDefault ? `
                        <button 
                            onclick="setDefaultCard('${method.id}')"
                            class="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-semibold"
                        >
                            Сделать основной
                        </button>
                    ` : ''}
                    <button 
                        onclick="deleteCard('${method.id}', ${isDefault})"
                        class="px-4 py-2 ${isDefault ? 'flex-1' : ''} bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm font-semibold"
                        ${isDefault ? 'disabled title="Нельзя удалить основную карту"' : ''}
                    >
                        <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
                        Удалить
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Get card brand icon
function getCardBrandIcon(cardType) {
    const type = (cardType || '').toLowerCase();
    
    const icons = {
        'visa': `<div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">VISA</div>`,
        'mastercard': `<div class="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">MC</div>`,
        'maestro': `<div class="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">MAE</div>`,
        'mir': `<div class="w-12 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-sm">МИР</div>`,
    };
    
    return icons[type] || `<div class="w-12 h-8 bg-gray-400 rounded flex items-center justify-center">
        <i data-lucide="credit-card" class="w-5 h-5 text-white"></i>
    </div>`;
}

// Set default card
async function setDefaultCard(methodId) {
    if (!confirm('Сделать эту карту основной для автоматических платежей?')) {
        return;
    }
    
    showLoader();
    try {
        const result = await apiRequest(`/client/payment-methods/${methodId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ is_default: true })
        });
        
        if (result.success) {
            notifySuccess('Основная карта изменена');
            await loadPaymentMethods();
        } else {
            notifyError(result.message || 'Не удалось изменить основную карту');
        }
    } catch (error) {
        console.error('Error setting default card:', error);
        notifyError('Ошибка при изменении основной карты');
    } finally {
        hideLoader();
    }
}

// Delete card
async function deleteCard(methodId, isDefault) {
    if (isDefault) {
        notifyWarning('Нельзя удалить основную карту. Сначала установите другую карту как основную.');
        return;
    }
    
    if (!confirm('Удалить эту карту? Вы сможете привязать её снова при следующей оплате.')) {
        return;
    }
    
    showLoader();
    try {
        const result = await apiRequest(`/client/payment-methods/${methodId}/`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            notifySuccess('Карта удалена');
            await loadPaymentMethods();
        } else {
            notifyError(result.message || 'Не удалось удалить карту');
        }
    } catch (error) {
        console.error('Error deleting card:', error);
        notifyError('Ошибка при удалении карты');
    } finally {
        hideLoader();
    }
}

