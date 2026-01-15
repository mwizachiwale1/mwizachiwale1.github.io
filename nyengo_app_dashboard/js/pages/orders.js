/**
 * Orders Page Module
 * Handles order management, filtering, and tracking
 */
class OrdersPage {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('orderSearch');
        const statusFilter = document.getElementById('orderStatusFilter');
        const paymentFilter = document.getElementById('paymentStatusFilter');
        const dateFilter = document.getElementById('dateRangeFilter');

        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterOrders(), 300));
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterOrders());
        if (paymentFilter) paymentFilter.addEventListener('change', () => this.filterOrders());
        if (dateFilter) dateFilter.addEventListener('change', () => this.filterOrders());
    }

    async loadData() {
        try {
            this.orders = await apiService.get('/api/admin/orders');
            this.updateMetrics();
            this.filterOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            helpers.showError('Failed to load orders');
        }
    }

    updateMetrics() {
        const total = this.orders.length;
        const pending = this.orders.filter(o => o.status === 'pending').length;
        const inTransit = this.orders.filter(o => o.delivery === 'in-transit').length;
        const deliveredToday = this.orders.filter(o => 
            o.delivery === 'delivered' && 
            new Date(o.deliveredDate).toDateString() === new Date().toDateString()
        ).length;

        document.getElementById('totalOrdersCount').textContent = total;
        document.getElementById('pendingOrdersCount').textContent = pending;
        document.getElementById('inTransitOrdersCount').textContent = inTransit;
        document.getElementById('deliveredTodayCount').textContent = deliveredToday;
    }

    filterOrders() {
        const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('orderStatusFilter')?.value || '';
        const payment = document.getElementById('paymentStatusFilter')?.value || '';
        const dateRange = document.getElementById('dateRangeFilter')?.value || '';

        this.filteredOrders = this.orders.filter(order => {
            const matchesSearch = !search || 
                order.id.toLowerCase().includes(search) ||
                order.buyer.toLowerCase().includes(search) ||
                order.retailer.toLowerCase().includes(search);

            const matchesStatus = !status || order.status === status;
            const matchesPayment = !payment || order.paymentStatus === payment;
            const matchesDate = !dateRange || this.isInDateRange(order.date, dateRange);

            return matchesSearch && matchesStatus && matchesPayment && matchesDate;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    isInDateRange(date, range) {
        const orderDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        orderDate.setHours(0, 0, 0, 0);

        switch (range) {
            case 'today':
                return orderDate.getTime() === today.getTime();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                return orderDate.getMonth() === today.getMonth() && 
                       orderDate.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    }

    renderTable() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredOrders.slice(start, end);

        tbody.innerHTML = pageData.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${helpers.formatDate(order.date)}</td>
                <td>${order.buyer}</td>
                <td>${order.retailer}</td>
                <td>${helpers.formatCurrency(order.amount)}</td>
                <td><span class="badge payment-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span></td>
                <td><span class="badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td><span class="badge delivery-${order.delivery.toLowerCase()}">${order.delivery}</span></td>
                <td>
                    <button class="action-btn" onclick="ordersPage.viewDetails('${order.id}')">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No orders found</td></tr>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        const pagination = document.getElementById('orderPagination');
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
                    onclick="ordersPage.goToPage(${i})"
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

    viewDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            console.log('Viewing order:', order);
            helpers.showModal('detailModal');
        }
    }

    exportData() {
        const data = this.filteredOrders.map(o => ({
            'Order ID': o.id,
            'Date': helpers.formatDate(o.date),
            'Buyer': o.buyer,
            'Retailer': o.retailer,
            'Amount': `MWK ${o.amount}`,
            'Payment Status': o.paymentStatus,
            'Order Status': o.status,
            'Delivery Status': o.delivery
        }));

        helpers.exportAsCSV(data, 'orders.csv');
        helpers.showSuccess('Orders exported as CSV');
    }
}

const ordersPage = new OrdersPage();
