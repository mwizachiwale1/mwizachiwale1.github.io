/**
 * Banners Admin Feature Module
 */
class BannersFeature {
    constructor() {
        this.banners = [];
    }

    init() {
        this.setupEventListeners();
        this.loadBanners();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addBannerBtn');
        if (addBtn) addBtn.addEventListener('click', () => helpers.showModal('bannerModal'));
    }

    async loadBanners() {
        try {
            this.banners = await apiService.get('/api/admin/banners');
            this.renderTable();
        } catch (error) {
            console.error('Error loading banners:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('bannersTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.banners.map(banner => `
            <tr>
                <td>${banner.title}</td>
                <td>${helpers.formatDate(banner.startDate)}</td>
                <td>${helpers.formatDate(banner.endDate)}</td>
                <td><span class="badge ${banner.active ? 'success' : 'danger'}">${banner.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="action-btn" onclick="bannersFeature.editBanner(${banner.id})">Edit</button>
                    <button class="action-btn danger" onclick="bannersFeature.deleteBanner(${banner.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    editBanner(id) {
        helpers.showModal('bannerModal');
    }

    async deleteBanner(id) {
        if (!confirm('Delete this banner?')) return;
        try {
            await apiService.delete(`/api/admin/banners/${id}`);
            helpers.showSuccess('Banner deleted');
            this.loadBanners();
        } catch (error) {
            helpers.showError('Failed to delete banner');
        }
    }
}

const bannersFeature = new BannersFeature();
