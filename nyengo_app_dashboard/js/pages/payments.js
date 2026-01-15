/**
 * Payments Page Module
 * Handles payment tracking and reconciliation
 */
class PaymentsPage {
    constructor() {
        this.payments = [];
        this.filteredPayments = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('paymentSearch');
        const statusFilter = document.getElementById('paymentStatusFilterSelect');
        const methodFilter = document.getElementById('paymentMethodFilter');

        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterPayments(), 300));
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterPayments());
        if (methodFilter) methodFilter.addEventListener('change', () => this.filterPayments());
    }

    async loadData() {
        try {
            this.payments = await apiService.get('/api/admin/payments');
            this.updateMetrics();
            this.filterPayments();
        } catch (error) {
            console.error('Error loading payments:', error);
            helpers.showError('Failed to load payments');
        }
    }

    updateMetrics() {
        const total = this.payments.length;
        const successful = this.payments.filter(p => p.status === 'paid');
        const successfulToday = successful.filter(p => 
            new Date(p.date).toDateString() === new Date().toDateString()
        );
        const successfulAmount = successfulToday.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pending = this.payments.filter(p => p.status === 'pending');
        const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
        const failed = this.payments.filter(p => p.status === 'failed');

        document.getElementById('totalPaymentsCount').textContent = total;
        document.getElementById('successfulPaymentsCount').textContent = successfulToday.length;
        document.getElementById('successfulPaymentsAmount').textContent = helpers.formatCurrency(successfulAmount);
        document.getElementById('pendingPaymentsCount').textContent = pending.length;
        document.getElementById('pendingPaymentsAmount').textContent = helpers.formatCurrency(pendingAmount);
        document.getElementById('failedPaymentsCount').textContent = failed.length;
    }

    filterPayments() {
        const search = document.getElementById('paymentSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('paymentStatusFilterSelect')?.value || '';
        const method = document.getElementById('paymentMethodFilter')?.value || '';

        this.filteredPayments = this.payments.filter(payment => {
            const matchesSearch = !search ||
                payment.transactionId.toLowerCase().includes(search) ||
                payment.orderId.toLowerCase().includes(search) ||
                payment.user.toLowerCase().includes(search);

            const matchesStatus = !status || payment.status === status;
            const matchesMethod = !method || payment.method === method;

            return matchesSearch && matchesStatus && matchesMethod;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    renderTable() {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredPayments.slice(start, end);

        tbody.innerHTML = pageData.map(payment => `
            <tr>
                <td>${payment.transactionId}</td>
                <td>${payment.orderId}</td>
                <td>${helpers.formatDate(payment.date)}</td>
                <td>${payment.user}</td>
                <td>${helpers.formatCurrency(payment.amount)}</td>
                <td>${payment.method}</td>
                <td><span class="badge status-${payment.status.toLowerCase()}">${payment.status}</span></td>
                <td>
                    <button class="action-btn" onclick="paymentsPage.viewDetails('${payment.transactionId}')">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No payments found</td></tr>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
        const pagination = document.getElementById('paymentPagination');
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
                    onclick="paymentsPage.goToPage(${i})"
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    viewDetails(transactionId) {
        const payment = this.payments.find(p => p.transactionId === transactionId);
        if (payment) {
            console.log('Viewing payment:', payment);
            helpers.showModal('detailModal');
        }
    }

    exportData() {
        const data = this.filteredPayments.map(p => ({
            'Transaction ID': p.transactionId,
            'Order ID': p.orderId,
            'Date': helpers.formatDate(p.date),
            'User': p.user,
            'Amount': `MWK ${p.amount}`,
            'Method': p.method,
            'Status': p.status
        }));

        helpers.exportAsCSV(data, 'payments.csv');
        helpers.showSuccess('Payments exported as CSV');
    }
}

const paymentsPage = new PaymentsPage();
