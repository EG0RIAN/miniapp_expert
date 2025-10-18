// ============================================
// CRUD ФУНКЦИИ ДЛЯ АДМИНКИ
// ============================================

let currentEditingUserId = null;

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(title, templateId) {
    const modal = document.getElementById('universalModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = title;
    
    const template = document.getElementById(templateId);
    if (template) {
        modalContent.innerHTML = template.content.cloneNode(true).querySelector('*').outerHTML;
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('universalModal').classList.add('hidden');
    currentEditingUserId = null;
}

// Close on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// ============================================
// CASES CRUD
// ============================================

function openAddCaseModal() {
    openModal('Добавить кейс', 'caseFormTemplate');
    
    setTimeout(() => {
        const form = document.getElementById('caseForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveCaseForm();
            };
        }
    }, 100);
}

function editCase(id) {
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const caseItem = cases.find(c => c.id === id);
    
    if (!caseItem) return;
    
    openModal('Редактировать кейс', 'caseFormTemplate');
    
    setTimeout(() => {
        document.getElementById('caseId').value = caseItem.id;
        document.getElementById('caseTitle').value = caseItem.title;
        document.getElementById('caseDescription').value = caseItem.description;
        document.getElementById('caseIcon').value = caseItem.icon || '';
        document.getElementById('caseLink').value = caseItem.link || '';
        
        if (caseItem.date) {
            const date = caseItem.date.split('.').reverse().join('-');
            document.getElementById('caseDate').value = date;
        }
        
        const form = document.getElementById('caseForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveCaseForm(id);
            };
        }
    }, 100);
}

function saveCaseForm(editId = null) {
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    
    const caseData = {
        id: editId || Date.now().toString(),
        title: document.getElementById('caseTitle').value,
        description: document.getElementById('caseDescription').value,
        icon: document.getElementById('caseIcon').value || '💼',
        link: document.getElementById('caseLink').value || '',
        date: document.getElementById('caseDate').value 
            ? new Date(document.getElementById('caseDate').value).toLocaleDateString('ru-RU')
            : new Date().toLocaleDateString('ru-RU')
    };
    
    if (editId) {
        const index = cases.findIndex(c => c.id === editId);
        cases[index] = caseData;
    } else {
        cases.push(caseData);
    }
    
    localStorage.setItem('cases', JSON.stringify(cases));
    closeModal();
    loadCases();
    loadDashboard();
}

// ============================================
// SOLUTIONS CRUD
// ============================================

function openAddSolutionModal() {
    openModal('Добавить коробочное решение', 'solutionFormTemplate');
    
    setTimeout(() => {
        const form = document.getElementById('solutionForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveSolutionForm();
            };
        }
    }, 100);
}

function editSolution(id) {
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const solution = solutions.find(s => s.id === id);
    
    if (!solution) return;
    
    openModal('Редактировать решение', 'solutionFormTemplate');
    
    setTimeout(() => {
        document.getElementById('solutionId').value = solution.id;
        document.getElementById('solutionTitle').value = solution.title;
        document.getElementById('solutionDescription').value = solution.description;
        document.getElementById('solutionPrice').value = solution.price;
        document.getElementById('solutionIcon').value = solution.icon || '';
        document.getElementById('solutionLaunchTime').value = solution.launchTime || '';
        document.getElementById('solutionAvailable').value = solution.available ? 'true' : 'false';
        
        const form = document.getElementById('solutionForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveSolutionForm(id);
            };
        }
    }, 100);
}

function saveSolutionForm(editId = null) {
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    
    const solutionData = {
        id: editId || Date.now().toString(),
        title: document.getElementById('solutionTitle').value,
        description: document.getElementById('solutionDescription').value,
        price: document.getElementById('solutionPrice').value,
        icon: document.getElementById('solutionIcon').value || '📦',
        launchTime: document.getElementById('solutionLaunchTime').value || '2-3 дня',
        available: document.getElementById('solutionAvailable').value === 'true'
    };
    
    if (editId) {
        const index = solutions.findIndex(s => s.id === editId);
        solutions[index] = solutionData;
    } else {
        solutions.push(solutionData);
    }
    
    localStorage.setItem('solutions', JSON.stringify(solutions));
    closeModal();
    loadSolutions();
    loadDashboard();
}

// ============================================
// USERS CRUD (ENHANCED)
// ============================================

function openAddUserModal() {
    openModal('Добавить пользователя', 'userFormTemplate');
    
    setTimeout(() => {
        const form = document.getElementById('userForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveUserForm();
            };
        }
    }, 100);
}

function editUser(id) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === id);
    
    if (!user) return;
    
    openModal('Редактировать пользователя', 'userFormTemplate');
    
    setTimeout(() => {
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        
        const form = document.getElementById('userForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                saveUserForm(id);
            };
        }
    }, 100);
}

function saveUserForm(editId = null) {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    const userData = {
        id: editId || Date.now().toString(),
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value || '',
        registrationDate: editId 
            ? users.find(u => u.id === editId).registrationDate 
            : new Date().toISOString(),
        products: editId ? users.find(u => u.id === editId).products || [] : [],
        subscriptions: editId ? users.find(u => u.id === editId).subscriptions || [] : []
    };
    
    if (editId) {
        const index = users.findIndex(u => u.id === editId);
        users[index] = {...users[index], ...userData};
    } else {
        users.push(userData);
    }
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    closeModal();
    loadUsers();
    loadDashboard();
}

function manageUserProducts(userId) {
    currentEditingUserId = userId;
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    openModal(`Продукты: ${user.name}`, 'manageProductsTemplate');
    
    setTimeout(() => {
        const availableProducts = [
            { id: 'real-estate', name: 'Mini App для недвижимости', icon: '🏢' },
            { id: 'crypto', name: 'Mini App для крипто-обменников', icon: '💱' },
            { id: 'custom', name: 'Индивидуальный проект', icon: '⚡' }
        ];
        
        const userProducts = user.products || [];
        const container = document.getElementById('productCheckboxes');
        
        container.innerHTML = availableProducts.map(product => {
            const hasProduct = userProducts.some(p => p.id === product.id);
            return `
                <label class="flex items-center justify-between p-4 border-2 ${hasProduct ? 'border-primary bg-primary/5' : 'border-gray-200'} rounded-xl cursor-pointer hover:border-primary transition">
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">${product.icon}</span>
                        <span class="font-semibold">${product.name}</span>
                    </div>
                    <input 
                        type="checkbox" 
                        ${hasProduct ? 'checked' : ''} 
                        data-product-id="${product.id}"
                        data-product-name="${product.name}"
                        data-product-icon="${product.icon}"
                        class="w-6 h-6 text-primary rounded"
                    >
                </label>
            `;
        }).join('');
    }, 100);
}

function saveUserProducts() {
    if (!currentEditingUserId) return;
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === currentEditingUserId);
    
    if (userIndex === -1) return;
    
    const checkboxes = document.querySelectorAll('#productCheckboxes input[type="checkbox"]');
    const products = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            products.push({
                id: checkbox.dataset.productId,
                name: checkbox.dataset.productName,
                icon: checkbox.dataset.productIcon,
                dateAdded: new Date().toISOString(),
                status: 'active'
            });
        }
    });
    
    users[userIndex].products = products;
    localStorage.setItem('adminUsers', JSON.stringify(users));
    
    closeModal();
    loadUsers();
}

function manageUserSubscriptions(userId) {
    currentEditingUserId = userId;
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    openModal(`Подписки: ${user.name}`, 'manageSubscriptionsTemplate');
    
    setTimeout(() => {
        const availableSubscriptions = [
            { id: 'basic', name: 'Базовая поддержка', price: 5000, icon: '🛠️' },
            { id: 'premium', name: 'Премиум поддержка', price: 15000, icon: '⭐' },
            { id: 'enterprise', name: 'Enterprise поддержка', price: 30000, icon: '🏆' }
        ];
        
        const userSubs = user.subscriptions || [];
        const container = document.getElementById('subscriptionCheckboxes');
        
        container.innerHTML = availableSubscriptions.map(sub => {
            const hasSub = userSubs.some(s => s.id === sub.id);
            return `
                <label class="flex items-center justify-between p-4 border-2 ${hasSub ? 'border-secondary bg-secondary/5' : 'border-gray-200'} rounded-xl cursor-pointer hover:border-secondary transition">
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">${sub.icon}</span>
                        <div>
                            <div class="font-semibold">${sub.name}</div>
                            <div class="text-sm text-gray-500">${sub.price.toLocaleString()}₽/мес</div>
                        </div>
                    </div>
                    <input 
                        type="checkbox" 
                        ${hasSub ? 'checked' : ''} 
                        data-sub-id="${sub.id}"
                        data-sub-name="${sub.name}"
                        data-sub-price="${sub.price}"
                        class="w-6 h-6 text-secondary rounded"
                    >
                </label>
            `;
        }).join('');
    }, 100);
}

function saveUserSubscriptions() {
    if (!currentEditingUserId) return;
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === currentEditingUserId);
    
    if (userIndex === -1) return;
    
    const checkboxes = document.querySelectorAll('#subscriptionCheckboxes input[type="checkbox"]');
    const subscriptions = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            subscriptions.push({
                id: checkbox.dataset.subId,
                name: checkbox.dataset.subName,
                price: parseInt(checkbox.dataset.subPrice),
                dateAdded: new Date().toISOString(),
                nextPayment: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                status: 'active'
            });
        }
    });
    
    users[userIndex].subscriptions = subscriptions;
    localStorage.setItem('adminUsers', JSON.stringify(users));
    
    closeModal();
    loadUsers();
}

// ============================================
// CONTENT CRUD
// ============================================

function saveContent(section) {
    const content = {
        heroTitle: document.querySelector('#section-content input[type="text"]')?.value,
        heroSubtitle: document.querySelector('#section-content textarea')?.value,
        contactEmail: document.querySelectorAll('#section-content input[type="email"]')[0]?.value,
        contactTelegram: document.querySelectorAll('#section-content input[type="text"]')[1]?.value
    };
    
    localStorage.setItem('siteContent', JSON.stringify(content));
    alert('✅ Контент сохранен!');
}

// ============================================
// EXPORT/IMPORT DATA
// ============================================

function exportAllData() {
    const data = {
        cases: JSON.parse(localStorage.getItem('cases') || '[]'),
        solutions: JSON.parse(localStorage.getItem('solutions') || '[]'),
        requests: JSON.parse(localStorage.getItem('requests') || '[]'),
        users: JSON.parse(localStorage.getItem('adminUsers') || '[]'),
        quickOrders: JSON.parse(localStorage.getItem('quickOrders') || '[]'),
        moduleOrders: JSON.parse(localStorage.getItem('moduleOrders') || '[]'),
        supportTickets: JSON.parse(localStorage.getItem('supportTickets') || '[]'),
        content: JSON.parse(localStorage.getItem('siteContent') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miniapp-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    alert('✅ Полный бэкап данных скачан!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('⚠️ Импортировать данные?\n\nВсе текущие данные будут заменены!')) {
                    if (data.cases) localStorage.setItem('cases', JSON.stringify(data.cases));
                    if (data.solutions) localStorage.setItem('solutions', JSON.stringify(data.solutions));
                    if (data.requests) localStorage.setItem('requests', JSON.stringify(data.requests));
                    if (data.users) localStorage.setItem('adminUsers', JSON.stringify(data.users));
                    if (data.quickOrders) localStorage.setItem('quickOrders', JSON.stringify(data.quickOrders));
                    if (data.moduleOrders) localStorage.setItem('moduleOrders', JSON.stringify(data.moduleOrders));
                    if (data.supportTickets) localStorage.setItem('supportTickets', JSON.stringify(data.supportTickets));
                    if (data.content) localStorage.setItem('siteContent', JSON.stringify(data.content));
                    
                    alert('✅ Данные успешно импортированы!');
                    location.reload();
                }
            } catch (err) {
                alert('❌ Ошибка чтения файла:\n' + err.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// BATCH OPERATIONS
// ============================================

function deleteAllCases() {
    if (confirm('⚠️ Удалить ВСЕ кейсы?\n\nЭто действие нельзя отменить!')) {
        if (confirm('Вы уверены? Последнее предупреждение!')) {
            localStorage.removeItem('cases');
            loadCases();
            loadDashboard();
            alert('✅ Все кейсы удалены');
        }
    }
}

function deleteAllSolutions() {
    if (confirm('⚠️ Удалить ВСЕ решения?\n\nЭто действие нельзя отменить!')) {
        if (confirm('Вы уверены? Последнее предупреждение!')) {
            localStorage.removeItem('solutions');
            loadSolutions();
            loadDashboard();
            alert('✅ Все решения удалены');
        }
    }
}

function deleteAllUsers() {
    if (confirm('⚠️ Удалить ВСЕХ пользователей?\n\nВсе продукты и подписки будут удалены!\n\nЭто действие нельзя отменить!')) {
        if (confirm('Вы ДЕЙСТВИТЕЛЬНО уверены? Последнее предупреждение!')) {
            localStorage.removeItem('adminUsers');
            loadUsers();
            loadDashboard();
            alert('✅ Все пользователи удалены');
        }
    }
}

// ============================================
// STATISTICS
// ============================================

function getStatistics() {
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const orders = JSON.parse(localStorage.getItem('quickOrders') || '[]');
    
    const totalRevenue = users.reduce((sum, user) => {
        const productRevenue = (user.products || []).length * 150000; // Примерная стоимость
        return sum + productRevenue;
    }, 0);
    
    return {
        totalCases: cases.length,
        totalSolutions: solutions.length,
        totalRequests: requests.length,
        newRequests: requests.filter(r => r.status === 'new').length,
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        activeProducts: users.reduce((sum, u) => sum + (u.products?.length || 0), 0),
        activeSubscriptions: users.reduce((sum, u) => sum + (u.subscriptions?.length || 0), 0)
    };
}

console.log('✅ CRUD модуль загружен');

