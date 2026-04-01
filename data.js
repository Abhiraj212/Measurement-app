// ==========================================
// DATA MANAGER - Handles all storage operations
// ==========================================

const DataManager = {
    KEYS: {
        CUSTOMERS: 'seema_customers_v2',
        SETTINGS: 'seema_settings',
        BACKUP: 'seema_backup',
        TEMPLATES: 'seema_templates',
        HISTORY: 'calc_history'
    },

    // Initialize and migrate old data
    init() {
        this.migrateData();
        return this.getCustomers();
    },

    migrateData() {
        const oldKey = 'seema_boutique_data';
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                if (Array.isArray(parsed)) {
                    this.saveCustomers(parsed);
                    localStorage.removeItem(oldKey);
                    console.log('Data migrated successfully');
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }
    },

    // Get all customers
    getCustomers() {
        try {
            const data = localStorage.getItem(this.KEYS.CUSTOMERS);
            if (data) return JSON.parse(data);
            
            const backup = localStorage.getItem(this.KEYS.BACKUP);
            if (backup) return JSON.parse(backup);
        } catch (e) {
            console.error('Load error:', e);
        }
        return [];
    },

    // Get single customer
    getCustomer(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id);
    },

    // Save all customers
    saveCustomers(customers) {
        try {
            const data = JSON.stringify(customers);
            localStorage.setItem(this.KEYS.CUSTOMERS, data);
            localStorage.setItem(this.KEYS.BACKUP, data);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('Storage full! Please export and clear old data.');
            }
            return false;
        }
    },

    // Add new customer
    addCustomer(customer) {
        const customers = this.getCustomers();
        customers.push(customer);
        return this.saveCustomers(customers);
    },

    // Update customer
    updateCustomer(updated) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === updated.id);
        if (index !== -1) {
            customers[index] = updated;
            return this.saveCustomers(customers);
        }
        return false;
    },

    // Delete customer
    deleteCustomer(id) {
        const customers = this.getCustomers().filter(c => c.id !== id);
        return this.saveCustomers(customers);
    },

    // Get settings
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) || {};
        } catch {
            return {};
        }
    },

    // Save settings
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    // Export to JSON file
    exportToFile() {
        const data = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            customers: this.getCustomers(),
            settings: this.getSettings()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seema-boutique-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    },

    // Import from JSON file
    importFromFile(fileContent) {
        try {
            const data = JSON.parse(fileContent);
            if (!data.customers || !Array.isArray(data.customers)) {
                throw new Error('Invalid backup file format');
            }
            
            if (this.saveCustomers(data.customers)) {
                if (data.settings) {
                    this.saveSettings(data.settings);
                }
                return { success: true, count: data.customers.length };
            }
            return { success: false, error: 'Failed to save' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // Calculate statistics
    getStats() {
        const customers = this.getCustomers();
        const now = new Date();
        const today = now.toDateString();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        return {
            total: customers.length,
            pending: customers.filter(c => c.orderStatus === 'pending').length,
            ready: customers.filter(c => c.orderStatus === 'ready').length,
            delivered: customers.filter(c => c.orderStatus === 'delivered').length,
            overdue: customers.filter(c => 
                c.deliveryDate && 
                new Date(c.deliveryDate) < now && 
                c.orderStatus !== 'delivered'
            ).length,
            todayNew: customers.filter(c => 
                new Date(c.createdAt).toDateString() === today
            ).length,
            totalRevenue: customers.reduce((sum, c) => sum + (c.payment?.total || 0), 0),
            monthRevenue: customers
                .filter(c => {
                    const d = new Date(c.createdAt);
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
                })
                .reduce((sum, c) => sum + (c.payment?.advance || 0), 0),
            pendingAmount: customers.reduce((sum, c) => sum + (c.payment?.remaining || 0), 0),
            vipCount: customers.filter(c => c.category === 'vip').length
        };
    }
};

// Make DataManager available globally
window.DataManager = DataManager;