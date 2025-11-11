/**
 * Modal System - красивые модальные окна вместо prompt() и confirm()
 */

// Create modal container if it doesn't exist
function createModalContainer() {
    if (!document.getElementById('modal-container')) {
        const container = document.createElement('div');
        container.id = 'modal-container';
        container.className = 'fixed inset-0 z-[10000] hidden';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }
    return document.getElementById('modal-container');
}

// Show modal
function showModal(options = {}) {
    const {
        title = 'Уведомление',
        message = '',
        type = 'info', // info, confirm, prompt, warning
        placeholder = '',
        defaultValue = '',
        inputType = 'text',
        confirmText = 'ОК',
        cancelText = 'Отмена',
        onConfirm = null,
        onCancel = null,
        html = null
    } = options;
    
    const container = createModalContainer();
    container.style.pointerEvents = 'auto';
    container.classList.remove('hidden');
    
    // Determine colors based on type
    let primaryColor, iconColor, icon;
    switch (type) {
        case 'success':
            primaryColor = 'bg-green-600 hover:bg-green-700';
            iconColor = 'text-green-600';
            icon = 'check-circle-2';
            break;
        case 'error':
            primaryColor = 'bg-red-600 hover:bg-red-700';
            iconColor = 'text-red-600';
            icon = 'x-circle';
            break;
        case 'warning':
            primaryColor = 'bg-yellow-600 hover:bg-yellow-700';
            iconColor = 'text-yellow-600';
            icon = 'alert-triangle';
            break;
        case 'confirm':
            primaryColor = 'bg-blue-600 hover:bg-blue-700';
            iconColor = 'text-blue-600';
            icon = 'help-circle';
            break;
        default:
            primaryColor = 'bg-primary hover:bg-primary/90';
            iconColor = 'text-primary';
            icon = 'info';
            break;
    }
    
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 transition-opacity';
    backdrop.id = 'modal-backdrop';
    
    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 flex items-center justify-center p-4';
    dialog.id = 'modal-dialog';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all';
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflow = 'auto';
    
    // Parse message for newlines
    const messageLines = message.split('\n').map(line => `<div>${line}</div>`).join('');
    
    // Create input field for prompt type
    let inputField = '';
    if (type === 'prompt') {
        inputField = `
        <div class="mt-4">
            <input 
                type="${inputType}" 
                id="modal-input" 
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                placeholder="${placeholder}"
                value="${defaultValue}"
                autofocus
                ${inputType === 'number' ? 'min="0" step="0.01"' : ''}
            >
        </div>
    `;
    }
    
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 ${iconColor}">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>
                    ${html || `<div class="text-gray-700 whitespace-pre-line">${messageLines}</div>`}
                    ${inputField}
                </div>
            </div>
            <div class="mt-6 flex gap-3 justify-end">
                ${type === 'confirm' || type === 'prompt' ? `
                    <button 
                        id="modal-cancel" 
                        class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                        ${cancelText}
                    </button>
                ` : ''}
                <button 
                    id="modal-confirm" 
                    class="px-6 py-2 ${primaryColor} text-white rounded-xl font-semibold transition"
                >
                    ${confirmText}
                </button>
            </div>
        </div>
    `;
    
    dialog.appendChild(modalContent);
    container.innerHTML = '';
    container.appendChild(backdrop);
    container.appendChild(dialog);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Handle confirm
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.addEventListener('click', () => {
        const value = type === 'prompt' ? document.getElementById('modal-input').value : true;
        closeModal();
        if (onConfirm) {
            onConfirm(value);
        }
    });
    
    // Handle cancel
    if (type === 'confirm' || type === 'prompt') {
        const cancelBtn = document.getElementById('modal-cancel');
        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) {
                onCancel();
            }
        });
        
        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                if (onCancel) {
                    onCancel();
                }
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    // Handle backdrop click
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeModal();
            if (onCancel) {
                onCancel();
            }
        }
    });
    
    // Focus input if prompt
    if (type === 'prompt') {
        setTimeout(() => {
            const input = document.getElementById('modal-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    }
    
    // Animate in
    setTimeout(() => {
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
}

// Close modal
function closeModal() {
    const container = document.getElementById('modal-container');
    if (container) {
        container.style.pointerEvents = 'none';
        const dialog = container.querySelector('#modal-dialog');
        if (dialog) {
            const content = dialog.querySelector('div');
            if (content) {
                content.style.opacity = '0';
                content.style.transform = 'scale(0.95)';
            }
        }
        setTimeout(() => {
            container.classList.add('hidden');
        }, 200);
    }
}

// Promise-based confirm
function confirmModal(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
        showModal({
            title,
            message,
            type: 'confirm',
            confirmText: 'Да',
            cancelText: 'Отмена',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
}

// Promise-based prompt
function promptModal(message, defaultValue = '', placeholder = '', inputType = 'text') {
    return new Promise((resolve) => {
        showModal({
            title: 'Ввод данных',
            message,
            type: 'prompt',
            defaultValue,
            placeholder,
            inputType,
            confirmText: 'ОК',
            cancelText: 'Отмена',
            onConfirm: (value) => resolve(value),
            onCancel: () => resolve(null)
        });
    });
}

// Add CSS
const style = document.createElement('style');
style.textContent = `
    #modal-container {
        transition: opacity 0.2s;
    }
    
    #modal-dialog > div {
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.2s, transform 0.2s;
    }
    
    @media (max-width: 640px) {
        #modal-dialog {
            padding: 1rem;
        }
        
        #modal-dialog > div {
            max-width: 100%;
        }
    }
`;
document.head.appendChild(style);

