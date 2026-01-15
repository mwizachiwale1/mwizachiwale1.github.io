/**
 * Retailers Page Module
 * Handles retailer management, filtering, and pagination
 */
class RetailersPage {
    constructor() {
        this.retailers = [];
        this.filteredRetailers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
    }

    /**
     * Initialize retailers page
     */
    init() {
        this.setupEventListeners();
        this.loadData();
    }

    /**
     * Setup event listeners for filters and actions
     */
    setupEventListeners() {
        const searchInput = document.getElementById('retailerSearch');
        const tierFilter = document.getElementById('tierFilter');
        const cityFilter = document.getElementById('cityFilter');

        if (searchInput) {
            searchInput.addEventListener('input', helpers.debounce(() => this.filterRetailers(), 300));
        }

        if (tierFilter) {
            tierFilter.addEventListener('change', () => this.filterRetailers());
        }

        if (cityFilter) {
            cityFilter.addEventListener('change', () => this.filterRetailers());
        }

        // Sortable columns
        document.querySelectorAll('.data-table .sortable').forEach(th => {
            th.addEventListener('click', (e) => this.handleSort(e));
        });
    }

    /**
     * Load retailers data
     */
    async loadData() {
        try {
            this.retailers = await apiService.get('/api/admin/retailers');
            this.filterRetailers();
        } catch (error) {
            console.error('Error loading retailers:', error);
            helpers.showError('Failed to load retailers');
        }
    }

    /**
     * Filter retailers based on current filters
     */
    filterRetailers() {
        const search = document.getElementById('retailerSearch')?.value.toLowerCase() || '';
        const tier = document.getElementById('tierFilter')?.value || '';
        const city = document.getElementById('cityFilter')?.value || '';

        this.filteredRetailers = this.retailers.filter(retailer => {
            const matchesSearch = !search || 
                retailer.name.toLowerCase().includes(search) || 
                retailer.owner.toLowerCase().includes(search);
            
            const matchesTier = !tier || retailer.tier === tier;
            const matchesCity = !city || retailer.city === city;

            return matchesSearch && matchesTier && matchesCity;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    /**
     * Handle column sorting
     */
    handleSort(event) {
        const column = event.target.getAttribute('data-sort');
        
        if (this.sortBy === column) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = column;
            this.sortOrder = 'asc';
        }

        this.filteredRetailers = helpers.sortBy(
            this.filteredRetailers,
            this.sortBy,
            this.sortOrder === 'asc'
        );

        this.renderTable();
    }

    /**
     * Render retailers table
     */
    renderTable() {
        const tbody = document.getElementById('retailersTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredRetailers.slice(start, end);

        tbody.innerHTML = pageData.map(retailer => `
            <tr>
                <td>${helpers.truncateText(retailer.name, 30)}</td>
                <td>${retailer.owner}</td>
                <td>${retailer.city}</td>
                <td>${helpers.formatCurrency(retailer.sales)}</td>
                <td>${retailer.orders}</td>
                <td>${retailer.products}</td>
                <td><span class="badge tier-${retailer.tier.toLowerCase()}">${retailer.tier}</span></td>
                <td>
                    <button class="action-btn" onclick="retailersPage.viewDetails(${retailer.id})">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No retailers found</td></tr>';
        }
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredRetailers.length / this.itemsPerPage);
        const pagination = document.getElementById('retailerPagination');
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button onclick="retailersPage.goToPage(1)">&laquo;</button>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button 
                    ${i === this.currentPage ? 'class="active"' : ''} 
                    onclick="retailersPage.goToPage(${i})"
                >
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            html += `<button onclick="retailersPage.goToPage(${totalPages})">&raquo;</button>`;
        }

        pagination.innerHTML = html;
    }

    /**
     * Navigate to specific page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * View retailer details
     */
    viewDetails(id) {
        const retailer = this.retailers.find(r => r.id === id);
        if (!retailer) return;

        console.log('Viewing retailer:', retailer);
        // Implement modal to show retailer details
        helpers.showModal('detailModal');
    }

    /**
     * Export retailers data
     */
    exportData() {
        const data = this.filteredRetailers.map(r => ({
            'Name': r.name,
            'Owner': r.owner,
            'City': r.city,
            'Sales (MTD)': `MWK ${r.sales}`,
            'Orders': r.orders,
            'Products': r.products,
            'Tier': r.tier
        }));

        helpers.exportAsCSV(data, 'retailers.csv');
        helpers.showSuccess('Retailers exported as CSV');
    }
}

// Initialize retailers page
const retailersPage = new RetailersPage();
