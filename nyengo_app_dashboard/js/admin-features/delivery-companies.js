/**
 * Delivery Companies Admin Feature Module
 */
class DeliveryCompaniesFeature {
    constructor() {
        this.companies = [];
    }

    init() {
        this.loadCompanies();
    }

    async loadCompanies() {
        try {
            this.companies = await apiService.get('/api/admin/delivery-companies');
            this.renderTable();
        } catch (error) {
            console.error('Error loading delivery companies:', error);
            helpers.showError('Failed to load delivery companies');
        }
    }

    renderTable() {
        const tbody = document.getElementById('deliveryCompaniesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.companies.map(company => `
            <tr>
                <td>${company.name}</td>
                <td>${company.contact}</td>
                <td>${company.email}</td>
                <td>${company.activeDeliveries}</td>
                <td><span class="badge status-${company.status.toLowerCase()}">${company.status}</span></td>
                <td>
                    <button class="action-btn" onclick="deliveryCompaniesFeature.viewDetails(${company.id})">View</button>
                </td>
            </tr>
        `).join('');
    }

    viewDetails(id) {
        const company = this.companies.find(c => c.id === id);
        if (company) helpers.showModal('detailModal');
    }
}

const deliveryCompaniesFeature = new DeliveryCompaniesFeature();
