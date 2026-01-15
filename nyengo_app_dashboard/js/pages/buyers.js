/**
 * Buyers Page Module
 * Handles buyer analytics, filtering, and management
 */
class BuyersPage {
    constructor() {
        this.buyers = [];
        this.filteredBuyers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    /**
     * Initialize buyers page
     */
    init() {
        this.setupEventListeners();
        this.loadData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const searchInput = document.getElementById('buyerSearch');
        const activityFilter = document.getElementById('buyerActivityFilter');
        const statusFilter = document.getElementById('buyerStatusFilter');
        const kycFilter = document.getElementById('buyerKycFilter');

        if (searchInput) {
            searchInput.addEventListener('input', helpers.debounce(() => this.filterBuyers(), 300));
        }

        if (activityFilter) {
            activityFilter.addEventListener('change', () => this.filterBuyers());
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterBuyers());
        }

        if (kycFilter) {
            kycFilter.addEventListener('change', () => this.filterBuyers());
        }
    }

    /**
     * Load buyers data
     */
    async loadData() {
        try {
            this.buyers = await apiService.get('/api/admin/buyers');
            this.updateMetrics();
            this.filterBuyers();
        } catch (error) {
            console.error('Error loading buyers:', error);
            helpers.showError('Failed to load buyers');
        }
    }

    /**
     * Update buyer metrics
     */
    updateMetrics() {
        const active = this.buyers.filter(b => b.activity === 'active').length;
        const dormant = this.buyers.filter(b => b.activity === 'dormant').length;
        const inactive = this.buyers.filter(b => b.activity === 'inactive').length;
        const newBuyers = this.buyers.filter(b => this.isNewThisMonth(b.createdDate)).length;

        document.getElementById('activeBuyersCount').textContent = active;
        document.getElementById('dormantBuyersCount').textContent = dormant;
        document.getElementById('inactiveBuyersCount').textContent = inactive;
        document.getElementById('newBuyersCount').textContent = newBuyers;
    }

    /**
     * Check if buyer is new this month
     */
    isNewThisMonth(date) {
        const now = new Date();
        const createdDate = new Date(date);
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
    }

    /**
     * Filter buyers based on current filters
     */
    filterBuyers() {
        const search = document.getElementById('buyerSearch')?.value.toLowerCase() || '';
        const activity = document.getElementById('buyerActivityFilter')?.value || '';
        const status = document.getElementById('buyerStatusFilter')?.value || '';
        const kyc = document.getElementById('buyerKycFilter')?.value || '';

        this.filteredBuyers = this.buyers.filter(buyer => {
            const matchesSearch = !search ||
                buyer.name.toLowerCase().includes(search) ||
                buyer.email.toLowerCase().includes(search) ||
                buyer.phone.includes(search);

            const matchesActivity = !activity || buyer.activity === activity;
            const matchesStatus = !status || buyer.status === status;
            const matchesKyc = !kyc || buyer.kycStatus === kyc;

            return matchesSearch && matchesActivity && matchesStatus && matchesKyc;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    /**
     * Render buyers table
     */
    renderTable() {
        const tbody = document.getElementById('buyersTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredBuyers.slice(start, end);

        tbody.innerHTML = pageData.map(buyer => `
            <tr>
                <td>${buyer.name}</td>
                <td>${helpers.truncateText(buyer.email, 25)}</td>
                <td>${buyer.phone}</td>
                <td>${buyer.city}</td>
                <td>${buyer.totalOrders}</td>
                <td>${helpers.formatCurrency(buyer.totalSpent)}</td>
                <td><span class="badge status-${buyer.status.toLowerCase()}">${buyer.status}</span></td>
                <td>
                    <button class="action-btn" onclick="buyersPage.viewDetails(${buyer.id})">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No buyers found</td></tr>';
        }
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredBuyers.length / this.itemsPerPage);
        const pagination = document.getElementById('buyerPagination');
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
                    onclick="buyersPage.goToPage(${i})"
                >
                    ${i}
                </button>
            `;
        }

        pagination.innerHTML = html;
    }

    /**
     * Go to page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * View buyer details
     */
    viewDetails(id) {
        const buyer = this.buyers.find(b => b.id === id);
        if (!buyer) return;

        console.log('Viewing buyer:', buyer);
        helpers.showModal('detailModal');
    }

    /**
     * Export buyers data
     */
    exportData() {
        const data = this.filteredBuyers.map(b => ({
            'Name': b.name,
            'Email': b.email,
            'Phone': b.phone,
            'City': b.city,
            'Orders': b.totalOrders,
            'Total Spent': `MWK ${b.totalSpent}`,
            'Status': b.status,
            'Activity': b.activity
        }));

        helpers.exportAsCSV(data, 'buyers.csv');
        helpers.showSuccess('Buyers exported as CSV');
    }
}

// Initialize buyers page
const buyersPage = new BuyersPage();
