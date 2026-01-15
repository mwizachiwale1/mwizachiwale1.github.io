/**
 * Compliance Admin Feature Module
 */
class ComplianceFeature {
    constructor() {
        this.complianceData = [];
    }

    init() {
        this.setupEventListeners();
        this.loadComplianceData();
    }

    setupEventListeners() {
        const checkBtn = document.getElementById('runComplianceCheckBtn');
        if (checkBtn) checkBtn.addEventListener('click', () => this.runComplianceCheck());
    }

    async loadComplianceData() {
        try {
            this.complianceData = await apiService.get('/api/admin/compliance');
            this.renderComplianceStatus();
        } catch (error) {
            console.error('Error loading compliance data:', error);
        }
    }

    renderComplianceStatus() {
        const container = document.getElementById('complianceStatus');
        if (!container) return;

        container.innerHTML = this.complianceData.map(check => `
            <div class="compliance-check">
                <h4>${check.name}</h4>
                <p>${check.description}</p>
                <span class="badge status-${check.status.toLowerCase()}">${check.status}</span>
                <p>${helpers.formatDate(check.lastCheck)}</p>
            </div>
        `).join('');
    }

    async runComplianceCheck() {
        try {
            const result = await apiService.post('/api/admin/compliance/check');
            helpers.showSuccess('Compliance check completed');
            this.loadComplianceData();
        } catch (error) {
            helpers.showError('Compliance check failed');
        }
    }
}

const complianceFeature = new ComplianceFeature();
