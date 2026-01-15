/**
 * Reviews Admin Feature Module
 */
class ReviewsFeature {
    constructor() {
        this.reviews = [];
    }

    init() {
        this.loadReviews();
    }

    async loadReviews() {
        try {
            this.reviews = await apiService.get('/api/admin/reviews');
            this.renderTable();
        } catch (error) {
            console.error('Error loading reviews:', error);
            helpers.showError('Failed to load reviews');
        }
    }

    renderTable() {
        const tbody = document.getElementById('reviewsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.reviews.map(review => `
            <tr>
                <td>${review.product}</td>
                <td>${review.reviewer}</td>
                <td>${'⭐'.repeat(review.rating)}</td>
                <td>${helpers.truncateText(review.comment, 50)}</td>
                <td><span class="badge status-${review.status.toLowerCase()}">${review.status}</span></td>
                <td>
                    <button class="action-btn" onclick="reviewsFeature.viewDetails(${review.id})">View</button>
                </td>
            </tr>
        `).join('');
    }

    viewDetails(id) {
        const review = this.reviews.find(r => r.id === id);
        if (review) helpers.showModal('detailModal');
    }
}

const reviewsFeature = new ReviewsFeature();
