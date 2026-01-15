/**
 * Analytics Admin Feature Module
 * Handles analytics dashboard and reporting
 */
class AnalyticsFeature {
    constructor() {
        this.analyticsData = null;
        this.chartInstance = null;
    }

    init() {
        this.setupEventListeners();
        this.loadAnalytics();
    }

    setupEventListeners() {
        const periodSelect = document.getElementById('analyticsPeriod');
        const metricsSelect = document.getElementById('analyticsMetric');

        if (periodSelect) periodSelect.addEventListener('change', () => this.updateAnalytics());
        if (metricsSelect) metricsSelect.addEventListener('change', () => this.updateAnalytics());
    }

    async loadAnalytics() {
        try {
            const period = document.getElementById('analyticsPeriod')?.value || 'month';
            const metric = document.getElementById('analyticsMetric')?.value || 'orders';

            this.analyticsData = await apiService.get('/api/admin/analytics', { period, metric });
            this.displayAnalytics();
        } catch (error) {
            console.error('Error loading analytics:', error);
            helpers.showError('Failed to load analytics');
        }
    }

    async updateAnalytics() {
        await this.loadAnalytics();
    }

    displayAnalytics() {
        if (!this.analyticsData) return;

        // Display metrics
        this.displayMetrics();

        // Display chart
        this.displayChart();

        // Display trends
        this.displayTrends();
    }

    displayMetrics() {
        const metricsContainer = document.getElementById('analyticsMetrics');
        if (!metricsContainer) return;

        metricsContainer.innerHTML = `
            <div class="metrics-grid">
                ${this.analyticsData.metrics.map(metric => `
                    <div class="metric-card">
                        <h3>${metric.label}</h3>
                        <div class="metric-value">${metric.value}</div>
                        <div class="metric-change ${metric.change >= 0 ? 'positive' : 'negative'}">
                            <i class="fas fa-arrow-${metric.change >= 0 ? 'up' : 'down'}"></i>
                            ${metric.change}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayChart() {
        const chartCanvas = document.getElementById('analyticsChart');
        if (!chartCanvas) return;

        const ctx = chartCanvas.getContext('2d');
        const width = chartCanvas.width;
        const height = chartCanvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (!this.analyticsData.chartData || this.analyticsData.chartData.length === 0) {
            return;
        }

        const data = this.analyticsData.chartData;
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // Draw axes
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = '#2952CC';
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

        // Draw points
        ctx.fillStyle = '#2952CC';
        values.forEach((value, index) => {
            const x = padding + (index / (values.length - 1)) * graphWidth;
            const y = height - padding - ((value - minValue) / range) * graphHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    displayTrends() {
        const trendsContainer = document.getElementById('analyticsTrends');
        if (!trendsContainer) return;

        if (!this.analyticsData.trends || this.analyticsData.trends.length === 0) {
            return;
        }

        trendsContainer.innerHTML = `
            <h3>Trends</h3>
            <table class="data-table">
                <tbody>
                    ${this.analyticsData.trends.map(trend => `
                        <tr>
                            <td>${trend.name}</td>
                            <td>${trend.value}</td>
                            <td><span class="badge ${trend.change >= 0 ? 'success' : 'danger'}">${trend.change >= 0 ? '+' : ''}${trend.change}%</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

const analyticsFeature = new AnalyticsFeature();
