// Dashboard Helper Utilities
class DashboardHelpers {
    /**
     * Format number as currency
     */
    static formatCurrency(amount, currency = 'MWK') {
        if (!amount) return `${currency} 0`;
        return `${currency} ${parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    /**
     * Format date to readable format
     */
    static formatDate(date, format = 'MM/DD/YYYY') {
        if (!date) return '';
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        
        if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
        if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
        if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
        
        return d.toLocaleDateString();
    }

    /**
     * Format timestamp to time only
     */
    static formatTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return this.formatDate(date);
    }

    /**
     * Truncate text to specified length
     */
    static truncateText(text, length = 50) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    /**
     * Generate unique ID
     */
    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Show modal dialog
     */
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close modal dialog
     */
    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Close all modals
     */
    static closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Show toast notification
     */
    static showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'warning' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Show error notification
     */
    static showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    /**
     * Show success notification
     */
    static showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    /**
     * Show warning notification
     */
    static showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }

    /**
     * Debounce function execution
     */
    static debounce(func, delay = 500) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }

    /**
     * Throttle function execution
     */
    static throttle(func, delay = 1000) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            }
        };
    }

    /**
     * Sort array by property
     */
    static sortBy(arr, property, ascending = true) {
        return [...arr].sort((a, b) => {
            if (ascending) {
                return a[property] > b[property] ? 1 : -1;
            }
            return a[property] < b[property] ? 1 : -1;
        });
    }

    /**
     * Filter array by multiple criteria
     */
    static filterByCriteria(arr, criteria) {
        return arr.filter(item => {
            return Object.keys(criteria).every(key => {
                if (criteria[key] === null || criteria[key] === '') return true;
                return item[key] === criteria[key];
            });
        });
    }

    /**
     * Get query parameter from URL
     */
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Set query parameter in URL
     */
    static setQueryParam(param, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(param, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }

    /**
     * Check if object is empty
     */
    static isEmpty(obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
    }

    /**
     * Merge multiple objects
     */
    static mergeObjects(...objs) {
        return objs.reduce((acc, obj) => ({...acc, ...obj}), {});
    }

    /**
     * Export data as CSV
     */
    static exportAsCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Copy text to clipboard
     */
    static copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    }
}

// Make helpers globally available
const helpers = new DashboardHelpers();
