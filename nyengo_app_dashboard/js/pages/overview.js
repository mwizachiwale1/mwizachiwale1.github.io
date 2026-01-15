/**
 * Overview Page Module
 * Handles dashboard overview metrics, charts, and recent orders
 */
class OverviewPage {
    constructor() {
        this.chartInstance = null;
        this.refreshInterval = null;
        this.growthData = null;
    }

    /**
     * Initialize overview page
     */
    init() {
        this.setupEventListeners();
        this.loadMetrics();
        this.initChart();
        this.setupAutoRefresh();
    }

    /**
     * Setup event listeners for overview controls
     */
    setupEventListeners() {
        const chartPeriod = document.getElementById('chartPeriod');
        const chartType = document.getElementById('chartType');

        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => this.updateChart());
        }

        if (chartType) {
            chartType.addEventListener('change', () => this.updateChart());
        }
    }

    /**
     * Load and display dashboard metrics
     */
    async loadMetrics() {
        try {
            // Fetch metrics from API
            const metrics = await Promise.all([
                apiService.get('/api/admin/stats/buyers'),
                apiService.get('/api/admin/stats/retailers'),
                apiService.get('/api/admin/stats/orders'),
                apiService.get('/api/admin/stats/revenue')
            ]);

            this.updateMetricsDisplay(metrics);
            this.loadRecentOrders();
        } catch (error) {
            console.error('Error loading metrics:', error);
            helpers.showError('Failed to load metrics');
        }
    }

    /**
     * Update metrics display
     */
    updateMetricsDisplay(metrics) {
        const [buyers, retailers, orders, revenue] = metrics;

        // Update buyer metrics
        document.getElementById('totalBuyers').textContent = buyers.total || 0;
        document.getElementById('activeRetailers').textContent = retailers.total || 0;
        document.getElementById('todayTransactions').textContent = orders.today || 0;
        document.getElementById('deliveryRate').textContent = `${orders.deliveryRate || 0}%`;

        // Update growth indicators
        this.updateGrowthIndicator('totalBuyers', buyers.growth);
        this.updateGrowthIndicator('activeRetailers', retailers.growth);
    }

    /**
     * Update growth indicator styling
     */
    updateGrowthIndicator(elementId, percentChange) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const parent = element.closest('.metric-card');
        if (!parent) return;

        const indicator = parent.querySelector('.metric-change');
        if (!indicator) return;

        const isPositive = percentChange >= 0;
        indicator.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
        indicator.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            <span>${isPositive ? '+' : ''}${percentChange.toFixed(1)}%</span>
        `;
    }

    /**
     * Load and display recent orders
     */
    async loadRecentOrders() {
        try {
            const orders = await apiService.get('/api/admin/orders/recent', { limit: 5 });
            this.renderOrdersTable(orders);
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    /**
     * Render recent orders table
     */
    renderOrdersTable(orders) {
        const tbody = document.getElementById('recentOrdersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${helpers.formatDate(order.date)}</td>
                <td>${order.buyer}</td>
                <td>${order.amount ? helpers.formatCurrency(order.amount) : 'N/A'}</td>
                <td><span class="badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td><span class="badge delivery-${order.delivery.toLowerCase()}">${order.delivery}</span></td>
                <td>
                    <button class="action-btn" onclick="overviewPage.viewOrderDetails('${order.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Initialize chart
     */
    initChart() {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;

        this.updateChart();
    }

    /**
     * Update chart data and redraw
     */
    async updateChart() {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;

        const period = document.getElementById('chartPeriod')?.value || 'month';
        const type = document.getElementById('chartType')?.value || 'users';

        try {
            const data = await apiService.get('/api/admin/stats/growth', { period, type });
            this.drawChart(data, canvas);
        } catch (error) {
            console.error('Error updating chart:', error);
            this.drawChartWithFallbackData(canvas);
        }
    }

    /**
     * Draw chart with data
     */
    drawChart(data, canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            this.drawChartWithFallbackData(canvas);
            return;
        }

        const values = data.map(d => d.value || 0);
        const labels = data.map(d => d.label || '');

        // Draw simplified line chart
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;

        // Draw axes
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw data line
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();

        values.forEach((value, index) => {
            const x = padding + (index / (values.length - 1)) * graphWidth;
            const y = height - padding - ((value - minValue) / range) * graphHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#FF0000';
        values.forEach((value, index) => {
            const x = padding + (index / (values.length - 1)) * graphWidth;
            const y = height - padding - ((value - minValue) / range) * graphHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Draw chart with fallback data
     */
    drawChartWithFallbackData(canvas) {
        // Generate sample data for the last 30 days
        const data = Array.from({ length: 30 }, (_, i) => ({
            value: Math.floor(Math.random() * 100),
            label: helpers.formatDate(new Date(Date.now() - (30 - i) * 86400000), 'MM/DD')
        }));

        this.drawChart(data, canvas);
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        // Refresh metrics every 30 seconds when on overview page
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            const overviewPage = document.getElementById('overviewPage');
            if (overviewPage && overviewPage.classList.contains('active')) {
                this.loadMetrics();
            }
        }, 30000);
    }

    /**
     * View order details
     */
    viewOrderDetails(orderId) {
        console.log('Viewing order:', orderId);
        // Implement modal view for order details
    }

    /**
     * Cleanup on page unload
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize overview page
const overviewPage = new OverviewPage();
