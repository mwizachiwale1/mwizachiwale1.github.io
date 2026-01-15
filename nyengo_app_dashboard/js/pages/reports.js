/**
 * Reports Page Module
 * Handles report generation and export
 */
class ReportsPage {
    constructor() {
        this.reportData = null;
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const reportPeriod = document.getElementById('reportPeriod');
        const generateBtn = document.getElementById('generateReportBtn');
        const exportBtn = document.getElementById('exportReportBtn');

        if (reportPeriod) {
            reportPeriod.addEventListener('change', (e) => this.handlePeriodChange(e));
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReport());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    handlePeriodChange(event) {
        const customDateGroup = document.getElementById('customDateGroup');
        const customDateGroup2 = document.getElementById('customDateGroup2');

        if (event.target.value === 'custom') {
            if (customDateGroup) customDateGroup.style.display = 'block';
            if (customDateGroup2) customDateGroup2.style.display = 'block';
        } else {
            if (customDateGroup) customDateGroup.style.display = 'none';
            if (customDateGroup2) customDateGroup2.style.display = 'none';
        }
    }

    async generateReport() {
        try {
            const period = document.getElementById('reportPeriod').value;
            const reportType = document.getElementById('reportType').value;

            let startDate, endDate;

            if (period === 'custom') {
                startDate = document.getElementById('customStartDate').value;
                endDate = document.getElementById('customEndDate').value;

                if (!startDate || !endDate) {
                    helpers.showError('Please select both start and end dates');
                    return;
                }
            } else {
                const now = new Date();
                endDate = now.toISOString().split('T')[0];

                switch (period) {
                    case 'today':
                        startDate = endDate;
                        break;
                    case 'week':
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        startDate = weekAgo.toISOString().split('T')[0];
                        break;
                    case 'month':
                        const monthAgo = new Date(now);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        startDate = monthAgo.toISOString().split('T')[0];
                        break;
                    case 'year':
                        const yearAgo = new Date(now);
                        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                        startDate = yearAgo.toISOString().split('T')[0];
                        break;
                }
            }

            const response = await apiService.get('/api/admin/reports/generate', {
                type: reportType,
                startDate,
                endDate
            });

            this.reportData = response;
            this.displayReport(response);
            helpers.showSuccess('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            helpers.showError('Failed to generate report');
        }
    }

    displayReport(reportData) {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) return;

        reportContent.innerHTML = `
            <div class="report">
                <h2>${reportData.title}</h2>
                <p class="report-meta">Generated: ${new Date().toLocaleString()}</p>
                
                <div class="report-summary">
                    ${this.renderReportSummary(reportData)}
                </div>
                
                <div class="report-details">
                    ${this.renderReportDetails(reportData)}
                </div>
            </div>
        `;
    }

    renderReportSummary(reportData) {
        if (!reportData.summary) return '';

        return `
            <h3>Summary</h3>
            <table class="data-table">
                <tbody>
                    ${Object.entries(reportData.summary).map(([key, value]) => `
                        <tr>
                            <td><strong>${this.formatKey(key)}</strong></td>
                            <td>${typeof value === 'number' ? helpers.formatCurrency(value) : value}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderReportDetails(reportData) {
        if (!reportData.details || reportData.details.length === 0) return '';

        const firstItem = reportData.details[0];
        const columns = Object.keys(firstItem);

        return `
            <h3>Details</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${this.formatKey(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${reportData.details.map(item => `
                        <tr>
                            ${columns.map(col => `<td>${item[col]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    exportReport() {
        if (!this.reportData) {
            helpers.showError('Please generate a report first');
            return;
        }

        const data = this.reportData.details || [];
        const filename = `report_${new Date().getTime()}.csv`;
        helpers.exportAsCSV(data, filename);
        helpers.showSuccess('Report exported as CSV');
    }
}

const reportsPage = new ReportsPage();
