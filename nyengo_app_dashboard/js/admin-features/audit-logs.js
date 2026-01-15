/**
 * Audit Logs Admin Feature Module
 * Handles audit log viewing and filtering
 */
class AuditLogsFeature {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        this.setupEventListeners();
        this.loadLogs();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('auditSearch');
        const actionFilter = document.getElementById('auditActionFilter');
        const userFilter = document.getElementById('auditUserFilter');
        const dateFilter = document.getElementById('auditDateFilter');

        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterLogs(), 300));
        if (actionFilter) actionFilter.addEventListener('change', () => this.filterLogs());
        if (userFilter) userFilter.addEventListener('change', () => this.filterLogs());
        if (dateFilter) dateFilter.addEventListener('change', () => this.filterLogs());
    }

    async loadLogs() {
        try {
            this.logs = await apiService.get('/api/admin/audit-logs');
            this.filterLogs();
        } catch (error) {
            console.error('Error loading audit logs:', error);
            helpers.showError('Failed to load audit logs');
        }
    }

    filterLogs() {
        const search = document.getElementById('auditSearch')?.value.toLowerCase() || '';
        const action = document.getElementById('auditActionFilter')?.value || '';
        const user = document.getElementById('auditUserFilter')?.value || '';
        const dateRange = document.getElementById('auditDateFilter')?.value || '';

        this.filteredLogs = this.logs.filter(log => {
            const matchesSearch = !search ||
                log.action.toLowerCase().includes(search) ||
                log.details.toLowerCase().includes(search);

            const matchesAction = !action || log.action === action;
            const matchesUser = !user || log.userId === user;
            const matchesDate = !dateRange || this.isInDateRange(log.timestamp, dateRange);

            return matchesSearch && matchesAction && matchesUser && matchesDate;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    isInDateRange(timestamp, range) {
        const logDate = new Date(timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        logDate.setHours(0, 0, 0, 0);

        switch (range) {
            case 'today':
                return logDate.getTime() === today.getTime();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return logDate >= weekAgo;
            case 'month':
                return logDate.getMonth() === today.getMonth() &&
                       logDate.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    }

    renderTable() {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredLogs.slice(start, end);

        tbody.innerHTML = pageData.map(log => `
            <tr>
                <td>${helpers.formatDate(log.timestamp)}</td>
                <td>${helpers.formatTime(log.timestamp)}</td>
                <td>${log.user}</td>
                <td><span class="badge action-${log.action.toLowerCase()}">${log.action}</span></td>
                <td>${helpers.truncateText(log.details, 40)}</td>
                <td>
                    <button class="action-btn" onclick="auditLogsFeature.viewDetails('${log.id}')">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No logs found</td></tr>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        const pagination = document.getElementById('auditLogsPagination');
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button 
                    ${i === this.currentPage ? 'class="active"' : ''} 
                    onclick="auditLogsFeature.goToPage(${i})"
                >
                    ${i}
                </button>
            `;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    viewDetails(logId) {
        const log = this.logs.find(l => l.id === logId);
        if (log) {
            console.log('Viewing audit log:', log);
            helpers.showModal('detailModal');
        }
    }

    exportLogs() {
        const data = this.filteredLogs.map(log => ({
            'Date': helpers.formatDate(log.timestamp),
            'Time': helpers.formatTime(log.timestamp),
            'User': log.user,
            'Action': log.action,
            'Details': log.details,
            'IP Address': log.ipAddress || 'N/A'
        }));

        helpers.exportAsCSV(data, 'audit-logs.csv');
        helpers.showSuccess('Audit logs exported');
    }
}

const auditLogsFeature = new AuditLogsFeature();
