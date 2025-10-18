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
            break;
        case 'requests':
            loadRequests();
            break;
    }
}

// Load Dashboard
function loadDashboard() {
    // Update stats
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const newRequests = requests.filter(r => r.status === 'new').length;
    
    document.getElementById('statCases').textContent = cases.length;
    document.getElementById('statSolutions').textContent = solutions.length;
    document.getElementById('statRequests').textContent = requests.length;
    document.getElementById('statNewRequests').textContent = newRequests;
    
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
});

