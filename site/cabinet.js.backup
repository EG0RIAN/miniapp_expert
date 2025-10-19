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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    if (!checkAuth()) return;
    
    // Load profile
    loadProfile();
    
    // Load products
    loadProducts();
});



