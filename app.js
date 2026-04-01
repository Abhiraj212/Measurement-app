// ==========================================
// APP - Main application functions
// ==========================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for DataManager to be available
    if (typeof DataManager === 'undefined') {
        console.error('DataManager not loaded!');
        return;
    }
    
    DataManager.init();
    updateBadge();
    
    // Check for overdue orders every 5 minutes
    setInterval(checkOverdue, 300000);
    
    // Initialize page-specific functions
    initPage();
});

// Initialize page-specific functionality
function initPage() {
    const path = window.location.pathname;
    
    // Handle scanned data on add-customer page
    if (path.includes('add-customer')) {
        checkScannedData();
        checkCalculatedPrice();
    }
    
    // Handle URL filters on customers page
    if (path.includes('customers')) {
        const filter = getUrlParam('filter');
        if (filter && typeof filterCustomers === 'function') {
            filterCustomers(filter);
        }
    }
}

// Update navigation badge
function updateBadge() {
    const stats = DataManager.getStats();
    const badges = document.querySelectorAll('#customerBadge, .nav-badge');
    badges.forEach(badge => {
        const count = stats.pending + stats.ready;
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

// Check for overdue orders
function checkOverdue() {
    const stats = DataManager.getStats();
    if (stats.overdue > 0) {
        showToast(`${stats.overdue} orders are overdue!`, 'warning');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log(message); // Fallback if no toast container
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Trigger confetti animation
function triggerConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    
    container.classList.remove('hidden');
    container.innerHTML = '';
    
    const colors = ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'];
    
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(piece);
    }
    
    setTimeout(() => {
        container.classList.add('hidden');
        container.innerHTML = '';
    }, 5000);
}

// Quick call function
function quickCall(phone) {
    if (phone) window.location.href = `tel:${phone}`;
}

// Quick WhatsApp function
function quickWhatsApp(phone, id) {
    const customer = DataManager.getCustomer(id);
    if (!customer || !phone) {
        showToast('Customer or phone not found', 'error');
        return;
    }
    
    const message = `Hi ${customer.name}, this is regarding your ${customer.dressType} order at Seema Boutique. Order status: ${customer.orderStatus}. Pending amount: ₹${customer.payment?.remaining || 0}`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Quick SMS function
function quickSMS(phone, id) {
    const customer = DataManager.getCustomer(id);
    if (!customer || !phone) {
        showToast('Customer or phone not found', 'error');
        return;
    }
    
    const message = `Hi ${customer.name}, your ${customer.dressType} is ready for pickup. Pending: ₹${customer.payment?.remaining || 0}. -Seema Boutique`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
}

// Render home page
function renderHome() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    
    const stats = DataManager.getStats();
    
    main.innerHTML = `
        <div class="home-hero">
            <h1>👗 Seema Boutique</h1>
            <p>Professional Tailor Management</p>
        </div>
        
        <div class="quick-stats">
            <div class="quick-stat" onclick="location.href='customers.html?filter=pending'">
                <span class="quick-stat-number">${stats.pending}</span>
                <span class="quick-stat-label">Pending</span>
            </div>
            <div class="quick-stat" onclick="location.href='customers.html?filter=ready'">
                <span class="quick-stat-number">${stats.ready}</span>
                <span class="quick-stat-label">Ready</span>
            </div>
            <div class="quick-stat" onclick="location.href='customers.html?filter=overdue'">
                <span class="quick-stat-number" style="color: var(--danger)">${stats.overdue}</span>
                <span class="quick-stat-label">Overdue</span>
            </div>
            <div class="quick-stat" onclick="location.href='dashboard.html'">
                <span class="quick-stat-number" style="color: var(--success)">₹${(stats.monthRevenue/1000).toFixed(1)}k</span>
                <span class="quick-stat-label">This Month</span>
            </div>
        </div>
        
        <div class="action-grid">
            <a href="add-customer.html" class="action-card">
                <div class="action-icon">➕</div>
                <h3>Add Customer</h3>
                <p>Create new order</p>
            </a>
            <a href="customers.html" class="action-card">
                <div class="action-icon">👥</div>
                <h3>View All</h3>
                <p>${stats.total} customers</p>
            </a>
            <a href="chat.html" class="action-card">
                <div class="action-icon">💬</div>
                <h3>Quick Add</h3>
                <p>Chat mode</p>
            </a>
            <a href="scan.html" class="action-card">
                <div class="action-icon">📷</div>
                <h3>Scan</h3>
                <p>OCR capture</p>
            </a>
        </div>
        
        <div class="recent-section">
            <h2>
                Recent Customers
                <a href="customers.html">View All →</a>
            </h2>
            <div id="recentCustomers"></div>
        </div>
    `;
    
    // Load recent customers
    const recent = DataManager.getCustomers()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
    
    const recentContainer = document.getElementById('recentCustomers');
    if (recentContainer) {
        if (recent.length === 0) {
            recentContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No customers yet. Add your first!</p>';
        } else {
            recentContainer.innerHTML = recent.map(c => `
                <div class="customer-card-enhanced" onclick="location.href='customer-detail.html?id=${c.id}'" style="margin-bottom: 12px;">
                    <div class="card-main">
                        <div class="customer-avatar-large">
                            ${c.photo ? `<img src="${c.photo}">` : c.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="customer-info-main">
                            <div class="info-header">
                                <h3 class="customer-name">${c.name}</h3>
                            </div>
                            <div class="info-meta">
                                <span>${c.dressType || 'Unknown'}</span>
                                <span>•</span>
                                <span>₹${c.payment?.total || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Handle URL parameters for filters
function getUrlParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Format currency
function formatCurrency(amount) {
    return '₹' + (amount || 0).toLocaleString();
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff < 7) return `In ${diff} days`;
    
    return date.toLocaleDateString();
}

// Check for scanned data
function checkScannedData() {
    const scanned = sessionStorage.getItem('scannedData');
    if (scanned && window.location.search.includes('scanned=true')) {
        try {
            const data = JSON.parse(scanned);
            const nameInput = document.getElementById('name');
            const phoneInput = document.getElementById('phone');
            
            if (data.name && nameInput) nameInput.value = data.name;
            if (data.phone && phoneInput) phoneInput.value = data.phone;
            
            // Measurements
            const fields = ['chest', 'waist', 'hip', 'length', 'sleeve', 'shoulder'];
            fields.forEach(field => {
                const input = document.getElementById(field);
                if (input && data[field]) input.value = data[field];
            });
            
            // Payment
            const totalInput = document.getElementById('totalAmount');
            const advanceInput = document.getElementById('advanceAmount');
            if (totalInput && data.total) totalInput.value = data.total;
            if (advanceInput && data.advance) advanceInput.value = data.advance;
            
            sessionStorage.removeItem('scannedData');
            showToast('Data imported from scan', 'success');
        } catch (e) {
            console.error('Error parsing scanned data:', e);
        }
    }
}

// Check for calculated price
function checkCalculatedPrice() {
    const price = sessionStorage.getItem('calculatedPrice');
    if (price && window.location.search.includes('calculated=true')) {
        const totalInput = document.getElementById('totalAmount');
        if (totalInput) {
            totalInput.value = price;
            sessionStorage.removeItem('calculatedPrice');
            showToast('Price imported from calculator', 'success');
        }
    }
}

// Export functions for use in other scripts
window.showToast = showToast;
window.triggerConfetti = triggerConfetti;
window.quickCall = quickCall;
window.quickWhatsApp = quickWhatsApp;
window.quickSMS = quickSMS;
window.updateBadge = updateBadge;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getUrlParam = getUrlParam;
window.renderHome = renderHome;