// Проверка авторизации
function checkAuth() {
    if (localStorage.getItem('adminAuth') !== 'true') {
        window.location.href = '/admin-login.html';
        return false;
    }
    return true;
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        window.location.href = '/admin-login.html';
    }
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
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
    
    // Load section data
    loadSectionData(sectionId);
}

// Load section data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'cases':
            loadCases();
            break;
        case 'solutions':
            loadSolutions();
            loadSolutionsManager();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'users':
            loadUsers();
            break;
        case 'partners':
            loadPartners();
            break;
    }
}

// Load Dashboard
function loadDashboard() {
    // Update stats
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const newRequests = requests.filter(r => r.status === 'new').length;
    
    document.getElementById('statCases').textContent = cases.length;
    document.getElementById('statSolutions').textContent = solutions.length;
    document.getElementById('statRequests').textContent = requests.length;
    document.getElementById('statNewRequests').textContent = newRequests;
    
    // Update users count in sidebar
    document.getElementById('usersCount').textContent = `${users.length} клиентов`;
    
    // Update login time
    const loginTime = localStorage.getItem('adminLoginTime');
    if (loginTime) {
        const time = new Date(loginTime);
        document.getElementById('loginTime').textContent = formatTime(time);
    }
}

// Format time
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Load Cases
function loadCases() {
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const container = document.getElementById('casesList');
    
    if (cases.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 bg-white rounded-2xl shadow-sm p-12 text-center">
                <div class="text-6xl mb-4">💼</div>
                <h3 class="text-2xl font-bold mb-2">Пока нет кейсов</h3>
                <p class="text-gray-600 mb-6">Добавьте первый кейс, чтобы начать</p>
                <button onclick="openAddCaseModal()" class="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                    + Добавить кейс
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cases.map(caseItem => `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-gray-100 hover:border-primary/30 transition">
            <div class="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span class="text-6xl">${caseItem.icon || '💼'}</span>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${caseItem.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${caseItem.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500">${caseItem.date || 'Дата не указана'}</span>
                    <div class="flex gap-2">
                        <button onclick="editCase('${caseItem.id}')" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                            ✏️ Редактировать
                        </button>
                        <button onclick="deleteCase('${caseItem.id}')" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Solutions
function loadSolutions() {
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const container = document.getElementById('solutionsList');
    
    if (solutions.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 bg-white rounded-2xl shadow-sm p-12 text-center">
                <div class="text-6xl mb-4">📦</div>
                <h3 class="text-2xl font-bold mb-2">Пока нет решений</h3>
                <p class="text-gray-600 mb-6">Добавьте первое коробочное решение</p>
                <button onclick="openAddSolutionModal()" class="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                    + Добавить решение
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = solutions.map(solution => `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-gray-100 hover:border-primary/30 transition">
            <div class="h-48 bg-gradient-to-br from-${solution.available ? 'primary' : 'gray'}/10 to-secondary/10 flex items-center justify-center relative">
                <span class="text-6xl">${solution.icon || '📦'}</span>
                <div class="absolute top-4 right-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${solution.available ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${solution.available ? '✅ Доступно' : '⏳ Скоро'}
                    </span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${solution.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${solution.description}</p>
                <div class="flex items-center justify-between mb-4">
                    <div class="text-2xl font-bold text-primary">${solution.price}</div>
                    <div class="text-sm text-gray-500">${solution.launchTime || '2-3 дня'}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editSolution('${solution.id}')" class="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        ✏️ Редактировать
                    </button>
                    <button onclick="deleteSolution('${solution.id}')" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Requests
function loadRequests() {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const tbody = document.getElementById('requestsTable');
    
    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    Пока нет заявок
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = requests.map(request => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-6 py-4 text-sm">${formatDate(request.date)}</td>
            <td class="px-6 py-4 text-sm font-semibold">${request.name}</td>
            <td class="px-6 py-4 text-sm">${request.contact}</td>
            <td class="px-6 py-4 text-sm">${request.message || '-'}</td>
            <td class="px-6 py-4">
                <select onchange="updateRequestStatus('${request.id}', this.value)" class="px-3 py-1 rounded-lg text-sm border-2 ${getStatusColor(request.status)}">
                    <option value="new" ${request.status === 'new' ? 'selected' : ''}>Новая</option>
                    <option value="processing" ${request.status === 'processing' ? 'selected' : ''}>В работе</option>
                    <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>Отклонена</option>
                </select>
            </td>
            <td class="px-6 py-4">
                <button onclick="deleteRequest('${request.id}')" class="text-red-600 hover:text-red-700">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update count
    const newCount = requests.filter(r => r.status === 'new').length;
    document.getElementById('requestsCount').textContent = `${newCount} новых`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
}

function getStatusColor(status) {
    switch(status) {
        case 'new': return 'border-green-200 bg-green-50 text-green-700';
        case 'processing': return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'completed': return 'border-gray-200 bg-gray-50 text-gray-700';
        case 'rejected': return 'border-red-200 bg-red-50 text-red-700';
        default: return 'border-gray-200';
    }
}

// Update request status
function updateRequestStatus(id, status) {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
        requests[index].status = status;
        localStorage.setItem('requests', JSON.stringify(requests));
        loadRequests();
    }
}

// Delete request
function deleteRequest(id) {
    if (confirm('Удалить заявку?')) {
        let requests = JSON.parse(localStorage.getItem('requests') || '[]');
        requests = requests.filter(r => r.id !== id);
        localStorage.setItem('requests', JSON.stringify(requests));
        loadRequests();
    }
}

// Modal functions (placeholder)
function openAddCaseModal() {
    const title = prompt('Название кейса:');
    if (!title) return;
    
    const description = prompt('Описание:');
    const icon = prompt('Иконка (emoji):') || '💼';
    
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    cases.push({
        id: Date.now().toString(),
        title,
        description,
        icon,
        date: new Date().toLocaleDateString('ru-RU')
    });
    
    localStorage.setItem('cases', JSON.stringify(cases));
    loadCases();
    loadDashboard();
}

function editCase(id) {
    alert('Функция редактирования в разработке');
}

function deleteCase(id) {
    if (confirm('Удалить кейс?')) {
        let cases = JSON.parse(localStorage.getItem('cases') || '[]');
        cases = cases.filter(c => c.id !== id);
        localStorage.setItem('cases', JSON.stringify(cases));
        loadCases();
        loadDashboard();
    }
}

function openAddSolutionModal() {
    const title = prompt('Название решения:');
    if (!title) return;
    
    const description = prompt('Описание:');
    const price = prompt('Цена (например, от 150K₽):');
    const icon = prompt('Иконка (emoji):') || '📦';
    const available = confirm('Доступно сейчас?');
    
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    solutions.push({
        id: Date.now().toString(),
        title,
        description,
        price,
        icon,
        available,
        launchTime: '2-3 дня'
    });
    
    localStorage.setItem('solutions', JSON.stringify(solutions));
    loadSolutions();
    loadDashboard();
}

function editSolution(id) {
    alert('Функция редактирования в разработке');
}

function deleteSolution(id) {
    if (confirm('Удалить решение?')) {
        let solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        solutions = solutions.filter(s => s.id !== id);
        localStorage.setItem('solutions', JSON.stringify(solutions));
        loadSolutions();
        loadDashboard();
    }
}

// Export data
function exportData() {
    const data = {
        cases: JSON.parse(localStorage.getItem('cases') || '[]'),
        solutions: JSON.parse(localStorage.getItem('solutions') || '[]'),
        requests: JSON.parse(localStorage.getItem('requests') || '[]')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miniapp-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Clear data
function clearData() {
    if (confirm('Вы уверены? Все данные будут удалены безвозвратно!')) {
        if (confirm('Это действие нельзя отменить. Продолжить?')) {
            localStorage.removeItem('cases');
            localStorage.removeItem('solutions');
            localStorage.removeItem('requests');
            alert('Все данные удалены');
            location.reload();
        }
    }
}

// Load Users
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div class="text-6xl mb-4">👥</div>
                <h3 class="text-2xl font-bold mb-2">Пока нет пользователей</h3>
                <p class="text-gray-600 mb-6">Пользователи появятся после регистрации или добавьте вручную</p>
                <button onclick="openAddUserModal()" class="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition">
                    + Добавить пользователя
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="bg-white rounded-2xl shadow-sm p-6">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold mb-1">${user.name}</h3>
                        <p class="text-gray-600 text-sm mb-3">${user.email}</p>
                        <div class="flex gap-2 mb-3">
                            <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                ${user.products ? user.products.length : 0} продуктов
                            </span>
                            <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                ${user.subscriptions ? user.subscriptions.length : 0} подписок
                            </span>
                        </div>
                        <p class="text-xs text-gray-500">Регистрация: ${formatDate(user.registrationDate)}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="manageUserProducts('${user.id}')" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
                        📱 Продукты
                    </button>
                    <button onclick="manageUserSubscriptions('${user.id}')" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition text-sm">
                        🔄 Подписки
                    </button>
                    <button onclick="editUser('${user.id}')" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm">
                        ✏️
                    </button>
                    <button onclick="deleteUser('${user.id}')" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Manage user products
function manageUserProducts(userId) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const availableProducts = [
        { id: 'real-estate', name: 'Mini App для недвижимости', icon: '🏢' },
        { id: 'crypto', name: 'Mini App для крипто-обменников', icon: '💱' },
        { id: 'custom', name: 'Индивидуальный проект', icon: '⚡' }
    ];
    
    const userProducts = user.products || [];
    
    let html = '<div style="max-width: 500px">';
    html += `<h3 class="text-xl font-bold mb-4">Продукты пользователя: ${user.name}</h3>`;
    
    availableProducts.forEach(product => {
        const hasProduct = userProducts.some(p => p.id === product.id);
        html += `
            <label class="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl mb-3 cursor-pointer hover:border-primary">
                <div class="flex items-center space-x-3">
                    <span class="text-3xl">${product.icon}</span>
                    <span class="font-semibold">${product.name}</span>
                </div>
                <input type="checkbox" ${hasProduct ? 'checked' : ''} 
                    onchange="toggleUserProduct('${userId}', '${product.id}', '${product.name}', '${product.icon}', this.checked)"
                    class="w-5 h-5 text-primary">
            </label>
        `;
    });
    
    html += '</div>';
    
    if (confirm('Управление продуктами через модальное окно. Используйте функции ниже:\n\n✅ - Выдать продукт\n❌ - Отобрать продукт')) {
        // В реальной версии здесь будет модальное окно
        const action = prompt(`Введите:\n+ ${availableProducts[0].id} - выдать\n- ${availableProducts[0].id} - отобрать\n\nПример: + real-estate`);
        
        if (action) {
            const isAdd = action.startsWith('+');
            const productId = action.slice(1).trim();
            const product = availableProducts.find(p => p.id === productId);
            
            if (product) {
                toggleUserProduct(userId, product.id, product.name, product.icon, isAdd);
            }
        }
    }
}

// Toggle user product
function toggleUserProduct(userId, productId, productName, productIcon, add) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    if (!users[userIndex].products) {
        users[userIndex].products = [];
    }
    
    if (add) {
        // Add product
        if (!users[userIndex].products.some(p => p.id === productId)) {
            users[userIndex].products.push({
                id: productId,
                name: productName,
                icon: productIcon,
                dateAdded: new Date().toISOString(),
                status: 'active'
            });
            alert(`✅ Продукт "${productName}" выдан пользователю!`);
        }
    } else {
        // Remove product
        users[userIndex].products = users[userIndex].products.filter(p => p.id !== productId);
        alert(`❌ Продукт "${productName}" отозван!`);
    }
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    loadUsers();
}

// Manage user subscriptions
function manageUserSubscriptions(userId) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const availableSubscriptions = [
        { id: 'basic', name: 'Базовая поддержка', price: 5000, icon: '🛠️' },
        { id: 'premium', name: 'Премиум поддержка', price: 15000, icon: '⭐' },
        { id: 'enterprise', name: 'Enterprise поддержка', price: 30000, icon: '🏆' }
    ];
    
    const action = prompt(`Управление подписками: ${user.name}\n\nВведите:\n+ basic - выдать базовую\n- basic - отменить\n\nДоступные: basic, premium, enterprise`);
    
    if (action) {
        const isAdd = action.startsWith('+');
        const subId = action.slice(1).trim();
        const subscription = availableSubscriptions.find(s => s.id === subId);
        
        if (subscription) {
            toggleUserSubscription(userId, subscription.id, subscription.name, subscription.price, isAdd);
        }
    }
}

// Toggle user subscription
function toggleUserSubscription(userId, subId, subName, price, add) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    if (!users[userIndex].subscriptions) {
        users[userIndex].subscriptions = [];
    }
    
    if (add) {
        if (!users[userIndex].subscriptions.some(s => s.id === subId)) {
            users[userIndex].subscriptions.push({
                id: subId,
                name: subName,
                price: price,
                dateAdded: new Date().toISOString(),
                nextPayment: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                status: 'active'
            });
            alert(`✅ Подписка "${subName}" активирована!`);
        }
    } else {
        users[userIndex].subscriptions = users[userIndex].subscriptions.filter(s => s.id !== subId);
        alert(`❌ Подписка "${subName}" отменена!`);
    }
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    loadUsers();
}

// Add user
function openAddUserModal() {
    const name = prompt('Имя и фамилия:');
    if (!name) return;
    
    const email = prompt('Email:');
    if (!email) return;
    
    const phone = prompt('Телефон:');
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    users.push({
        id: Date.now().toString(),
        name: name,
        email: email,
        phone: phone || '',
        registrationDate: new Date().toISOString(),
        products: [],
        subscriptions: []
    });
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    loadUsers();
    loadDashboard();
    alert('✅ Пользователь добавлен!');
}

// Edit user
function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const name = prompt('Имя и фамилия:', user.name);
    if (!name) return;
    
    const phone = prompt('Телефон:', user.phone);
    
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex].name = name;
    users[userIndex].phone = phone;
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    loadUsers();
    alert('✅ Пользователь обновлен!');
}

// Delete user
function deleteUser(userId) {
    if (confirm('Удалить пользователя?\n\nВсе его продукты и подписки будут удалены!')) {
        let users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('adminUsers', JSON.stringify(users));
        loadUsers();
        loadDashboard();
        alert('✅ Пользователь удален!');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    if (!checkAuth()) return;
    
    // Set username
    const username = localStorage.getItem('adminUser') || 'Admin';
    document.getElementById('adminUsername').textContent = username;
    
    // Load dashboard
    loadDashboard();
    
    // Add demo data if empty
    if (!localStorage.getItem('cases')) {
        localStorage.setItem('cases', JSON.stringify([
            {
                id: '1',
                title: 'Mosca Caffè',
                description: 'Сеть кофеен с программой лояльности',
                icon: '☕',
                date: '15.10.2024'
            },
            {
                id: '2',
                title: 'Alfin',
                description: 'Финансовый сервис для бизнеса',
                icon: '💰',
                date: '12.10.2024'
            },
            {
                id: '3',
                title: 'Кукушка',
                description: 'Доставка готовых блюд',
                icon: '🍔',
                date: '10.10.2024'
            },
            {
                id: '4',
                title: 'Улыбка Радуги',
                description: 'Детский развлекательный центр',
                icon: '🎪',
                date: '08.10.2024'
            }
        ]));
    }
    
    if (!localStorage.getItem('solutions')) {
        localStorage.setItem('solutions', JSON.stringify([
            {
                id: '1',
                title: 'Mini App для недвижимости',
                description: 'Каталог объектов, фильтры, запись на просмотр',
                price: 'от 150K₽',
                icon: '🏢',
                available: true,
                launchTime: '2-3 дня'
            },
            {
                id: '2',
                title: 'Mini App для крипто-обменников',
                description: 'Обмен криптовалюты, актуальные курсы',
                price: 'от 300K₽',
                icon: '💱',
                available: false,
                launchTime: 'в разработке'
            }
        ]));
    }
    
    // Add demo users if empty
    if (!localStorage.getItem('adminUsers')) {
        localStorage.setItem('adminUsers', JSON.stringify([
            {
                id: '1',
                name: 'Иван Петров',
                email: 'ivan@example.com',
                phone: '+7 (999) 123-45-67',
                registrationDate: '2025-10-15T10:00:00.000Z',
                products: [
                    {
                        id: 'real-estate',
                        name: 'Mini App для недвижимости',
                        icon: '🏢',
                        dateAdded: '2025-10-15T10:30:00.000Z',
                        status: 'active'
                    }
                ],
                subscriptions: [
                    {
                        id: 'basic',
                        name: 'Базовая поддержка',
                        price: 5000,
                        dateAdded: '2025-10-15T10:30:00.000Z',
                        nextPayment: '2025-11-15T10:30:00.000Z',
                        status: 'active'
                    }
                ]
            },
            {
                id: '2',
                name: 'Мария Сидорова',
                email: 'maria@agency.com',
                phone: '+7 (999) 987-65-43',
                registrationDate: '2025-10-12T14:20:00.000Z',
                products: [
                    {
                        id: 'real-estate',
                        name: 'Mini App для недвижимости',
                        icon: '🏢',
                        dateAdded: '2025-10-12T14:45:00.000Z',
                        status: 'active'
                    }
                ],
                subscriptions: [
                    {
                        id: 'premium',
                        name: 'Премиум поддержка',
                        price: 15000,
                        dateAdded: '2025-10-12T14:45:00.000Z',
                        nextPayment: '2025-11-12T14:45:00.000Z',
                        status: 'active'
                    }
                ]
            }
        ]));
    }
    
    // Initialize partners demo data
    if (!localStorage.getItem('partners')) {
        localStorage.setItem('partners', JSON.stringify([
            {
                id: 'partner1',
                name: 'Алексей Смирнов',
                email: 'alexey@example.com',
                referralCode: 'ALEXEY',
                referralsCount: 5,
                conversions: 3,
                earned: 15000,
                paid: 10000,
                balance: 5000,
                status: 'active',
                registrationDate: '2025-10-01'
            },
            {
                id: 'partner2',
                name: 'Мария Иванова',
                email: 'maria@example.com',
                referralCode: 'MARIA',
                referralsCount: 3,
                conversions: 1,
                earned: 5000,
                paid: 0,
                balance: 5000,
                status: 'active',
                registrationDate: '2025-10-10'
            }
        ]));
    }
});

// Load Partners
function loadPartners() {
    const partners = JSON.parse(localStorage.getItem('partners') || '[]');
    
    // Update stats
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.status === 'active').length;
    const totalPaid = partners.reduce((sum, p) => sum + (p.paid || 0), 0);
    const pendingPayouts = partners.reduce((sum, p) => sum + (p.balance || 0), 0);
    
    document.getElementById('totalPartners').textContent = totalPartners;
    document.getElementById('activePartners').textContent = activePartners;
    document.getElementById('totalPaid').textContent = `${totalPaid.toLocaleString('ru-RU')} ₽`;
    document.getElementById('pendingPayouts').textContent = `${pendingPayouts.toLocaleString('ru-RU')} ₽`;
    document.getElementById('partnersCount').textContent = `${totalPartners} партнеров`;
    
    // Load partners table
    const tbody = document.getElementById('partnersTableBody');
    if (partners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-gray-500">Нет партнеров</td></tr>';
        return;
    }
    
    tbody.innerHTML = partners.map(partner => {
        const conversionRate = partner.referralsCount > 0 ? 
            ((partner.conversions / partner.referralsCount) * 100).toFixed(0) : 0;
        
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="p-4">
                    <div class="font-semibold">${partner.name}</div>
                    <div class="text-xs text-gray-500">${partner.email}</div>
                    <div class="text-xs text-gray-400 mt-1">Код: ${partner.referralCode}</div>
                </td>
                <td class="p-4">
                    <div class="text-lg font-bold">${partner.referralsCount}</div>
                    <div class="text-xs text-gray-500">${partner.conversions} купили</div>
                </td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${conversionRate > 30 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                        ${conversionRate}%
                    </span>
                </td>
                <td class="p-4">
                    <div class="font-bold text-primary">${partner.earned.toLocaleString('ru-RU')} ₽</div>
                    <div class="text-xs text-gray-500">Баланс: ${partner.balance.toLocaleString('ru-RU')} ₽</div>
                </td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                        ${partner.status === 'active' ? '✅ Активен' : '⏸️ Неактивен'}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <button onclick="viewPartnerDetails('${partner.id}')" class="text-primary hover:text-primary/80 transition text-sm">
                            👁️ Детали
                        </button>
                        <button onclick="processPayoutModal('${partner.id}')" class="text-green-600 hover:text-green-700 transition text-sm">
                            💸 Выплата
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// View partner details
function viewPartnerDetails(partnerId) {
    const partners = JSON.parse(localStorage.getItem('partners') || '[]');
    const partner = partners.find(p => p.id === partnerId);
    
    if (!partner) return;
    
    alert(`🤝 Партнер: ${partner.name}\n\n` +
          `📧 Email: ${partner.email}\n` +
          `🔗 Реферальный код: ${partner.referralCode}\n` +
          `👥 Рефералов: ${partner.referralsCount}\n` +
          `✅ Конверсий: ${partner.conversions}\n` +
          `💰 Заработано: ${partner.earned.toLocaleString('ru-RU')} ₽\n` +
          `💳 Выплачено: ${partner.paid.toLocaleString('ru-RU')} ₽\n` +
          `💵 Баланс: ${partner.balance.toLocaleString('ru-RU')} ₽\n` +
          `📅 Дата регистрации: ${new Date(partner.registrationDate).toLocaleDateString('ru-RU')}`);
}

// Process payout modal
function processPayoutModal(partnerId) {
    const partners = JSON.parse(localStorage.getItem('partners') || '[]');
    const partner = partners.find(p => p.id === partnerId);
    
    if (!partner || partner.balance === 0) {
        alert('⚠️ У партнера нет средств для вывода');
        return;
    }
    
    const confirm = window.confirm(`💸 Подтвердите выплату:\n\n` +
                                   `Партнер: ${partner.name}\n` +
                                   `Сумма: ${partner.balance.toLocaleString('ru-RU')} ₽\n\n` +
                                   `Выплатить?`);
    
    if (confirm) {
        // Update partner balance
        partner.paid += partner.balance;
        partner.balance = 0;
        
        // Save
        const updatedPartners = partners.map(p => p.id === partnerId ? partner : p);
        localStorage.setItem('partners', JSON.stringify(updatedPartners));
        
        alert(`✅ Выплата ${partner.balance} ₽ для ${partner.name} обработана!`);
        loadPartners();
    }
}

// Open partner settings modal
function openPartnerSettingsModal() {
    const commission = prompt('Введите процент комиссии для партнеров:', '20');
    const minPayout = prompt('Введите минимальную сумму для вывода (₽):', '0');
    
    if (commission && minPayout) {
        localStorage.setItem('partnerCommission', commission);
        localStorage.setItem('partnerMinPayout', minPayout);
        alert(`✅ Настройки сохранены:\n\n` +
              `Комиссия: ${commission}%\n` +
              `Минимум для вывода: ${minPayout} ₽`);
    }
}

// ===== SOLUTIONS MANAGER =====

let currentSolutionId = null;

// Load solutions manager
function loadSolutionsManager() {
    // Initialize demo solutions data
    if (!localStorage.getItem('solutionsData')) {
        const demoSolutions = {
            'real-estate': {
                id: 'real-estate',
                title: 'Mini App для недвижимости',
                description: 'Полнофункциональное приложение для риэлторов в Telegram',
                slug: 'real-estate-solution',
                icon: '🏢',
                basePrice: 150000,
                currency: 'RUB',
                discount: 0,
                launchTime: '15 минут',
                baseFeatures: [
                    'Каталог объектов',
                    'Запись на просмотр',
                    'Чат с риэлтором',
                    'Админ-панель',
                    'Настройка под ваш бренд'
                ],
                extraServices: [
                    { id: 'tours', name: 'Виртуальные туры', description: '3D просмотр объектов', price: 20000, enabled: true },
                    { id: 'mortgage', name: 'Ипотечный калькулятор', description: 'Расчет платежей', price: 15000, enabled: true }
                ]
            }
        };
        localStorage.setItem('solutionsData', JSON.stringify(demoSolutions));
    }
}

// Load solutions list
function loadSolutions() {
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const container = document.getElementById('solutionsList');
    
    if (Object.keys(solutionsData).length === 0) {
        container.innerHTML = '<div class="col-span-2 text-center p-8 text-gray-500">Нет решений. Добавьте первое!</div>';
        return;
    }
    
    container.innerHTML = Object.values(solutionsData).map(solution => `
        <div class="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200 hover:border-primary transition">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <span class="text-4xl">${solution.icon}</span>
                    <div>
                        <h3 class="font-bold text-lg">${solution.title}</h3>
                        <p class="text-sm text-gray-500">${solution.slug}.html</p>
                    </div>
                </div>
            </div>
            
            <p class="text-gray-600 text-sm mb-4">${solution.description}</p>
            
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Базовая цена:</span>
                    <span class="font-bold text-primary">${solution.basePrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Доп. услуги:</span>
                    <span class="font-bold">${solution.extraServices.length}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Срок запуска:</span>
                    <span class="font-bold">${solution.launchTime}</span>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="openSolutionManager('${solution.id}')" class="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm">
                    ⚙️ Управлять
                </button>
                <button onclick="previewSolution('${solution.id}')" class="flex-1 border-2 border-primary text-primary py-2 rounded-lg font-semibold hover:bg-primary/10 transition text-sm">
                    👁️ Просмотр
                </button>
            </div>
        </div>
    `).join('');
}

// Open solution manager
function openSolutionManager(solutionId) {
    currentSolutionId = solutionId;
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[solutionId];
    
    if (!solution) return;
    
    // Show manager
    document.getElementById('solutionManager').classList.remove('hidden');
    document.getElementById('selectedSolutionTitle').textContent = `Управление: ${solution.title}`;
    
    // Load pricing data
    document.getElementById('solutionBasePrice').value = solution.basePrice;
    document.getElementById('solutionCurrency').value = solution.currency || 'RUB';
    document.getElementById('solutionDiscount').value = solution.discount || 0;
    document.getElementById('solutionLaunchTime').value = solution.launchTime;
    
    // Load content data
    document.getElementById('solutionPageTitle').value = solution.title;
    document.getElementById('solutionPageDescription').value = solution.description;
    document.getElementById('solutionSlug').value = solution.slug;
    document.getElementById('solutionIcon').value = solution.icon;
    
    // Load base features
    loadBaseFeaturesEditor(solution.baseFeatures || []);
    
    // Load extra services
    loadExtraServicesEditor(solution.extraServices || []);
    
    // Scroll to manager
    document.getElementById('solutionManager').scrollIntoView({ behavior: 'smooth' });
}

// Close solution manager
function closeSolutionManager() {
    document.getElementById('solutionManager').classList.add('hidden');
    currentSolutionId = null;
}

// Switch solution tab
function switchSolutionTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.solution-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active from all tab buttons
    document.querySelectorAll('.solution-tab').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-primary', 'text-primary');
        btn.classList.add('text-gray-500');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Activate button
    const activeBtn = document.querySelector(`.solution-tab[data-tab="${tabName}"]`);
    activeBtn.classList.add('border-b-2', 'border-primary', 'text-primary');
    activeBtn.classList.remove('text-gray-500');
}

// Save solution pricing
function saveSolutionPricing() {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    solution.basePrice = parseInt(document.getElementById('solutionBasePrice').value);
    solution.currency = document.getElementById('solutionCurrency').value;
    solution.discount = parseInt(document.getElementById('solutionDiscount').value);
    solution.launchTime = document.getElementById('solutionLaunchTime').value;
    
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    alert('✅ Цены сохранены!');
    loadSolutions();
}

// Save solution content
function saveSolutionContent() {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    solution.title = document.getElementById('solutionPageTitle').value;
    solution.description = document.getElementById('solutionPageDescription').value;
    solution.slug = document.getElementById('solutionSlug').value;
    solution.icon = document.getElementById('solutionIcon').value;
    
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    alert('✅ Контент сохранен!');
    loadSolutions();
}

// Load base features editor
function loadBaseFeaturesEditor(features) {
    const container = document.getElementById('baseFeaturesListEditor');
    
    container.innerHTML = features.map((feature, index) => `
        <div class="flex items-center gap-3">
            <input type="text" 
                   value="${feature}" 
                   class="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-primary outline-none"
                   data-feature-index="${index}">
            <button onclick="removeBaseFeature(${index})" class="text-red-600 hover:text-red-700">
                🗑️
            </button>
        </div>
    `).join('');
}

// Add base feature
function addBaseFeature() {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    const featureName = prompt('Название функции:');
    if (featureName) {
        solution.baseFeatures.push(featureName);
        localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
        loadBaseFeaturesEditor(solution.baseFeatures);
    }
}

// Remove base feature
function removeBaseFeature(index) {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    solution.baseFeatures.splice(index, 1);
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    loadBaseFeaturesEditor(solution.baseFeatures);
}

// Save solution features
function saveSolutionFeatures() {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    // Get updated features from inputs
    const features = [];
    document.querySelectorAll('#baseFeaturesListEditor input').forEach(input => {
        if (input.value.trim()) {
            features.push(input.value.trim());
        }
    });
    
    solution.baseFeatures = features;
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    alert('✅ Функции сохранены!');
}

// Load extra services editor
function loadExtraServicesEditor(services) {
    const container = document.getElementById('extraServicesList');
    
    if (services.length === 0) {
        container.innerHTML = '<div class="text-center p-8 text-gray-500">Нет дополнительных услуг</div>';
        return;
    }
    
    container.innerHTML = services.map((service, index) => `
        <div class="bg-gray-50 rounded-xl p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold mb-2">Название</label>
                    <input type="text" 
                           value="${service.name}" 
                           class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                           data-service-index="${index}"
                           data-field="name">
                </div>
                <div>
                    <label class="block text-xs font-semibold mb-2">Цена</label>
                    <input type="number" 
                           value="${service.price}" 
                           class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                           data-service-index="${index}"
                           data-field="price">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold mb-2">Описание</label>
                    <input type="text" 
                           value="${service.description}" 
                           class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                           data-service-index="${index}"
                           data-field="description">
                </div>
                <div class="flex items-center justify-between md:col-span-2">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" 
                               ${service.enabled ? 'checked' : ''}
                               class="w-5 h-5 text-primary rounded"
                               data-service-index="${index}"
                               data-field="enabled">
                        <span class="text-sm font-semibold">Включить услугу</span>
                    </label>
                    <button onclick="removeExtraService(${index})" class="text-red-600 hover:text-red-700 text-sm font-semibold">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add extra service
function addExtraService() {
    const name = prompt('Название услуги:');
    if (!name) return;
    
    const price = prompt('Цена услуги (₽):');
    if (!price) return;
    
    const description = prompt('Описание услуги:');
    
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    solution.extraServices.push({
        id: 'service_' + Date.now(),
        name: name,
        description: description || '',
        price: parseInt(price),
        enabled: true
    });
    
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    loadExtraServicesEditor(solution.extraServices);
}

// Remove extra service
function removeExtraService(index) {
    if (!confirm('Удалить эту услугу?')) return;
    
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    solution.extraServices.splice(index, 1);
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    loadExtraServicesEditor(solution.extraServices);
}

// Save solution extras
function saveSolutionExtras() {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[currentSolutionId];
    
    // Get updated services from inputs
    const services = [];
    const serviceElements = document.querySelectorAll('#extraServicesList > div');
    
    serviceElements.forEach((el, index) => {
        const nameInput = el.querySelector('[data-field="name"]');
        const priceInput = el.querySelector('[data-field="price"]');
        const descInput = el.querySelector('[data-field="description"]');
        const enabledInput = el.querySelector('[data-field="enabled"]');
        
        services.push({
            id: solution.extraServices[index].id,
            name: nameInput.value,
            price: parseInt(priceInput.value),
            description: descInput.value,
            enabled: enabledInput.checked
        });
    });
    
    solution.extraServices = services;
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    alert('✅ Дополнительные услуги сохранены!');
    loadSolutions();
}

// Preview solution
function previewSolution(solutionId) {
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    const solution = solutionsData[solutionId];
    
    if (solution && solution.slug) {
        window.open(`/${solution.slug}.html`, '_blank');
    }
}

// Open add solution modal
function openAddSolutionModal() {
    const name = prompt('Название решения:');
    if (!name) return;
    
    const price = prompt('Базовая цена (₽):');
    if (!price) return;
    
    const slug = name.toLowerCase()
        .replace(/[^а-яa-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[а-я]/g, (char) => {
            const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
            const en = 'abvgdeejziyklmnoprstufhccss_y_eua';
            return en[ru.indexOf(char)] || char;
        });
    
    const id = slug;
    
    const solutionsData = JSON.parse(localStorage.getItem('solutionsData') || '{}');
    
    solutionsData[id] = {
        id: id,
        title: name,
        description: 'Новое коробочное решение',
        slug: slug,
        icon: '📦',
        basePrice: parseInt(price),
        currency: 'RUB',
        discount: 0,
        launchTime: '2-3 дня',
        baseFeatures: [],
        extraServices: []
    };
    
    localStorage.setItem('solutionsData', JSON.stringify(solutionsData));
    alert('✅ Решение создано! Теперь настройте его.');
    loadSolutions();
    openSolutionManager(id);
}

