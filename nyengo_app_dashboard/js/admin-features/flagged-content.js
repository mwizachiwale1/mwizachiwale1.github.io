/**
 * Flagged Content Admin Feature Module
 */
class FlaggedContentFeature {
    constructor() {
        this.flaggedItems = [];
    }

    init() {
        this.setupEventListeners();
        this.loadFlaggedContent();
    }

    setupEventListeners() {
        const statusFilter = document.getElementById('flaggedStatusFilter');
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterContent());
    }

    async loadFlaggedContent() {
        try {
            this.flaggedItems = await apiService.get('/api/admin/flagged-content');
            this.renderTable();
        } catch (error) {
            console.error('Error loading flagged content:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('flaggedContentTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.flaggedItems.map(item => `
            <tr>
                <td>${item.contentType}</td>
                <td>${helpers.truncateText(item.description, 40)}</td>
                <td>${item.reportedBy}</td>
                <td>${item.reportCount}</td>
                <td><span class="badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                    <button class="action-btn" onclick="flaggedContentFeature.review(${item.id})">Review</button>
                </td>
            </tr>
        `).join('');
    }

    filterContent() {
        // Implement filtering
    }

    async review(id) {
        helpers.showModal('detailModal');
    }
}

const flaggedContentFeature = new FlaggedContentFeature();
