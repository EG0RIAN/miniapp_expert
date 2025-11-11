/**
 * Notification System - красивые уведомления вместо alert()
 */

// Create notification container if it doesn't exist
function createNotificationContainer() {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full md:w-auto';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }
    return document.getElementById('notification-container');
}

// Show notification
function showNotification(message, type = 'info', duration = 5000) {
    const container = createNotificationContainer();
    
    // Parse message for emojis and newlines
    const hasEmoji = /[🚀✅❌⚠️💡💰📱🔧🏢💱🛍️☕✓⚡⚙️⏰💬📋🍕]/.test(message);
    const lines = message.split('\n');
    
    // Determine notification type
    let bgColor, borderColor, iconColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-50';
            borderColor = 'border-green-500';
            iconColor = 'text-green-600';
            icon = 'check-circle-2';
            break;
        case 'error':
            bgColor = 'bg-red-50';
            borderColor = 'border-red-500';
            iconColor = 'text-red-600';
            icon = 'x-circle';
            break;
        case 'warning':
            bgColor = 'bg-yellow-50';
            borderColor = 'border-yellow-500';
            iconColor = 'text-yellow-600';
            icon = 'alert-triangle';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-50';
            borderColor = 'border-blue-500';
            iconColor = 'text-blue-600';
            icon = 'info';
            break;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `${bgColor} border-l-4 ${borderColor} rounded-lg shadow-lg p-4 animate-slide-in-right pointer-events-auto transform transition-all duration-300`;
    notification.style.minWidth = '320px';
    notification.style.maxWidth = '480px';
    
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 ${iconColor} mt-0.5">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-900 break-words">
                    ${lines.map((line, i) => i === 0 ? `<div>${line}</div>` : `<div class="mt-1">${line}</div>`).join('')}
                </div>
            </div>
            <button onclick="this.closest('.pointer-events-auto').remove()" class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
    
    // Add click to close
    notification.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    });
    
    return notification;
}

// Helper functions
function notifySuccess(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

function notifyError(message, duration = 6000) {
    return showNotification(message, 'error', duration);
}

function notifyWarning(message, duration = 6000) {
    return showNotification(message, 'warning', duration);
}

function notifyInfo(message, duration = 5000) {
    return showNotification(message, 'info', duration);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
    }
    
    @media (max-width: 640px) {
        #notification-container {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: 100%;
        }
        
        #notification-container > div {
            min-width: 100%;
            max-width: 100%;
        }
    }
`;
document.head.appendChild(style);

