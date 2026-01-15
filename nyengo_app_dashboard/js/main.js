// Nyengo Admin Dashboard - Main Application
class NyengoDashboard {
    constructor() {
        this.authService = window.authService;
        this.api = window.apiService;
        this.currentUser = null;
        this.dummyData = null;
        
        // Phase 12: Throttle/debounce timers
        this.throttleTimers = new Map();
        this.debounceTimers = new Map();
        
        this.init();
    }

    /**
     * Phase 12: Throttle function execution
     * Limits function to execute at most once per specified time period
     */
    throttle(func, key, delay = 1000) {
        if (this.throttleTimers.has(key)) {
            return; // Skip if already throttled
        }
        
        func();
        
        this.throttleTimers.set(key, true);
        setTimeout(() => {
            this.throttleTimers.delete(key);
        }, delay);
    }

    /**
     * Phase 12: Debounce function execution
     * Delays function execution until after specified time has elapsed since last call
     */
    debounce(func, key, delay = 500) {
        // Clear existing timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        // Set new timer
        const timerId = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timerId);
    }

    async init() {
        try {
            // Check network connectivity
            if (!navigator.onLine) {
                this.showError('No internet connection. Please check your network and try again.', 10000);
                this.showOfflineState();
                return;
            }

            // Check authentication first
            const isAuthenticated = await this.checkAuthentication();
            if (!isAuthenticated) {
                this.redirectToLogin();
                return;
            }

            // Load dummy data as fallback (will be replaced with API calls in later phases)
            const dataLoader = new DataLoader();
            this.dummyData = await dataLoader.loadDummyData();
            
            // Setup event listeners
            this.setupEventListeners();
            this.setupModalEvents();
            this.setupNetworkMonitoring();
            
            // Show dashboard and load data
            this.showDashboard();
            this.updateUserInfo();
            this.loadDashboard();
            
            // Setup inactivity logout (30 minutes)
            this.authService.setupInactivityLogout(30);
            
            console.log('Nyengo Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.handleCriticalError(error);
        }
    }

    async checkAuthentication() {
        // Check if token exists
        if (!this.authService.isAuthenticated()) {
            return false;
        }

        // Verify token with backend
        const result = await this.authService.verifyToken();
        
        if (result.success) {
            this.currentUser = result.user;
            
            // Verify user has admin privileges
            if (!this.authService.isAdmin()) {
                this.authService.logout();
                alert('Access denied. Admin privileges required.');
                return false;
            }
            
            return true;
        }
        
        return false;
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Filter events
        this.setupFilterEvents();
        
        // Report period change event
        const reportPeriod = document.getElementById('reportPeriod');
        if (reportPeriod) {
            reportPeriod.addEventListener('change', (e) => {
                const customDateGroup = document.getElementById('customDateGroup');
                const customDateGroup2 = document.getElementById('customDateGroup2');
                if (e.target.value === 'custom') {
                    if (customDateGroup) customDateGroup.style.display = 'block';
                    if (customDateGroup2) customDateGroup2.style.display = 'block';
                } else {
                    if (customDateGroup) customDateGroup.style.display = 'none';
                    if (customDateGroup2) customDateGroup2.style.display = 'none';
                }
            });
        }
        
        // Generate report button
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }
        
        // Export report button
        const exportReportBtn = document.getElementById('exportReportBtn');
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => this.exportReport());
        }
        
        // Admin user management buttons
        const addAdminBtn = document.getElementById('addAdminBtn');
        if (addAdminBtn) {
            addAdminBtn.addEventListener('click', () => this.showAddAdminModal());
        }
        
        const adminForm = document.getElementById('adminForm');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAdmin();
            });
        }
    }

    handleLogout() {
        // Confirm logout
        if (confirm('Are you sure you want to logout?')) {
            this.authService.logout();
        }
    }

    showDashboard() {
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Ensure only overview page is active on initial load
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById('overviewPage').classList.add('active');
        
        // Ensure overview nav item is active
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('[data-page="overview"]').classList.add('active');
    }

    updateUserInfo() {
        if (!this.currentUser) return;

        document.getElementById('userName').textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        document.getElementById('userRole').textContent = this.currentUser.role === 'super_admin' ? 'Super Admin' : 'Support Staff';
        // Avatar now uses profile image from CSS background
        // document.getElementById('userAvatar').textContent = this.currentUser.firstName.charAt(0) + this.currentUser.lastName.charAt(0);
        
        // Hide super admin only items for support staff
        if (this.currentUser.role !== 'super_admin') {
            document.querySelectorAll('.super-admin-only').forEach(el => el.style.display = 'none');
        }
    }

    handleNavigation(e) {
        const navItem = e.currentTarget;
        const page = navItem.getAttribute('data-page');
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        navItem.classList.add('active');
        
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Show selected page
        const pageElement = document.getElementById(page + 'Page');
        if (pageElement) {
            pageElement.classList.add('active');
        }
        
        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            retailers: 'Retailer Management',
            buyers: 'Buyer Analytics',
            orders: 'Orders & Delivery',
            fees: 'Service Fee Management',
            reports: 'Reports',
            admins: 'Admin Users'
        };
        document.getElementById('pageTitle').textContent = titles[page];
        
        // Load page specific data
        this.loadPageData(page);
    }

    loadPageData(page) {
        switch(page) {
            case 'retailers':
                this.loadRetailers();
                break;
            case 'buyers':
                this.loadBuyers();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'payments':
                this.loadPayments();
                break;
            case 'fees':
                this.loadFees();
                break;
            case 'admins':
                this.loadAdmins();
                break;
        }
    }

    async loadDashboard() {
        // Load all dashboard metrics
        await Promise.all([
            this.loadDashboardMetrics(),
            this.loadGrowthData()
        ]);
        
        this.drawGrowthChart();
        this.initializeChartControls();
        
        // Set up auto-refresh every 30 seconds
        this.setupAutoRefresh();
    }

    /**
     * Fetch and display dashboard metrics from backend
     */
    async loadDashboardMetrics() {
        try {
            // Show loading state
            this.showMetricsLoading(true);

            // Fetch data from multiple endpoints in parallel
            const [usersResponse, businessesResponse, ordersResponse, revenueResponse] = await Promise.all([
                this.api.get(API_ENDPOINTS.ADMIN_USERS.LIST, { role: 'buyer', limit: 1 }).catch(e => ({ count: 0, error: e })),
                this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.LIST, { limit: 1 }).catch(e => ({ count: 0, error: e })),
                this.api.get(API_ENDPOINTS.ADMIN_ORDERS.STATISTICS).catch(e => ({ todayOrders: 0, todayRevenue: 0, error: e })),
                this.api.get(API_ENDPOINTS.ADMIN_FINANCIAL.REVENUE, { period: 'today' }).catch(e => ({ deliveryRate: 0, error: e }))
            ]);

            // Update metrics
            this.updateDashboardMetrics({
                totalBuyers: usersResponse.total || usersResponse.count || 0,
                buyersGrowth: usersResponse.growth || 0,
                activeRetailers: businessesResponse.total || businessesResponse.count || 0,
                pendingRetailers: businessesResponse.pending || 0,
                todayTransactions: ordersResponse.todayOrders || ordersResponse.totalOrders || 0,
                todayRevenue: ordersResponse.todayRevenue || ordersResponse.revenue || 0,
                deliveryRate: ordersResponse.deliveryRate || revenueResponse.deliveryRate || 0
            });

            // Hide loading state
            this.showMetricsLoading(false);

        } catch (error) {
            console.error('Error loading dashboard metrics:', error);
            this.showMetricsLoading(false);
            this.showError('Failed to load dashboard metrics. Using cached data.');
            
            // Fall back to dummy data or show zeros
            this.updateDashboardMetrics({
                totalBuyers: 0,
                buyersGrowth: 0,
                activeRetailers: 0,
                pendingRetailers: 0,
                todayTransactions: 0,
                todayRevenue: 0,
                deliveryRate: 0
            });
        }
    }

    /**
     * Update dashboard metric displays
     */
    updateDashboardMetrics(metrics) {
        // Total Buyers
        const totalBuyersEl = document.getElementById('totalBuyers');
        if (totalBuyersEl) {
            totalBuyersEl.textContent = metrics.totalBuyers.toLocaleString();
        }

        // Buyers Growth
        const buyersChangeEl = totalBuyersEl?.parentElement.querySelector('.metric-change');
        if (buyersChangeEl && metrics.buyersGrowth !== undefined) {
            const isPositive = metrics.buyersGrowth >= 0;
            buyersChangeEl.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
            buyersChangeEl.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                <span>${isPositive ? '+' : ''}${metrics.buyersGrowth.toFixed(1)}% from last month</span>
            `;
        }

        // Active Retailers
        const activeRetailersEl = document.getElementById('activeRetailers');
        if (activeRetailersEl) {
            activeRetailersEl.textContent = metrics.activeRetailers.toLocaleString();
        }

        // Pending Retailers
        const retailersChangeEl = activeRetailersEl?.parentElement.querySelector('.metric-change');
        if (retailersChangeEl && metrics.pendingRetailers !== undefined) {
            retailersChangeEl.innerHTML = `
                <i class="fas fa-${metrics.pendingRetailers > 0 ? 'plus-circle' : 'check-circle'}"></i>
                <span>${metrics.pendingRetailers} pending application${metrics.pendingRetailers !== 1 ? 's' : ''}</span>
            `;
        }

        // Today's Transactions
        const todayTransactionsEl = document.getElementById('todayTransactions');
        if (todayTransactionsEl) {
            todayTransactionsEl.textContent = metrics.todayTransactions.toLocaleString();
        }

        // Today's Revenue
        const transactionsChangeEl = todayTransactionsEl?.parentElement.querySelector('.metric-change');
        if (transactionsChangeEl && metrics.todayRevenue !== undefined) {
            transactionsChangeEl.innerHTML = `
                <span>MWK ${metrics.todayRevenue.toLocaleString()}</span>
            `;
        }

        // Delivery Performance
        const deliveryRateEl = document.getElementById('deliveryRate');
        if (deliveryRateEl) {
            deliveryRateEl.textContent = `${metrics.deliveryRate}%`;
        }

        console.log('Dashboard metrics updated:', metrics);
    }

    /**
     * Show/hide loading state for metrics
     */
    showMetricsLoading(isLoading) {
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach(el => {
            if (isLoading) {
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
            } else {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            }
        });
    }

    /**
     * Load growth chart data from backend
     */
    async loadGrowthData() {
        try {
            const period = document.getElementById('chartPeriod')?.value || 'month';
            const type = document.getElementById('chartType')?.value || 'users';
            
            // Fetch revenue data for the selected period
            const response = await this.api.get(API_ENDPOINTS.ADMIN_ORDERS.REVENUE, {
                period: period,
                type: type
            });

            // Store growth data for chart
            this.growthData = response.data || response.revenue || [];
            
        } catch (error) {
            console.error('Error loading growth data:', error);
            // Use sample data as fallback
            this.growthData = null;
        }
    }

    /**
     * Setup auto-refresh for dashboard metrics
     */
    setupAutoRefresh() {
        // Clear any existing refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Refresh metrics every 30 seconds
        this.refreshInterval = setInterval(() => {
            // Only refresh if on overview page
            const overviewPage = document.getElementById('overviewPage');
            if (overviewPage && overviewPage.classList.contains('active')) {
                console.log('Auto-refreshing dashboard metrics...');
                this.loadDashboardMetrics();
            }
        }, 30000); // 30 seconds
    }

    initializeChartControls() {
        // Initialize chart with default values
        updateChart();
        
        // Set up event listeners for chart controls
        const chartPeriod = document.getElementById('chartPeriod');
        const chartType = document.getElementById('chartType');
        
        if (chartPeriod) {
            chartPeriod.addEventListener('change', updateChart);
        }
        
        if (chartType) {
            chartType.addEventListener('change', updateChart);
        }
    }

    drawGrowthChart() {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Use real data if available, otherwise use sample data
        let data;
        if (this.growthData && Array.isArray(this.growthData) && this.growthData.length > 0) {
            // Extract values from API response
            data = this.growthData.map(item => item.value || item.count || item.revenue || 0);
        } else {
            // Sample fallback data for last 30 days
            data = [15, 18, 22, 25, 20, 28, 32, 30, 35, 38, 42, 40, 45, 48, 50, 52, 48, 55, 60, 58, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85];
        }
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const dataMax = Math.max(...data);
        const dataMin = Math.min(...data);
        const range = dataMax - dataMin || 1; // Prevent division by zero
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw axes
        ctx.strokeStyle = '#F4F4F4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw line
        ctx.strokeStyle = '#2952CC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - dataMin) / range) * (height - 2 * padding);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#2952CC';
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - dataMin) / range) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Labels
        ctx.fillStyle = '#666666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Day 1', padding, height - padding + 20);
        ctx.fillText('Day 30', width - padding - 30, height - padding + 20);
        ctx.fillText('New Users', 10, padding);
    }

    /**
     * Load retailers from backend with pagination and filters
     */
    async loadRetailers(page = 1, limit = 20) {
        const tbody = document.getElementById('retailersTableBody');
        if (!tbody) {
            console.error('Retailers table body not found');
            return;
        }
        
        try {
            // Show loading state
            this.showTableLoading(tbody, 8, 'Loading retailers...');
            
            // Get filter values
            const search = document.getElementById('retailerSearch')?.value || '';
            const tierFilter = document.getElementById('tierFilter')?.value || '';
            const cityFilter = document.getElementById('cityFilter')?.value || '';
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            
            // Build query parameters
            const params = {
                page,
                limit,
                search,
                ...(tierFilter && { tier: tierFilter }),
                ...(cityFilter && { city: cityFilter }),
                ...(statusFilter && { status: statusFilter })
            };
            
            // Fetch retailers from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.LIST, params);
            
            // Clear loading state
            tbody.innerHTML = '';
            
            // Check if we have data
            const retailers = response.data || response.businesses || [];
            
            if (retailers.length === 0) {
                this.showEmptyState(tbody, 8, 'No retailers found', 'Add Retailer', 'dashboard.showAddRetailerModal()');
                return;
            }
            
            // Store pagination info
            this.retailersPagination = {
                currentPage: response.page || page,
                totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
                total: response.total || 0,
                limit
            };
            
            // Render retailers
            retailers.forEach(retailer => {
                const row = document.createElement('tr');
                
                // Calculate tier based on sales (if not provided by backend)
                const tier = retailer.tier || this.calculateTier(retailer.salesMTD || retailer.totalRevenue || 0);
                const ownerName = retailer.owner || retailer.ownerName || (retailer.user ? `${retailer.user.firstName} ${retailer.user.lastName}` : 'N/A');
                const city = retailer.city || retailer.location || 'N/A';
                const salesMTD = retailer.salesMTD || retailer.totalRevenue || 0;
                const ordersMTD = retailer.ordersMTD || retailer.totalOrders || 0;
                const products = retailer.products || retailer.totalProducts || 0;
                
                row.innerHTML = `
                    <td>${retailer.name || retailer.businessName || 'N/A'}</td>
                    <td>${ownerName}</td>
                    <td>${city}</td>
                    <td>MWK ${salesMTD.toLocaleString()}</td>
                    <td>${ordersMTD}</td>
                    <td>${products}</td>
                    <td><span class="badge ${tier}">${tier.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn view" onclick="dashboard.viewRetailer('${retailer._id || retailer.id}')">
                            <i class="fas fa-eye"></i>
                            <span>View</span>
                        </button>
                        ${this.authService.isSuperAdmin() ? `<button class="action-btn edit" onclick="dashboard.editRetailer('${retailer._id || retailer.id}')"><i class="fas fa-edit"></i><span>Edit</span></button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Update pagination UI
            this.updateRetailerPagination();
            
        } catch (error) {
            console.error('Error loading retailers:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545; padding: 40px;"><i class="fas fa-exclamation-triangle"></i> Failed to load retailers. Please try again.</td></tr>';
            this.showError('Failed to load retailers: ' + error.message);
        }
    }
    
    /**
     * Calculate performance tier based on sales
     */
    calculateTier(sales) {
        if (sales >= 400000) return 'platinum';
        if (sales >= 250000) return 'gold';
        if (sales >= 150000) return 'silver';
        return 'bronze';
    }
    
    /**
     * Show loading state in table
     */
    showTableLoading(tbody, colspan, message = 'Loading...') {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #2952CC;"></i>
                    <div style="margin-top: 10px; color: #666;">${message}</div>
                </td>
            </tr>
        `;
    }

    /**
     * Show skeleton loading for tables (better UX)
     */
    showSkeletonLoading(tbody, colspan, rows = 5) {
        if (!tbody) return;
        const skeletonRows = Array(rows).fill(0).map(() => `
            <tr class="skeleton-row">
                <td colspan="${colspan}">
                    <div class="skeleton-line" style="width: 100%; height: 20px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
                </td>
            </tr>
        `).join('');
        tbody.innerHTML = skeletonRows;
    }

    /**
     * Show empty state for tables
     */
    showEmptyState(tbody, colspan, message = 'No data available', actionText = '', actionCallback = null) {
        if (!tbody) return;
        const actionButton = actionText && actionCallback ? 
            `<button class="btn-primary" style="margin-top: 15px;" onclick="${actionCallback}">
                <i class="fas fa-plus"></i> ${actionText}
            </button>` : '';
        
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 60px 20px; color: #999;">
            <i class="fas fa-inbox" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
            <div style="font-size: 16px; color: #666; margin-bottom: 5px;">${message}</div>
            <div style="font-size: 14px; color: #999;">Try adjusting your filters or search terms</div>
            ${actionButton}
        </td></tr>`;
    }

    /**
     * Update pagination controls
     */
    updateRetailerPagination() {
        const pagination = this.retailersPagination;
        if (!pagination) return;
        
        const paginationContainer = document.getElementById('retailerPagination');
        if (!paginationContainer) return;
        
        let html = `<div class="pagination">`;
        
        // Previous button
        if (pagination.currentPage > 1) {
            html += `<button onclick="dashboard.loadRetailers(${pagination.currentPage - 1})"><i class="fas fa-chevron-left"></i> Previous</button>`;
        }
        
        // Page info
        html += `<span>Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.total} total)</span>`;
        
        // Next button
        if (pagination.currentPage < pagination.totalPages) {
            html += `<button onclick="dashboard.loadRetailers(${pagination.currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        paginationContainer.innerHTML = html;
    }

    /**
     * View retailer details from backend
     */
    async viewRetailer(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch retailer details and revenue from backend
            const [retailer, revenueData] = await Promise.all([
                this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.DETAIL(id)),
                this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.REVENUE(id)).catch(e => ({ revenue: 0, orders: 0 }))
            ]);
            
            const business = retailer.data || retailer.business || retailer;
            const ownerName = business.owner || business.ownerName || (business.user ? `${business.user.firstName} ${business.user.lastName}` : 'N/A');
            const salesMTD = revenueData.revenue || business.totalRevenue || 0;
            const ordersMTD = revenueData.orders || business.totalOrders || 0;
            const avgOrderValue = ordersMTD > 0 ? Math.round(salesMTD / ordersMTD) : 0;
            const tier = business.tier || this.calculateTier(salesMTD);
            
            // Update modal content
            document.getElementById('modalTitle').textContent = business.name || business.businessName;
            document.getElementById('modalBody').innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">Business Name:</div>
                    <div>${business.name || business.businessName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Owner:</div>
                    <div>${ownerName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div>${business.email || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div>${business.phone || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">City/District:</div>
                    <div>${business.city || business.location || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div>${business.address || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Sales (MTD):</div>
                    <div>MWK ${salesMTD.toLocaleString()}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Orders (MTD):</div>
                    <div>${ordersMTD}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Average Order Value:</div>
                    <div>MWK ${avgOrderValue.toLocaleString()}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Products Listed:</div>
                    <div>${business.totalProducts || business.products || 0}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Performance Tier:</div>
                    <div><span class="badge ${tier}">${tier.toUpperCase()}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div><span class="badge ${business.status === 'active' ? 'active' : business.status === 'pending' ? 'pending' : 'inactive'}">${(business.status || 'pending').toUpperCase()}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Verified:</div>
                    <div><span class="badge ${business.verified ? 'active' : 'pending'}">${business.verified ? 'YES' : 'NO'}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Joined Date:</div>
                    <div>${business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading retailer details:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load retailer details.</div>';
            this.showError('Failed to load retailer details: ' + error.message);
        }
    }

    /**
     * Edit retailer with backend integration
     */
    async editRetailer(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch retailer details from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.DETAIL(id));
            const retailer = response.data || response.business || response;
            
            // Update modal with edit form
            document.getElementById('modalTitle').textContent = `Edit Retailer: ${retailer.name || retailer.businessName}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>Business Name</label>
                    <input type="text" id="editRetailerName" value="${retailer.name || retailer.businessName || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editRetailerEmail" value="${retailer.email || ''}">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="editRetailerPhone" value="${retailer.phone || ''}">
                </div>
                <div class="form-group">
                    <label>City</label>
                    <select id="editRetailerCity">
                        <option value="Lilongwe" ${(retailer.city || retailer.location) === 'Lilongwe' ? 'selected' : ''}>Lilongwe</option>
                        <option value="Blantyre" ${(retailer.city || retailer.location) === 'Blantyre' ? 'selected' : ''}>Blantyre</option>
                        <option value="Mzuzu" ${(retailer.city || retailer.location) === 'Mzuzu' ? 'selected' : ''}>Mzuzu</option>
                        <option value="Zomba" ${(retailer.city || retailer.location) === 'Zomba' ? 'selected' : ''}>Zomba</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" id="editRetailerAddress" value="${retailer.address || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editRetailerStatus">
                        <option value="active" ${retailer.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="pending" ${retailer.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="suspended" ${retailer.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        <option value="inactive" ${retailer.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editRetailerVerified" ${retailer.verified ? 'checked' : ''}>
                        Business Verified
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.saveRetailerEdit('${retailer._id || retailer.id}')">Save Changes</button>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading retailer for edit:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load retailer details.</div>';
            this.showError('Failed to load retailer: ' + error.message);
        }
    }

    /**
     * Save retailer edits to backend
     */
    async saveRetailerEdit(id) {
        const retailerName = document.getElementById('editRetailerName').value;
        const email = document.getElementById('editRetailerEmail').value;
        const phone = document.getElementById('editRetailerPhone').value;
        const city = document.getElementById('editRetailerCity').value;
        const address = document.getElementById('editRetailerAddress').value;
        const status = document.getElementById('editRetailerStatus').value;
        const verified = document.getElementById('editRetailerVerified').checked;

        if (!retailerName.trim() || !email.trim() || !phone.trim()) {
            this.showError('Please fill in all required fields');
            return;
        }

        try {
            // Show loading
            const saveBtn = event.target;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            
            // Prepare update data
            const updateData = {
                name: retailerName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                city: city,
                address: address.trim(),
                verified: verified
            };
            
            // Update retailer via API
            await this.api.put(API_ENDPOINTS.ADMIN_BUSINESSES.UPDATE(id), updateData);
            
            // Update status separately if changed
            if (status) {
                await this.api.put(API_ENDPOINTS.ADMIN_BUSINESSES.UPDATE_STATUS(id), { status });
            }
            
            // Success
            this.showSuccess('Retailer updated successfully!');
            this.closeModal();
            
            // Reload retailers list
            this.loadRetailers();
            
        } catch (error) {
            console.error('Error saving retailer:', error);
            this.showError('Failed to save changes: ' + error.message);
            
            // Re-enable button
            const saveBtn = event.target;
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    }

    // ====================================================================
    // BUYER MANAGEMENT FUNCTIONS
    // ====================================================================

    /**
     * Load buyers from backend with pagination and filters
     */
    async loadBuyers(page = 1, limit = 20) {
        const tbody = document.getElementById('buyersTableBody');
        if (!tbody) {
            console.error('Buyers table body not found');
            return;
        }
        
        try {
            // Show loading state
            this.showTableLoading(tbody, 8, 'Loading buyers...');
            
            // Get filter values
            const search = document.getElementById('buyerSearch')?.value || '';
            const activityFilter = document.getElementById('buyerActivityFilter')?.value || '';
            const statusFilter = document.getElementById('buyerStatusFilter')?.value || '';
            const kycFilter = document.getElementById('buyerKycFilter')?.value || '';
            
            // Build query parameters
            const params = {
                page,
                limit,
                role: 'buyer',
                search,
                ...(activityFilter && { activityStatus: activityFilter }),
                ...(statusFilter && { status: statusFilter }),
                ...(kycFilter && { kycVerified: kycFilter === 'verified' })
            };
            
            // Fetch buyers from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_USERS.LIST, params);
            
            // Clear loading state
            tbody.innerHTML = '';
            
            // Check if we have data
            const buyers = response.data || response.users || [];
            
            if (buyers.length === 0) {
                this.showEmptyState(tbody, 8, 'No buyers found');
                return;
            }
            
            // Store pagination info
            this.buyersPagination = {
                currentPage: response.page || page,
                totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
                total: response.total || 0,
                limit
            };
            
            // Update buyer metrics
            this.updateBuyerMetrics(response);
            
            // Render buyers
            buyers.forEach(buyer => {
                const row = document.createElement('tr');
                
                const fullName = `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'N/A';
                const email = buyer.email || 'N/A';
                const phone = buyer.phone || 'N/A';
                const city = buyer.city || buyer.location || buyer.address?.city || 'N/A';
                const totalOrders = buyer.totalOrders || 0;
                const totalSpent = buyer.totalSpent || buyer.totalPurchases || 0;
                const status = buyer.isActive === false ? 'inactive' : buyer.status || 'active';
                
                row.innerHTML = `
                    <td>${fullName}</td>
                    <td>${email}</td>
                    <td>${phone}</td>
                    <td>${city}</td>
                    <td>${totalOrders}</td>
                    <td>MWK ${totalSpent.toLocaleString()}</td>
                    <td><span class="badge ${status}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn view" onclick="dashboard.viewBuyer('${buyer._id || buyer.id}')">
                            <i class="fas fa-eye"></i>
                            <span>View</span>
                        </button>
                        ${this.authService.isSuperAdmin() ? `<button class="action-btn edit" onclick="dashboard.editBuyer('${buyer._id || buyer.id}')"><i class="fas fa-edit"></i><span>Edit</span></button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Update pagination UI
            this.updateBuyerPagination();
            
        } catch (error) {
            console.error('Error loading buyers:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545; padding: 40px;"><i class="fas fa-exclamation-triangle"></i> Failed to load buyers. Please try again.</td></tr>';
            this.showError('Failed to load buyers: ' + error.message);
        }
    }
    
    /**
     * Update buyer metrics cards
     */
    updateBuyerMetrics(response) {
        const metrics = response.metrics || response.stats || {};
        
        // Active buyers
        const activeEl = document.getElementById('activeBuyersCount');
        if (activeEl && metrics.active !== undefined) {
            activeEl.textContent = metrics.active.toLocaleString();
        }
        
        // Dormant buyers
        const dormantEl = document.getElementById('dormantBuyersCount');
        if (dormantEl && metrics.dormant !== undefined) {
            dormantEl.textContent = metrics.dormant.toLocaleString();
        }
        
        // Inactive buyers
        const inactiveEl = document.getElementById('inactiveBuyersCount');
        if (inactiveEl && metrics.inactive !== undefined) {
            inactiveEl.textContent = metrics.inactive.toLocaleString();
        }
        
        // New this month
        const newEl = document.getElementById('newBuyersCount');
        if (newEl && metrics.newThisMonth !== undefined) {
            newEl.textContent = metrics.newThisMonth.toLocaleString();
        }
        
        // Growth
        const growthEl = document.getElementById('newBuyersGrowth');
        if (growthEl && metrics.growth !== undefined) {
            growthEl.textContent = `${metrics.growth >= 0 ? '+' : ''}${metrics.growth.toFixed(1)}%`;
        }
    }
    
    /**
     * Update buyer pagination controls
     */
    updateBuyerPagination() {
        const pagination = this.buyersPagination;
        if (!pagination) return;
        
        const paginationContainer = document.getElementById('buyerPagination');
        if (!paginationContainer) return;
        
        let html = `<div class="pagination">`;
        
        // Previous button
        if (pagination.currentPage > 1) {
            html += `<button onclick="dashboard.loadBuyers(${pagination.currentPage - 1})"><i class="fas fa-chevron-left"></i> Previous</button>`;
        }
        
        // Page info
        html += `<span>Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.total} total)</span>`;
        
        // Next button
        if (pagination.currentPage < pagination.totalPages) {
            html += `<button onclick="dashboard.loadBuyers(${pagination.currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        paginationContainer.innerHTML = html;
    }
    
    /**
     * View buyer details from backend
     */
    async viewBuyer(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch buyer details and activity from backend
            const [buyer, activityData] = await Promise.all([
                this.api.get(API_ENDPOINTS.ADMIN_USERS.DETAIL(id)),
                this.api.get(API_ENDPOINTS.ADMIN_USERS.ACTIVITY(id)).catch(e => ({ orders: [], activity: [] }))
            ]);
            
            const user = buyer.data || buyer.user || buyer;
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const totalOrders = user.totalOrders || activityData.totalOrders || 0;
            const totalSpent = user.totalSpent || user.totalPurchases || activityData.totalSpent || 0;
            const lastActivity = user.lastActivity || user.lastLogin || 'N/A';
            const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
            
            // Calculate activity status
            let activityStatus = 'inactive';
            if (lastActivity !== 'N/A') {
                const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity)) / (1000 * 60 * 60 * 24));
                if (daysSinceActivity <= 30) activityStatus = 'active';
                else if (daysSinceActivity <= 90) activityStatus = 'dormant';
            }
            
            // Update modal content
            document.getElementById('modalTitle').textContent = fullName || 'Buyer Details';
            document.getElementById('modalBody').innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">Full Name:</div>
                    <div>${fullName || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div>${user.email || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div>${user.phone || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">City/District:</div>
                    <div>${user.city || user.location || user.address?.city || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div>${user.address?.street || user.address || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Orders:</div>
                    <div>${totalOrders}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Spent:</div>
                    <div>MWK ${totalSpent.toLocaleString()}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Average Order Value:</div>
                    <div>MWK ${avgOrderValue.toLocaleString()}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Activity Status:</div>
                    <div><span class="badge ${activityStatus}">${activityStatus.toUpperCase()}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Account Status:</div>
                    <div><span class="badge ${user.isActive === false ? 'inactive' : 'active'}">${user.isActive === false ? 'INACTIVE' : 'ACTIVE'}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">KYC Status:</div>
                    <div><span class="badge ${user.kycVerified ? 'active' : 'pending'}">${user.kycVerified ? 'VERIFIED' : 'PENDING'}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Last Activity:</div>
                    <div>${lastActivity !== 'N/A' ? new Date(lastActivity).toLocaleString() : 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Joined Date:</div>
                    <div>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading buyer details:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load buyer details.</div>';
            this.showError('Failed to load buyer details: ' + error.message);
        }
    }
    
    /**
     * Edit buyer with backend integration
     */
    async editBuyer(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch buyer details from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_USERS.DETAIL(id));
            const buyer = response.data || response.user || response;
            
            // Update modal with edit form
            document.getElementById('modalTitle').textContent = `Edit Buyer: ${buyer.firstName} ${buyer.lastName}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="editBuyerFirstName" value="${buyer.firstName || ''}">
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="editBuyerLastName" value="${buyer.lastName || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editBuyerEmail" value="${buyer.email || ''}">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="editBuyerPhone" value="${buyer.phone || ''}">
                </div>
                <div class="form-group">
                    <label>City</label>
                    <input type="text" id="editBuyerCity" value="${buyer.city || buyer.location || ''}">
                </div>
                <div class="form-group">
                    <label>Account Status</label>
                    <select id="editBuyerStatus">
                        <option value="true" ${buyer.isActive !== false ? 'selected' : ''}>Active</option>
                        <option value="false" ${buyer.isActive === false ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editBuyerKyc" ${buyer.kycVerified ? 'checked' : ''}>
                        KYC Verified
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.saveBuyerEdit('${buyer._id || buyer.id}')">Save Changes</button>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading buyer for edit:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load buyer details.</div>';
            this.showError('Failed to load buyer: ' + error.message);
        }
    }
    
    /**
     * Save buyer edits to backend
     */
    async saveBuyerEdit(id) {
        const firstName = document.getElementById('editBuyerFirstName').value;
        const lastName = document.getElementById('editBuyerLastName').value;
        const email = document.getElementById('editBuyerEmail').value;
        const phone = document.getElementById('editBuyerPhone').value;
        const city = document.getElementById('editBuyerCity').value;
        const isActive = document.getElementById('editBuyerStatus').value === 'true';
        const kycVerified = document.getElementById('editBuyerKyc').checked;

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            this.showError('Please fill in all required fields');
            return;
        }

        try {
            // Show loading
            const saveBtn = event.target;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            
            // Prepare update data
            const updateData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                city: city.trim(),
                isActive: isActive,
                kycVerified: kycVerified
            };
            
            // Update buyer via API
            await this.api.put(API_ENDPOINTS.ADMIN_USERS.UPDATE(id), updateData);
            
            // Update status separately if needed
            await this.api.put(API_ENDPOINTS.ADMIN_USERS.UPDATE_STATUS(id), { 
                isActive: isActive 
            });
            
            // Success
            this.showSuccess('Buyer updated successfully!');
            this.closeModal();
            
            // Reload buyers list
            this.loadBuyers();
            
        } catch (error) {
            console.error('Error saving buyer:', error);
            this.showError('Failed to save changes: ' + error.message);
            
            // Re-enable button
            const saveBtn = event.target;
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    }

    // ====================================================================
    // ORDERS & DELIVERY MANAGEMENT FUNCTIONS
    // ====================================================================

    /**
     * Load orders from backend with pagination and filters
     */
    async loadOrders(page = 1, limit = 20) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) {
            console.error('Orders table body not found');
            return;
        }
        
        try {
            // Show loading state
            this.showTableLoading(tbody, 9, 'Loading orders...');
            
            // Get filter values
            const search = document.getElementById('orderSearch')?.value || '';
            const orderStatus = document.getElementById('orderStatusFilter')?.value || '';
            const paymentStatus = document.getElementById('paymentStatusFilter')?.value || '';
            const dateRange = document.getElementById('dateRangeFilter')?.value || '';
            
            // Build query parameters
            const params = {
                page,
                limit,
                search,
                ...(orderStatus && { status: orderStatus }),
                ...(paymentStatus && { paymentStatus: paymentStatus }),
                ...(dateRange && { dateRange: dateRange })
            };
            
            // Fetch orders from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_ORDERS.LIST, params);
            
            // Clear loading state
            tbody.innerHTML = '';
            
            // Check if we have data
            const orders = response.data || response.orders || [];
            
            if (orders.length === 0) {
                this.showEmptyState(tbody, 9, 'No orders found');
                return;
            }
            
            // Store pagination info
            this.ordersPagination = {
                currentPage: response.page || page,
                totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
                total: response.total || 0,
                limit
            };
            
            // Update order metrics
            this.updateOrderMetrics(response);
            
            // Render orders
            orders.forEach(order => {
                const row = document.createElement('tr');
                
                const orderId = order.orderNumber || order._id?.substring(0, 8) || 'N/A';
                const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                const buyerName = order.buyer?.firstName && order.buyer?.lastName 
                    ? `${order.buyer.firstName} ${order.buyer.lastName}` 
                    : order.buyerName || 'N/A';
                const retailerName = order.business?.name || order.businessName || 'N/A';
                const totalAmount = order.totalAmount || order.total || 0;
                const paymentStatus = order.payment?.status || order.paymentStatus || 'pending';
                const orderStatus = order.status || 'pending';
                const deliveryStatus = order.delivery?.status || order.deliveryStatus || 'pending';
                
                row.innerHTML = `
                    <td><strong>${orderId}</strong></td>
                    <td>${orderDate}</td>
                    <td>${buyerName}</td>
                    <td>${retailerName}</td>
                    <td>MWK ${totalAmount.toLocaleString()}</td>
                    <td><span class="badge ${paymentStatus}">${paymentStatus.toUpperCase()}</span></td>
                    <td><span class="badge ${orderStatus}">${orderStatus.toUpperCase()}</span></td>
                    <td><span class="badge ${deliveryStatus}">${deliveryStatus.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn view" onclick="dashboard.viewOrder('${order._id || order.id}')">
                            <i class="fas fa-eye"></i>
                            <span>View</span>
                        </button>
                        ${this.authService.isSuperAdmin() || this.authService.hasRole('admin') ? `
                        <button class="action-btn edit" onclick="dashboard.updateOrderStatus('${order._id || order.id}')">
                            <i class="fas fa-edit"></i>
                            <span>Update</span>
                        </button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Update pagination UI
            this.updateOrderPagination();
            
        } catch (error) {
            console.error('Error loading orders:', error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #dc3545; padding: 40px;"><i class="fas fa-exclamation-triangle"></i> Failed to load orders. Please try again.</td></tr>';
            this.showError('Failed to load orders: ' + error.message);
        }
    }
    
    /**
     * Update order metrics cards
     */
    updateOrderMetrics(response) {
        const metrics = response.metrics || response.stats || {};
        
        // Total orders
        const totalEl = document.getElementById('totalOrdersCount');
        if (totalEl) {
            totalEl.textContent = (response.total || 0).toLocaleString();
        }
        
        // Pending orders
        const pendingEl = document.getElementById('pendingOrdersCount');
        if (pendingEl && metrics.pending !== undefined) {
            pendingEl.textContent = metrics.pending.toLocaleString();
        }
        
        // In transit orders
        const inTransitEl = document.getElementById('inTransitOrdersCount');
        if (inTransitEl && metrics.inTransit !== undefined) {
            inTransitEl.textContent = metrics.inTransit.toLocaleString();
        }
        
        // Delivered today
        const deliveredEl = document.getElementById('deliveredTodayCount');
        if (deliveredEl && metrics.deliveredToday !== undefined) {
            deliveredEl.textContent = metrics.deliveredToday.toLocaleString();
        }
    }
    
    /**
     * Update order pagination controls
     */
    updateOrderPagination() {
        const pagination = this.ordersPagination;
        if (!pagination) return;
        
        const paginationContainer = document.getElementById('orderPagination');
        if (!paginationContainer) return;
        
        let html = `<div class="pagination">`;
        
        // Previous button
        if (pagination.currentPage > 1) {
            html += `<button onclick="dashboard.loadOrders(${pagination.currentPage - 1})"><i class="fas fa-chevron-left"></i> Previous</button>`;
        }
        
        // Page info
        html += `<span>Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.total} total)</span>`;
        
        // Next button
        if (pagination.currentPage < pagination.totalPages) {
            html += `<button onclick="dashboard.loadOrders(${pagination.currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        paginationContainer.innerHTML = html;
    }
    
    /**
     * View order details from backend
     */
    async viewOrder(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading Order...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch order details from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_ORDERS.DETAIL(id));
            const order = response.data || response.order || response;
            
            const orderId = order.orderNumber || order._id?.substring(0, 8) || 'N/A';
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
            const buyerName = order.buyer?.firstName && order.buyer?.lastName 
                ? `${order.buyer.firstName} ${order.buyer.lastName}` 
                : order.buyerName || 'N/A';
            const buyerPhone = order.buyer?.phone || order.buyerPhone || 'N/A';
            const buyerEmail = order.buyer?.email || order.buyerEmail || 'N/A';
            const retailerName = order.business?.name || order.businessName || 'N/A';
            const retailerPhone = order.business?.phone || order.businessPhone || 'N/A';
            const totalAmount = order.totalAmount || order.total || 0;
            const deliveryFee = order.deliveryFee || 0;
            const serviceFee = order.serviceFee || order.platformFee || 0;
            const paymentMethod = order.payment?.method || order.paymentMethod || 'N/A';
            const paymentStatus = order.payment?.status || order.paymentStatus || 'pending';
            const orderStatus = order.status || 'pending';
            const deliveryStatus = order.delivery?.status || order.deliveryStatus || 'pending';
            const deliveryAddress = order.deliveryAddress || order.address || 'N/A';
            const courierName = order.courier?.name || order.courierName || 'Not assigned';
            const courierPhone = order.courier?.phone || order.courierPhone || 'N/A';
            
            // Build items list
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = `
                    <div style="margin-top: 15px;">
                        <strong>Order Items:</strong>
                        <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                    <th style="padding: 8px; text-align: left;">Product</th>
                                    <th style="padding: 8px; text-align: center;">Qty</th>
                                    <th style="padding: 8px; text-align: right;">Price</th>
                                    <th style="padding: 8px; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr style="border-bottom: 1px solid #dee2e6;">
                                        <td style="padding: 8px;">${item.product?.name || item.productName || 'N/A'}</td>
                                        <td style="padding: 8px; text-align: center;">${item.quantity || 0}</td>
                                        <td style="padding: 8px; text-align: right;">MWK ${(item.price || 0).toLocaleString()}</td>
                                        <td style="padding: 8px; text-align: right;">MWK ${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            // Update modal content
            document.getElementById('modalTitle').textContent = `Order #${orderId}`;
            document.getElementById('modalBody').innerHTML = `
                <div style="display: grid; gap: 20px;">
                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Order Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Order ID:</div>
                            <div><strong>${orderId}</strong></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Order Date:</div>
                            <div>${orderDate}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Order Status:</div>
                            <div><span class="badge ${orderStatus}">${orderStatus.toUpperCase()}</span></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Status:</div>
                            <div><span class="badge ${paymentStatus}">${paymentStatus.toUpperCase()}</span></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Method:</div>
                            <div>${paymentMethod.toUpperCase()}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Buyer Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Name:</div>
                            <div>${buyerName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Phone:</div>
                            <div>${buyerPhone}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div>${buyerEmail}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Retailer Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Business:</div>
                            <div>${retailerName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Phone:</div>
                            <div>${retailerPhone}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Delivery Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Status:</div>
                            <div><span class="badge ${deliveryStatus}">${deliveryStatus.toUpperCase()}</span></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Delivery Address:</div>
                            <div>${deliveryAddress}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Courier:</div>
                            <div>${courierName}</div>
                        </div>
                        ${courierPhone !== 'N/A' ? `
                        <div class="detail-row">
                            <div class="detail-label">Courier Phone:</div>
                            <div>${courierPhone}</div>
                        </div>
                        ` : ''}
                    </div>

                    ${itemsHtml}

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Payment Summary</h4>
                        <div class="detail-row">
                            <div class="detail-label">Subtotal:</div>
                            <div>MWK ${(totalAmount - deliveryFee - serviceFee).toLocaleString()}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Delivery Fee:</div>
                            <div>MWK ${deliveryFee.toLocaleString()}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Service Fee:</div>
                            <div>MWK ${serviceFee.toLocaleString()}</div>
                        </div>
                        <div class="detail-row" style="border-top: 2px solid #dee2e6; padding-top: 10px; margin-top: 10px;">
                            <div class="detail-label"><strong>Total Amount:</strong></div>
                            <div><strong>MWK ${totalAmount.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading order details:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load order details.</div>';
            this.showError('Failed to load order details: ' + error.message);
        }
    }
    
    /**
     * Update order status
     */
    async updateOrderStatus(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch order details from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_ORDERS.DETAIL(id));
            const order = response.data || response.order || response;
            
            const orderId = order.orderNumber || order._id?.substring(0, 8) || 'N/A';
            
            // Update modal with status update form
            document.getElementById('modalTitle').textContent = `Update Order #${orderId}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>Order Status</label>
                    <select id="editOrderStatus">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Status</label>
                    <select id="editPaymentStatus">
                        <option value="pending" ${(order.payment?.status || order.paymentStatus) === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${(order.payment?.status || order.paymentStatus) === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="failed" ${(order.payment?.status || order.paymentStatus) === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Delivery Status</label>
                    <select id="editDeliveryStatus">
                        <option value="pending" ${(order.delivery?.status || order.deliveryStatus) === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="assigned" ${(order.delivery?.status || order.deliveryStatus) === 'assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="picked_up" ${(order.delivery?.status || order.deliveryStatus) === 'picked_up' ? 'selected' : ''}>Picked Up</option>
                        <option value="in_transit" ${(order.delivery?.status || order.deliveryStatus) === 'in_transit' ? 'selected' : ''}>In Transit</option>
                        <option value="delivered" ${(order.delivery?.status || order.deliveryStatus) === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="failed" ${(order.delivery?.status || order.deliveryStatus) === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Admin Notes (Optional)</label>
                    <textarea id="editOrderNotes" rows="3" placeholder="Add any notes about this status update...">${order.adminNotes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.saveOrderStatusUpdate('${order._id || order.id}')">Save Changes</button>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading order for update:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load order details.</div>';
            this.showError('Failed to load order: ' + error.message);
        }
    }
    
    /**
     * Save order status updates to backend
     */
    async saveOrderStatusUpdate(id) {
        const orderStatus = document.getElementById('editOrderStatus').value;
        const paymentStatus = document.getElementById('editPaymentStatus').value;
        const deliveryStatus = document.getElementById('editDeliveryStatus').value;
        const notes = document.getElementById('editOrderNotes').value;

        try {
            // Show loading
            const saveBtn = event.target;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            
            // Prepare update data
            const updateData = {
                status: orderStatus,
                paymentStatus: paymentStatus,
                deliveryStatus: deliveryStatus,
                ...(notes && { adminNotes: notes })
            };
            
            // Update order via API
            await this.api.put(API_ENDPOINTS.ADMIN_ORDERS.UPDATE_STATUS(id), updateData);
            
            // Success
            this.showSuccess('Order status updated successfully!');
            this.closeModal();
            
            // Reload orders list
            this.loadOrders();
            
        } catch (error) {
            console.error('Error saving order status:', error);
            this.showError('Failed to save changes: ' + error.message);
            
            // Re-enable button
            const saveBtn = event.target;
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    }

    // ====================================================================
    // PAYMENT MANAGEMENT FUNCTIONS
    // ====================================================================

    /**
     * Load payments from backend with pagination and filters
     */
    async loadPayments(page = 1, limit = 20) {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) {
            console.error('Payments table body not found');
            return;
        }
        
        try {
            // Show loading state
            this.showTableLoading(tbody, 8, 'Loading payments...');
            
            // Get filter values
            const search = document.getElementById('paymentSearch')?.value || '';
            const status = document.getElementById('paymentStatusFilterSelect')?.value || '';
            const method = document.getElementById('paymentMethodFilter')?.value || '';
            const dateRange = document.getElementById('paymentDateRangeFilter')?.value || '';
            
            // Build query parameters
            const params = {
                page,
                limit,
                search,
                ...(status && { status: status }),
                ...(method && { method: method }),
                ...(dateRange && { dateRange: dateRange })
            };
            
            // Fetch payments from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_PAYMENTS.LIST, params);
            
            // Clear loading state
            tbody.innerHTML = '';
            
            // Check if we have data
            const payments = response.data || response.payments || [];
            
            if (payments.length === 0) {
                this.showEmptyState(tbody, 8, 'No payments found');
                return;
            }
            
            // Store pagination info
            this.paymentsPagination = {
                currentPage: response.page || page,
                totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
                total: response.total || 0,
                limit
            };
            
            // Update payment metrics
            this.updatePaymentMetrics(response);
            
            // Render payments
            payments.forEach(payment => {
                const row = document.createElement('tr');
                
                const transactionId = payment.transactionId || payment._id?.substring(0, 12) || 'N/A';
                const paymentDate = payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A';
                const orderId = payment.order?.orderNumber || payment.orderNumber || payment.orderId?.substring(0, 8) || 'N/A';
                const buyerName = payment.user?.firstName && payment.user?.lastName 
                    ? `${payment.user.firstName} ${payment.user.lastName}` 
                    : payment.buyerName || 'N/A';
                const amount = payment.amount || 0;
                const method = payment.method || 'N/A';
                const status = payment.status || 'pending';
                
                row.innerHTML = `
                    <td><strong>${transactionId}</strong></td>
                    <td>${paymentDate}</td>
                    <td>${orderId}</td>
                    <td>${buyerName}</td>
                    <td>MWK ${amount.toLocaleString()}</td>
                    <td>${method.replace('_', ' ').toUpperCase()}</td>
                    <td><span class="badge ${status}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn view" onclick="dashboard.viewPayment('${payment._id || payment.id}')">
                            <i class="fas fa-eye"></i>
                            <span>View</span>
                        </button>
                        ${status === 'paid' && this.authService.isSuperAdmin() ? `
                        <button class="action-btn edit" onclick="dashboard.refundPayment('${payment._id || payment.id}')">
                            <i class="fas fa-undo"></i>
                            <span>Refund</span>
                        </button>` : ''}
                        ${status === 'pending' && (this.authService.isSuperAdmin() || this.authService.hasRole('admin')) ? `
                        <button class="action-btn edit" onclick="dashboard.verifyPayment('${payment._id || payment.id}')">
                            <i class="fas fa-check"></i>
                            <span>Verify</span>
                        </button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Update pagination UI
            this.updatePaymentPagination();
            
        } catch (error) {
            console.error('Error loading payments:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545; padding: 40px;"><i class="fas fa-exclamation-triangle"></i> Failed to load payments. Please try again.</td></tr>';
            this.showError('Failed to load payments: ' + error.message);
        }
    }
    
    /**
     * Update payment metrics cards
     */
    updatePaymentMetrics(response) {
        const metrics = response.metrics || response.stats || {};
        
        // Total payments
        const totalEl = document.getElementById('totalPaymentsCount');
        if (totalEl) {
            totalEl.textContent = (response.total || 0).toLocaleString();
        }
        
        // Successful today
        const successfulCountEl = document.getElementById('successfulPaymentsCount');
        if (successfulCountEl && metrics.successfulToday !== undefined) {
            successfulCountEl.textContent = metrics.successfulToday.toLocaleString();
        }
        
        const successfulAmountEl = document.getElementById('successfulPaymentsAmount');
        if (successfulAmountEl && metrics.successfulTodayAmount !== undefined) {
            successfulAmountEl.textContent = `MWK ${metrics.successfulTodayAmount.toLocaleString()}`;
        }
        
        // Pending payments
        const pendingCountEl = document.getElementById('pendingPaymentsCount');
        if (pendingCountEl && metrics.pending !== undefined) {
            pendingCountEl.textContent = metrics.pending.toLocaleString();
        }
        
        const pendingAmountEl = document.getElementById('pendingPaymentsAmount');
        if (pendingAmountEl && metrics.pendingAmount !== undefined) {
            pendingAmountEl.textContent = `MWK ${metrics.pendingAmount.toLocaleString()}`;
        }
        
        // Failed payments
        const failedEl = document.getElementById('failedPaymentsCount');
        if (failedEl && metrics.failed !== undefined) {
            failedEl.textContent = metrics.failed.toLocaleString();
        }
    }
    
    /**
     * Update payment pagination controls
     */
    updatePaymentPagination() {
        const pagination = this.paymentsPagination;
        if (!pagination) return;
        
        const paginationContainer = document.getElementById('paymentPagination');
        if (!paginationContainer) return;
        
        let html = `<div class="pagination">`;
        
        // Previous button
        if (pagination.currentPage > 1) {
            html += `<button onclick="dashboard.loadPayments(${pagination.currentPage - 1})"><i class="fas fa-chevron-left"></i> Previous</button>`;
        }
        
        // Page info
        html += `<span>Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.total} total)</span>`;
        
        // Next button
        if (pagination.currentPage < pagination.totalPages) {
            html += `<button onclick="dashboard.loadPayments(${pagination.currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        paginationContainer.innerHTML = html;
    }
    
    /**
     * View payment details from backend
     */
    async viewPayment(id) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading Payment...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch payment details from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_PAYMENTS.DETAIL(id));
            const payment = response.data || response.payment || response;
            
            const transactionId = payment.transactionId || payment._id || 'N/A';
            const paymentDate = payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A';
            const orderId = payment.order?.orderNumber || payment.orderNumber || 'N/A';
            const buyerName = payment.user?.firstName && payment.user?.lastName 
                ? `${payment.user.firstName} ${payment.user.lastName}` 
                : payment.buyerName || 'N/A';
            const buyerEmail = payment.user?.email || payment.buyerEmail || 'N/A';
            const buyerPhone = payment.user?.phone || payment.buyerPhone || 'N/A';
            const amount = payment.amount || 0;
            const method = payment.method || 'N/A';
            const status = payment.status || 'pending';
            const providerRef = payment.providerReference || payment.providerTransactionId || 'N/A';
            const providerStatus = payment.providerStatus || 'N/A';
            const failureReason = payment.failureReason || payment.errorMessage || 'N/A';
            
            // Update modal content
            document.getElementById('modalTitle').textContent = `Payment Details - ${transactionId.substring(0, 12)}`;
            document.getElementById('modalBody').innerHTML = `
                <div style="display: grid; gap: 20px;">
                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Payment Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Transaction ID:</div>
                            <div><strong>${transactionId}</strong></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Date:</div>
                            <div>${paymentDate}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Status:</div>
                            <div><span class="badge ${status}">${status.toUpperCase()}</span></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Amount:</div>
                            <div><strong>MWK ${amount.toLocaleString()}</strong></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Method:</div>
                            <div>${method.replace('_', ' ').toUpperCase()}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Order Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Order ID:</div>
                            <div>${orderId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Buyer Name:</div>
                            <div>${buyerName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Buyer Email:</div>
                            <div>${buyerEmail}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Buyer Phone:</div>
                            <div>${buyerPhone}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 10px; color: #2952CC;">Provider Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Provider Reference:</div>
                            <div>${providerRef}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Provider Status:</div>
                            <div>${providerStatus}</div>
                        </div>
                        ${status === 'failed' && failureReason !== 'N/A' ? `
                        <div class="detail-row">
                            <div class="detail-label">Failure Reason:</div>
                            <div style="color: #dc3545;">${failureReason}</div>
                        </div>
                        ` : ''}
                    </div>

                    ${payment.refundedAt ? `
                    <div>
                        <h4 style="margin-bottom: 10px; color: #dc3545;">Refund Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Refunded At:</div>
                            <div>${new Date(payment.refundedAt).toLocaleString()}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Refund Amount:</div>
                            <div>MWK ${(payment.refundAmount || amount).toLocaleString()}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Refund Reason:</div>
                            <div>${payment.refundReason || 'N/A'}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading payment details:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load payment details.</div>';
            this.showError('Failed to load payment details: ' + error.message);
        }
    }
    
    /**
     * Verify pending payment
     */
    async verifyPayment(id) {
        if (!confirm('Are you sure you want to manually verify this payment? This will mark the payment as successful.')) {
            return;
        }

        try {
            // Verify payment via API
            await this.api.put(API_ENDPOINTS.ADMIN_PAYMENTS.VERIFY(id), { verified: true });
            
            // Success
            this.showSuccess('Payment verified successfully!');
            
            // Reload payments list
            this.loadPayments();
            
        } catch (error) {
            console.error('Error verifying payment:', error);
            this.showError('Failed to verify payment: ' + error.message);
        }
    }
    
    /**
     * Refund payment
     */
    async refundPayment(id) {
        try {
            // Show modal with refund form
            document.getElementById('modalTitle').textContent = 'Process Refund';
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>Refund Reason <span style="color: #dc3545;">*</span></label>
                    <textarea id="refundReason" rows="4" placeholder="Please provide a reason for this refund..." required></textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="confirmRefund" required>
                        I confirm that this refund should be processed
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.processRefund('${id}')">Process Refund</button>
                </div>
            `;
            document.getElementById('detailModal').classList.add('active');
            
        } catch (error) {
            console.error('Error loading refund form:', error);
            this.showError('Failed to load refund form: ' + error.message);
        }
    }
    
    /**
     * Process refund
     */
    async processRefund(id) {
        const reason = document.getElementById('refundReason').value.trim();
        const confirmed = document.getElementById('confirmRefund').checked;

        if (!reason) {
            this.showError('Please provide a reason for the refund');
            return;
        }

        if (!confirmed) {
            this.showError('Please confirm the refund by checking the checkbox');
            return;
        }

        try {
            // Show loading
            const saveBtn = event.target;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            saveBtn.disabled = true;
            
            // Process refund via API
            await this.api.post(API_ENDPOINTS.ADMIN_PAYMENTS.REFUND(id), { 
                reason: reason 
            });
            
            // Success
            this.showSuccess('Refund processed successfully!');
            this.closeModal();
            
            // Reload payments list
            this.loadPayments();
            
        } catch (error) {
            console.error('Error processing refund:', error);
            this.showError('Failed to process refund: ' + error.message);
            
            // Re-enable button
            const saveBtn = event.target;
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Process Refund';
        }
    }

    // ====================================================================
    // SERVICE FEE & COMMISSION MANAGEMENT FUNCTIONS
    // ====================================================================

    /**
     * Load fee settings from backend
     */
    async loadFees() {
        const tbody = document.getElementById('feesTableBody');
        if (!tbody) {
            console.error('Fees table body not found');
            return;
        }
        
        try {
            // Show loading state
            this.showTableLoading(tbody, 6, 'Loading fee settings...');
            
            // Fetch fee settings and commission settings from backend
            const [feesResponse, commissionResponse] = await Promise.all([
                this.api.get(API_ENDPOINTS.ADMIN_SETTINGS.FEES),
                this.api.get(API_ENDPOINTS.ADMIN_SETTINGS.COMMISSION)
            ]);
            
            // Clear loading state
            tbody.innerHTML = '';
            
            const fees = feesResponse.data || feesResponse.fees || {};
            const commission = commissionResponse.data || commissionResponse.commission || {};
            
            // Update metric cards
            this.updateFeeMetrics(fees, commission);
            
            // Create fee configuration rows
            const feeConfigs = [
                {
                    type: 'Platform Commission',
                    value: `${commission.rate || 0}%`,
                    description: 'Percentage commission taken from each sale',
                    lastModified: commission.updatedAt ? new Date(commission.updatedAt).toLocaleDateString() : 'Never',
                    modifiedBy: commission.modifiedBy?.firstName || 'System',
                    editType: 'commission'
                },
                {
                    type: 'Delivery Fee',
                    value: `MWK ${(fees.deliveryFee || 0).toLocaleString()}`,
                    description: 'Standard delivery fee charged to customers',
                    lastModified: fees.deliveryFeeUpdatedAt ? new Date(fees.deliveryFeeUpdatedAt).toLocaleDateString() : 'Never',
                    modifiedBy: fees.deliveryFeeModifiedBy?.firstName || 'System',
                    editType: 'deliveryFee'
                },
                {
                    type: 'Service Fee',
                    value: `MWK ${(fees.serviceFee || 0).toLocaleString()}`,
                    description: 'Service fee charged per transaction',
                    lastModified: fees.serviceFeeUpdatedAt ? new Date(fees.serviceFeeUpdatedAt).toLocaleDateString() : 'Never',
                    modifiedBy: fees.serviceFeeModifiedBy?.firstName || 'System',
                    editType: 'serviceFee'
                },
                {
                    type: 'Minimum Order Amount',
                    value: `MWK ${(fees.minimumOrderAmount || 0).toLocaleString()}`,
                    description: 'Minimum order amount required for checkout',
                    lastModified: fees.minimumOrderUpdatedAt ? new Date(fees.minimumOrderUpdatedAt).toLocaleDateString() : 'Never',
                    modifiedBy: fees.minimumOrderModifiedBy?.firstName || 'System',
                    editType: 'minimumOrderAmount'
                }
            ];
            
            // Render fee rows
            feeConfigs.forEach(config => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${config.type}</strong></td>
                    <td>${config.value}</td>
                    <td style="color: #666;">${config.description}</td>
                    <td>${config.lastModified}</td>
                    <td>${config.modifiedBy}</td>
                    <td>
                        <button class="action-btn edit" onclick="dashboard.editFee('${config.editType}')">
                            <i class="fas fa-edit"></i>
                            <span>Edit</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading fees:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #dc3545; padding: 40px;"><i class="fas fa-exclamation-triangle"></i> Failed to load fee settings. Please try again.</td></tr>';
            this.showError('Failed to load fee settings: ' + error.message);
        }
    }
    
    /**
     * Update fee metrics cards
     */
    updateFeeMetrics(fees, commission) {
        // Platform commission rate
        const commissionEl = document.getElementById('platformCommissionRate');
        if (commissionEl && commission.rate !== undefined) {
            commissionEl.textContent = `${commission.rate}%`;
        }
        
        const commissionUpdatedEl = document.getElementById('commissionLastUpdated');
        if (commissionUpdatedEl && commission.updatedAt) {
            commissionUpdatedEl.textContent = `Updated ${new Date(commission.updatedAt).toLocaleDateString()}`;
        }
        
        // Delivery fee
        const deliveryFeeEl = document.getElementById('deliveryFeeAmount');
        if (deliveryFeeEl && fees.deliveryFee !== undefined) {
            deliveryFeeEl.textContent = `MWK ${fees.deliveryFee.toLocaleString()}`;
        }
        
        const deliveryUpdatedEl = document.getElementById('deliveryFeeLastUpdated');
        if (deliveryUpdatedEl && fees.deliveryFeeUpdatedAt) {
            deliveryUpdatedEl.textContent = `Updated ${new Date(fees.deliveryFeeUpdatedAt).toLocaleDateString()}`;
        }
        
        // Service fee
        const serviceFeeEl = document.getElementById('serviceFeeAmount');
        if (serviceFeeEl && fees.serviceFee !== undefined) {
            serviceFeeEl.textContent = `MWK ${fees.serviceFee.toLocaleString()}`;
        }
        
        const serviceUpdatedEl = document.getElementById('serviceFeeLastUpdated');
        if (serviceUpdatedEl && fees.serviceFeeUpdatedAt) {
            serviceUpdatedEl.textContent = `Updated ${new Date(fees.serviceFeeUpdatedAt).toLocaleDateString()}`;
        }
        
        // Total revenue today (if available)
        const revenueEl = document.getElementById('totalRevenueToday');
        if (revenueEl && fees.revenueToday !== undefined) {
            revenueEl.textContent = `MWK ${fees.revenueToday.toLocaleString()}`;
        }
    }
    
    /**
     * Edit fee setting
     */
    async editFee(feeType) {
        try {
            // Show modal with loading state
            document.getElementById('modalTitle').textContent = 'Loading...';
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            document.getElementById('detailModal').classList.add('active');
            
            // Fetch current settings
            let response, currentValue, inputLabel, inputType = 'number', inputStep = '1';
            
            if (feeType === 'commission') {
                response = await this.api.get(API_ENDPOINTS.ADMIN_SETTINGS.COMMISSION);
                currentValue = response.data?.rate || response.commission?.rate || 0;
                inputLabel = 'Commission Rate (%)';
                inputStep = '0.1';
            } else {
                response = await this.api.get(API_ENDPOINTS.ADMIN_SETTINGS.FEES);
                const fees = response.data || response.fees || {};
                
                if (feeType === 'deliveryFee') {
                    currentValue = fees.deliveryFee || 0;
                    inputLabel = 'Delivery Fee (MWK)';
                } else if (feeType === 'serviceFee') {
                    currentValue = fees.serviceFee || 0;
                    inputLabel = 'Service Fee (MWK)';
                } else if (feeType === 'minimumOrderAmount') {
                    currentValue = fees.minimumOrderAmount || 0;
                    inputLabel = 'Minimum Order Amount (MWK)';
                }
            }
            
            // Update modal with edit form
            const feeTypeName = feeType === 'commission' ? 'Platform Commission' :
                                feeType === 'deliveryFee' ? 'Delivery Fee' :
                                feeType === 'serviceFee' ? 'Service Fee' : 'Minimum Order Amount';
            
            document.getElementById('modalTitle').textContent = `Edit ${feeTypeName}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>${inputLabel} <span style="color: #dc3545;">*</span></label>
                    <input type="${inputType}" id="editFeeValue" value="${currentValue}" step="${inputStep}" min="0" required>
                    <small style="color: #666; display: block; margin-top: 5px;">
                        Current value: ${feeType === 'commission' ? currentValue + '%' : 'MWK ' + currentValue.toLocaleString()}
                    </small>
                </div>
                <div class="form-group">
                    <label>Reason for Change (Optional)</label>
                    <textarea id="editFeeReason" rows="3" placeholder="Briefly explain why this change is being made..."></textarea>
                </div>
                <div class="form-group" style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <strong style="color: #856404;"><i class="fas fa-exclamation-triangle"></i> Warning:</strong>
                    <p style="margin: 5px 0 0; color: #856404;">
                        Changing this value will affect all future transactions. Please ensure you have authorization before proceeding.
                    </p>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.saveFeeUpdate('${feeType}')">Save Changes</button>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading fee for edit:', error);
            document.getElementById('modalBody').innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load fee settings.</div>';
            this.showError('Failed to load fee settings: ' + error.message);
        }
    }
    
    /**
     * Save fee update to backend
     */
    async saveFeeUpdate(feeType) {
        const value = parseFloat(document.getElementById('editFeeValue').value);
        const reason = document.getElementById('editFeeReason').value.trim();

        if (!value || value < 0) {
            this.showError('Please enter a valid value greater than or equal to 0');
            return;
        }

        try {
            // Show loading
            const saveBtn = event.target;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            
            let endpoint, updateData;
            
            if (feeType === 'commission') {
                endpoint = API_ENDPOINTS.ADMIN_SETTINGS.UPDATE_COMMISSION;
                updateData = {
                    rate: value,
                    ...(reason && { reason: reason })
                };
            } else {
                endpoint = API_ENDPOINTS.ADMIN_SETTINGS.UPDATE_FEES;
                updateData = {
                    [feeType]: value,
                    ...(reason && { reason: reason })
                };
            }
            
            // Update fee via API
            await this.api.put(endpoint, updateData);
            
            // Success
            this.showSuccess('Fee updated successfully!');
            this.closeModal();
            
            // Reload fees list
            this.loadFees();
            
        } catch (error) {
            console.error('Error saving fee:', error);
            this.showError('Failed to save changes: ' + error.message);
            
            // Re-enable button
            const saveBtn = event.target;
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    }

    // ====================================================================
    // REPORTING SYSTEM FUNCTIONS
    // ====================================================================

    /**
     * Generate report based on selected parameters
     */
    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const period = document.getElementById('reportPeriod').value;
        const outputDiv = document.getElementById('reportOutput');
        const exportBtn = document.getElementById('exportReportBtn');
        
        if (!outputDiv) {
            console.error('Report output div not found');
            return;
        }
        
        try {
            // Show loading state
            outputDiv.innerHTML = '<div style="text-align: center; padding: 60px;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #2952CC;"></i><p style="margin-top: 20px; color: #666;">Generating report...</p></div>';
            exportBtn.disabled = true;
            
            // Get date range
            let startDate, endDate;
            if (period === 'custom') {
                startDate = document.getElementById('reportStartDate').value;
                endDate = document.getElementById('reportEndDate').value;
                
                if (!startDate || !endDate) {
                    this.showError('Please select both start and end dates for custom range');
                    outputDiv.innerHTML = '';
                    return;
                }
            } else {
                const dates = this.getDateRangeForPeriod(period);
                startDate = dates.startDate;
                endDate = dates.endDate;
            }
            
            // Build query parameters
            const params = {
                startDate,
                endDate,
                type: reportType
            };
            
            // Fetch report data based on type
            let reportData;
            switch (reportType) {
                case 'executive':
                    reportData = await this.generateExecutiveSummary(params);
                    break;
                case 'retailer':
                    reportData = await this.generateRetailerReport(params);
                    break;
                case 'buyer':
                    reportData = await this.generateBuyerReport(params);
                    break;
                case 'delivery':
                    reportData = await this.generateDeliveryReport(params);
                    break;
                case 'financial':
                    reportData = await this.generateFinancialReport(params);
                    break;
                case 'products':
                    reportData = await this.generateProductReport(params);
                    break;
                default:
                    throw new Error('Invalid report type');
            }
            
            // Display report
            this.displayReport(reportData, reportType, startDate, endDate);
            exportBtn.disabled = false;
            
        } catch (error) {
            console.error('Error generating report:', error);
            outputDiv.innerHTML = '<div style="text-align: center; padding: 60px; color: #dc3545;"><i class="fas fa-exclamation-triangle" style="font-size: 48px;"></i><p style="margin-top: 20px;">Failed to generate report. Please try again.</p></div>';
            this.showError('Failed to generate report: ' + error.message);
            exportBtn.disabled = true;
        }
    }
    
    /**
     * Get date range for predefined periods
     */
    getDateRangeForPeriod(period) {
        const now = new Date();
        let startDate, endDate;
        
        endDate = now.toISOString().split('T')[0];
        
        switch (period) {
            case 'today':
                startDate = endDate;
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = endDate = yesterday.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - now.getDay());
                startDate = weekStart.toISOString().split('T')[0];
                break;
            case 'last_week':
                const lastWeekEnd = new Date(now);
                lastWeekEnd.setDate(lastWeekEnd.getDate() - now.getDay() - 1);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekStart.getDate() - 6);
                startDate = lastWeekStart.toISOString().split('T')[0];
                endDate = lastWeekEnd.toISOString().split('T')[0];
                break;
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate = monthStart.toISOString().split('T')[0];
                break;
            case 'last_month':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                startDate = lastMonthStart.toISOString().split('T')[0];
                endDate = lastMonthEnd.toISOString().split('T')[0];
                break;
            default:
                startDate = endDate;
        }
        
        return { startDate, endDate };
    }
    
    /**
     * Generate executive summary report
     */
    async generateExecutiveSummary(params) {
        const [orders, revenue, users, businesses] = await Promise.all([
            this.api.get(API_ENDPOINTS.ADMIN_ORDERS.STATISTICS, params),
            this.api.get(API_ENDPOINTS.ADMIN_FINANCIAL.REVENUE, params),
            this.api.get(API_ENDPOINTS.ADMIN_USERS.LIST, { ...params, limit: 1 }),
            this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.LIST, { ...params, limit: 1 })
        ]);
        
        return {
            type: 'executive',
            summary: {
                totalOrders: orders.data?.total || orders.total || 0,
                completedOrders: orders.data?.completed || 0,
                pendingOrders: orders.data?.pending || 0,
                cancelledOrders: orders.data?.cancelled || 0,
                totalRevenue: revenue.data?.total || revenue.total || 0,
                platformRevenue: revenue.data?.platformRevenue || revenue.platformRevenue || 0,
                totalBuyers: users.data?.total || users.total || 0,
                newBuyers: users.data?.new || 0,
                totalRetailers: businesses.data?.total || businesses.total || 0,
                activeRetailers: businesses.data?.active || 0,
                averageOrderValue: orders.data?.averageOrderValue || 0,
                conversionRate: orders.data?.conversionRate || 0
            },
            orders: orders.data || orders,
            revenue: revenue.data || revenue
        };
    }
    
    /**
     * Generate retailer performance report
     */
    async generateRetailerReport(params) {
        const response = await this.api.get(API_ENDPOINTS.ADMIN_BUSINESSES.LIST, { 
            ...params,
            includeSales: true,
            limit: 100
        });
        
        return {
            type: 'retailer',
            retailers: response.data || response.businesses || [],
            total: response.total || 0,
            topPerformers: (response.data || response.businesses || []).slice(0, 10)
        };
    }
    
    /**
     * Generate buyer behavior report
     */
    async generateBuyerReport(params) {
        const response = await this.api.get(API_ENDPOINTS.ADMIN_USERS.LIST, { 
            ...params,
            role: 'buyer',
            includeActivity: true,
            limit: 100
        });
        
        return {
            type: 'buyer',
            buyers: response.data || response.users || [],
            total: response.total || 0,
            metrics: response.metrics || {}
        };
    }
    
    /**
     * Generate delivery performance report
     */
    async generateDeliveryReport(params) {
        const response = await this.api.get(API_ENDPOINTS.ADMIN_ORDERS.LIST, { 
            ...params,
            includeDelivery: true,
            limit: 100
        });
        
        return {
            type: 'delivery',
            orders: response.data || response.orders || [],
            metrics: response.metrics || {},
            deliveryStats: response.deliveryStats || {}
        };
    }
    
    /**
     * Generate financial overview report
     */
    async generateFinancialReport(params) {
        const [revenue, transactions, commission] = await Promise.all([
            this.api.get(API_ENDPOINTS.ADMIN_FINANCIAL.REVENUE, params),
            this.api.get(API_ENDPOINTS.ADMIN_FINANCIAL.TRANSACTIONS, params),
            this.api.get(API_ENDPOINTS.ADMIN_FINANCIAL.COMMISSION, params)
        ]);
        
        return {
            type: 'financial',
            revenue: revenue.data || revenue,
            transactions: transactions.data || transactions,
            commission: commission.data || commission
        };
    }
    
    /**
     * Generate product performance report
     */
    async generateProductReport(params) {
        const response = await this.api.get(API_ENDPOINTS.ADMIN_PRODUCTS.LIST, { 
            ...params,
            includeSales: true,
            limit: 100
        });
        
        return {
            type: 'products',
            products: response.data || response.products || [],
            total: response.total || 0,
            topSellers: (response.data || response.products || []).slice(0, 20)
        };
    }
    
    /**
     * Display generated report
     */
    displayReport(reportData, type, startDate, endDate) {
        const outputDiv = document.getElementById('reportOutput');
        const periodText = startDate === endDate ? 
            new Date(startDate).toLocaleDateString() : 
            `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
        
        let html = `
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px;">
                <div style="border-bottom: 2px solid #2952CC; padding-bottom: 15px; margin-bottom: 25px;">
                    <h3 style="margin: 0; color: #2952CC;">${this.getReportTitle(type)}</h3>
                    <p style="margin: 5px 0 0; color: #666;">Period: ${periodText}</p>
                    <p style="margin: 5px 0 0; color: #999; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
                </div>
        `;
        
        switch (type) {
            case 'executive':
                html += this.renderExecutiveSummary(reportData);
                break;
            case 'retailer':
                html += this.renderRetailerReport(reportData);
                break;
            case 'buyer':
                html += this.renderBuyerReport(reportData);
                break;
            case 'delivery':
                html += this.renderDeliveryReport(reportData);
                break;
            case 'financial':
                html += this.renderFinancialReport(reportData);
                break;
            case 'products':
                html += this.renderProductReport(reportData);
                break;
        }
        
        html += `</div>`;
        outputDiv.innerHTML = html;
    }
    
    /**
     * Render executive summary
     */
    renderExecutiveSummary(data) {
        const summary = data.summary;
        return `
            <div class="metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px;">
                    <div style="font-size: 14px; opacity: 0.9;">Total Orders</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${summary.totalOrders.toLocaleString()}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Completed: ${summary.completedOrders}</div>
                </div>
                <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 8px;">
                    <div style="font-size: 14px; opacity: 0.9;">Total Revenue</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">MWK ${summary.totalRevenue.toLocaleString()}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Platform: MWK ${summary.platformRevenue.toLocaleString()}</div>
                </div>
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px;">
                    <div style="font-size: 14px; opacity: 0.9;">Total Buyers</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${summary.totalBuyers.toLocaleString()}</div>
                    <div style="font-size: 12px; opacity: 0.8;">New: ${summary.newBuyers}</div>
                </div>
                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 8px;">
                    <div style="font-size: 14px; opacity: 0.9;">Active Retailers</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${summary.activeRetailers}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Total: ${summary.totalRetailers}</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4 style="color: #2952CC; margin-bottom: 15px;">Order Statistics</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px 0;">Completed Orders</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${summary.completedOrders}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px 0;">Pending Orders</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${summary.pendingOrders}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px 0;">Cancelled Orders</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${summary.cancelledOrders}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">Average Order Value</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">MWK ${summary.averageOrderValue.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h4 style="color: #2952CC; margin-bottom: 15px;">Performance Metrics</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px 0;">Conversion Rate</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${summary.conversionRate.toFixed(2)}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px 0;">Order Completion Rate</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${((summary.completedOrders / summary.totalOrders) * 100 || 0).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">Platform Revenue</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">MWK ${summary.platformRevenue.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    }
    
    /**
     * Render retailer performance report
     */
    renderRetailerReport(data) {
        let html = `
            <h4 style="color: #2952CC; margin-bottom: 15px;">Top Performing Retailers</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px; text-align: left;">Rank</th>
                        <th style="padding: 12px; text-align: left;">Business Name</th>
                        <th style="padding: 12px; text-align: left;">Owner</th>
                        <th style="padding: 12px; text-align: right;">Total Sales</th>
                        <th style="padding: 12px; text-align: right;">Orders</th>
                        <th style="padding: 12px; text-align: right;">Products</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.topPerformers.forEach((retailer, index) => {
            html += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;">${index + 1}</td>
                    <td style="padding: 12px;"><strong>${retailer.name || 'N/A'}</strong></td>
                    <td style="padding: 12px;">${retailer.owner || 'N/A'}</td>
                    <td style="padding: 12px; text-align: right;">MWK ${(retailer.totalRevenue || 0).toLocaleString()}</td>
                    <td style="padding: 12px; text-align: right;">${retailer.totalOrders || 0}</td>
                    <td style="padding: 12px; text-align: right;">${retailer.totalProducts || 0}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <p style="color: #666; margin-top: 20px;">Total Retailers: ${data.total}</p>
        `;
        
        return html;
    }
    
    /**
     * Render buyer behavior report
     */
    renderBuyerReport(data) {
        const metrics = data.metrics;
        return `
            <h4 style="color: #2952CC; margin-bottom: 15px;">Buyer Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Active Buyers</div>
                    <div style="font-size: 24px; font-weight: bold; color: #43e97b;">${metrics.active || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Dormant Buyers</div>
                    <div style="font-size: 24px; font-weight: bold; color: #f093fb;">${metrics.dormant || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Inactive Buyers</div>
                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${metrics.inactive || 0}</div>
                </div>
            </div>
            <p style="color: #666;">Total Buyers: ${data.total}</p>
        `;
    }
    
    /**
     * Render delivery performance report
     */
    renderDeliveryReport(data) {
        const stats = data.deliveryStats || {};
        return `
            <h4 style="color: #2952CC; margin-bottom: 15px;">Delivery Performance</h4>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Pending</div>
                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${stats.pending || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">In Transit</div>
                    <div style="font-size: 24px; font-weight: bold; color: #4facfe;">${stats.inTransit || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Delivered</div>
                    <div style="font-size: 24px; font-weight: bold; color: #43e97b;">${stats.delivered || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-size: 14px;">Failed</div>
                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${stats.failed || 0}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render financial overview report
     */
    renderFinancialReport(data) {
        const revenue = data.revenue;
        return `
            <h4 style="color: #2952CC; margin-bottom: 15px;">Financial Overview</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;">Total Revenue</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">MWK ${(revenue.total || 0).toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;">Platform Commission</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">MWK ${(revenue.platformRevenue || 0).toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;">Delivery Fees</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">MWK ${(revenue.deliveryFees || 0).toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="padding: 12px;">Service Fees</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">MWK ${(revenue.serviceFees || 0).toLocaleString()}</td>
                </tr>
            </table>
        `;
    }
    
    /**
     * Render product performance report
     */
    renderProductReport(data) {
        let html = `
            <h4 style="color: #2952CC; margin-bottom: 15px;">Top Selling Products</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px; text-align: left;">Rank</th>
                        <th style="padding: 12px; text-align: left;">Product</th>
                        <th style="padding: 12px; text-align: left;">Business</th>
                        <th style="padding: 12px; text-align: right;">Units Sold</th>
                        <th style="padding: 12px; text-align: right;">Revenue</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.topSellers.forEach((product, index) => {
            html += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;">${index + 1}</td>
                    <td style="padding: 12px;"><strong>${product.name || 'N/A'}</strong></td>
                    <td style="padding: 12px;">${product.business?.name || 'N/A'}</td>
                    <td style="padding: 12px; text-align: right;">${product.unitsSold || 0}</td>
                    <td style="padding: 12px; text-align: right;">MWK ${(product.revenue || 0).toLocaleString()}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    }
    
    /**
     * Get report title based on type
     */
    getReportTitle(type) {
        const titles = {
            executive: 'Executive Summary Report',
            retailer: 'Retailer Performance Report',
            buyer: 'Buyer Behavior Report',
            delivery: 'Delivery Performance Report',
            financial: 'Financial Overview Report',
            products: 'Product Performance Report'
        };
        return titles[type] || 'Report';
    }
    
    /**
     * Export report as PDF (placeholder)
     */
    async exportReport() {
        try {
            this.showInfo('Export functionality will be available soon. Please use browser print for now.');
            // Future: Implement PDF export using jsPDF or similar
            window.print();
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Failed to export report: ' + error.message);
        }
    }

    // ====================================================================
    // ADMIN USER MANAGEMENT FUNCTIONS
    // ====================================================================

    /**
     * Load admin users list with filters and pagination
     */
    async loadAdmins() {
        try {
            const search = document.getElementById('adminSearch')?.value || '';
            const role = document.getElementById('adminRoleFilter')?.value || '';
            const status = document.getElementById('adminStatusFilter')?.value || '';
            
            // Build query parameters
            const params = {
                page: this.currentAdminsPage || 1,
                limit: 20,
                search,
                role,
                status
            };
            
            // Remove empty parameters
            Object.keys(params).forEach(key => {
                if (!params[key] || params[key] === '') delete params[key];
            });
            
            // Show loading state
            this.showTableLoading('adminsTableBody');
            
            // Fetch admin users from backend
            const response = await this.api.get(API_ENDPOINTS.ADMIN_STAFF.LIST, params);
            const admins = response.data || response.admins || response.staff || [];
            const total = response.total || admins.length;
            
            // Update admin metrics
            this.updateAdminMetrics(response.metrics || {}, admins);
            
            // Populate table
            const tbody = document.getElementById('adminsTableBody');
            if (!tbody) return;
            
            if (admins.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No admin users found</td></tr>';
                return;
            }
            
            tbody.innerHTML = admins.map(admin => `
                <tr>
                    <td>${admin.username || 'N/A'}</td>
                    <td>${admin.firstName || ''} ${admin.lastName || ''}</td>
                    <td>${admin.email || 'N/A'}</td>
                    <td><span class="badge ${this.getRoleBadgeClass(admin.role)}">${this.getRoleDisplayName(admin.role)}</span></td>
                    <td>${admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</td>
                    <td><span class="badge ${admin.status === 'active' ? 'active' : admin.status === 'suspended' ? 'cancelled' : 'inactive'}">${(admin.status || 'active').toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn" onclick="dashboard.viewAdmin('${admin._id || admin.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" onclick="dashboard.editAdmin('${admin._id || admin.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${admin.role !== 'super_admin' ? `
                        <button class="action-btn" onclick="dashboard.deleteAdmin('${admin._id || admin.id}', '${admin.username}')" title="Delete" style="color: #dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
            
            // Update pagination
            this.updateAdminPagination(total, params.limit);
            
        } catch (error) {
            console.error('Error loading admin users:', error);
            this.showError('Failed to load admin users: ' + error.message);
            const tbody = document.getElementById('adminsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">Failed to load admin users</td></tr>';
            }
        }
    }
    
    /**
     * Update admin metrics dashboard
     */
    updateAdminMetrics(metrics, admins = []) {
        // Count from metrics or calculate from admins array
        const total = metrics.total || admins.length;
        const active = metrics.active || admins.filter(a => a.status === 'active').length;
        const superAdmins = metrics.superAdmins || admins.filter(a => a.role === 'super_admin').length;
        const supportStaff = metrics.supportStaff || admins.filter(a => a.role === 'support_staff').length;
        
        // Update metric cards
        const totalEl = document.getElementById('totalAdminsCount');
        const activeEl = document.getElementById('activeAdminsCount');
        const superEl = document.getElementById('superAdminsCount');
        const supportEl = document.getElementById('supportStaffCount');
        
        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (superEl) superEl.textContent = superAdmins;
        if (supportEl) supportEl.textContent = supportStaff;
    }
    
    /**
     * Get role badge CSS class
     */
    getRoleBadgeClass(role) {
        const classes = {
            'super_admin': 'badge-super-admin',
            'admin': 'badge-admin',
            'support_staff': 'badge-support'
        };
        return classes[role] || 'badge-default';
    }
    
    /**
     * Get role display name
     */
    getRoleDisplayName(role) {
        const names = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'support_staff': 'Support Staff'
        };
        return names[role] || role;
    }
    
    /**
     * Update admin pagination controls
     */
    updateAdminPagination(total, limit = 20) {
        const container = document.getElementById('adminsPaginationContainer');
        if (!container) return;
        
        const totalPages = Math.ceil(total / limit);
        const currentPage = this.currentAdminsPage || 1;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `
            <div class="pagination">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="dashboard.goToAdminsPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="pagination-info">Page ${currentPage} of ${totalPages} (${total} total)</span>
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="dashboard.goToAdminsPage(${currentPage + 1})">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Navigate to admin page
     */
    goToAdminsPage(page) {
        this.currentAdminsPage = page;
        this.loadAdmins();
    }
    
    /**
     * View admin user details
     */
    async viewAdmin(id) {
        try {
            // Show modal with loading state
            const modal = document.getElementById('adminDetailsModal');
            const content = document.getElementById('adminDetailsContent');
            
            if (!modal || !content) {
                console.error('Admin details modal not found');
                return;
            }
            
            content.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2952CC;"></i></div>';
            modal.classList.add('active');
            
            // Fetch admin details
            const response = await this.api.get(API_ENDPOINTS.ADMIN_STAFF.DETAIL(id));
            const admin = response.data || response.admin || response.staff || response;
            
            // Display admin details
            content.innerHTML = `
                <div style="padding: 20px;">
                    <div class="detail-section">
                        <h4 style="color: #2952CC; margin-bottom: 15px;">Personal Information</h4>
                        <div class="detail-row">
                            <div class="detail-label">Username:</div>
                            <div><strong>${admin.username || 'N/A'}</strong></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Full Name:</div>
                            <div>${admin.firstName || ''} ${admin.lastName || ''}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div>${admin.email || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Phone:</div>
                            <div>${admin.phone || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4 style="color: #2952CC; margin-bottom: 15px;">Role & Access</h4>
                        <div class="detail-row">
                            <div class="detail-label">Role:</div>
                            <div><span class="badge ${this.getRoleBadgeClass(admin.role)}">${this.getRoleDisplayName(admin.role)}</span></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Status:</div>
                            <div><span class="badge ${admin.status === 'active' ? 'active' : admin.status === 'suspended' ? 'cancelled' : 'inactive'}">${(admin.status || 'active').toUpperCase()}</span></div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4 style="color: #2952CC; margin-bottom: 15px;">Activity</h4>
                        <div class="detail-row">
                            <div class="detail-label">Last Login:</div>
                            <div>${admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Created Date:</div>
                            <div>${admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Created By:</div>
                            <div>${admin.createdBy?.username || 'System'}</div>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <button class="btn-secondary" onclick="closeAdminDetailsModal()">Close</button>
                        <button class="btn-primary" onclick="dashboard.editAdmin('${admin._id || admin.id}'); closeAdminDetailsModal();">
                            <i class="fas fa-edit"></i> Edit Admin
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading admin details:', error);
            const content = document.getElementById('adminDetailsContent');
            if (content) {
                content.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i><br><br>Failed to load admin details.</div>';
            }
            this.showError('Failed to load admin details: ' + error.message);
        }
    }
    
    /**
     * Show add admin modal
     */
    showAddAdminModal() {
        const modal = document.getElementById('adminModal');
        const title = document.getElementById('adminModalTitle');
        const form = document.getElementById('adminForm');
        
        if (!modal || !title || !form) {
            console.error('Admin modal elements not found');
            return;
        }
        
        // Reset form
        form.reset();
        document.getElementById('adminId').value = '';
        
        // Set title
        title.textContent = 'Add Admin User';
        
        // Show password section for new admin
        const passwordSection = document.getElementById('passwordSection');
        if (passwordSection) {
            passwordSection.style.display = 'block';
            document.getElementById('adminPassword').required = true;
            document.getElementById('adminConfirmPassword').required = true;
        }
        
        // Show modal
        modal.classList.add('active');
    }
    
    /**
     * Edit admin user
     */
    async editAdmin(id) {
        try {
            const modal = document.getElementById('adminModal');
            const title = document.getElementById('adminModalTitle');
            
            if (!modal || !title) {
                console.error('Admin modal not found');
                return;
            }
            
            // Fetch admin details
            const response = await this.api.get(API_ENDPOINTS.ADMIN_STAFF.DETAIL(id));
            const admin = response.data || response.admin || response.staff || response;
            
            // Set title
            title.textContent = 'Edit Admin User';
            
            // Populate form
            document.getElementById('adminId').value = admin._id || admin.id;
            document.getElementById('adminUsername').value = admin.username || '';
            document.getElementById('adminEmail').value = admin.email || '';
            document.getElementById('adminFirstName').value = admin.firstName || '';
            document.getElementById('adminLastName').value = admin.lastName || '';
            document.getElementById('adminPhone').value = admin.phone || '';
            document.getElementById('adminRole').value = admin.role || '';
            document.getElementById('adminStatus').value = admin.status || 'active';
            
            // Hide password section for editing
            const passwordSection = document.getElementById('passwordSection');
            if (passwordSection) {
                passwordSection.style.display = 'none';
                document.getElementById('adminPassword').required = false;
                document.getElementById('adminConfirmPassword').required = false;
            }
            
            // Show modal
            modal.classList.add('active');
            
        } catch (error) {
            console.error('Error loading admin for edit:', error);
            this.showError('Failed to load admin details: ' + error.message);
        }
    }
    
    /**
     * Save admin user (create or update) - Enhanced with validation
     */
    async saveAdmin() {
        try {
            const id = document.getElementById('adminId').value;
            const isEdit = !!id;
            
            // Define validation rules
            const validations = {
                adminUsername: [
                    { type: 'required', message: 'Username is required' },
                    { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' }
                ],
                adminEmail: [
                    { type: 'required', message: 'Email is required' },
                    { type: 'email', message: 'Please enter a valid email address' }
                ],
                adminFirstName: [
                    { type: 'required', message: 'First name is required' }
                ],
                adminLastName: [
                    { type: 'required', message: 'Last name is required' }
                ],
                adminRole: [
                    { type: 'required', message: 'Please select a role' }
                ]
            };
            
            // Add password validation for new users
            if (!isEdit) {
                validations.adminPassword = [
                    { type: 'required', message: 'Password is required' },
                    { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
                    { 
                        type: 'pattern', 
                        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                        message: 'Password must contain letters and numbers'
                    }
                ];
                validations.adminConfirmPassword = [
                    { type: 'required', message: 'Please confirm password' },
                    {
                        type: 'custom',
                        validator: (value) => value === document.getElementById('adminPassword').value,
                        message: 'Passwords do not match'
                    }
                ];
            }
            
            // Validate form
            if (!this.validateForm('adminForm', validations)) {
                return;
            }
            
            // Get form values
            const formData = {
                username: document.getElementById('adminUsername').value.trim(),
                email: document.getElementById('adminEmail').value.trim(),
                firstName: document.getElementById('adminFirstName').value.trim(),
                lastName: document.getElementById('adminLastName').value.trim(),
                phone: document.getElementById('adminPhone').value.trim(),
                role: document.getElementById('adminRole').value,
                status: document.getElementById('adminStatus').value
            };
            
            // Add password for new admins
            if (!isEdit) {
                formData.password = document.getElementById('adminPassword').value;
            }
            
            // Show loading state
            const saveBtn = document.getElementById('saveAdminBtn');
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Save to backend
            let response;
            if (isEdit) {
                response = await this.api.put(API_ENDPOINTS.ADMIN_STAFF.UPDATE(id), formData);
            } else {
                response = await this.api.post(API_ENDPOINTS.ADMIN_STAFF.CREATE, formData);
            }
            
            // Success
            this.showSuccess(isEdit ? 'Admin user updated successfully' : 'Admin user created successfully');
            this.closeAdminModal();
            this.loadAdmins();
            
        } catch (error) {
            console.error('Error saving admin:', error);
            this.handleApiError(error, isEdit ? 'updating admin user' : 'creating admin user');
            
            // Reset button
            const saveBtn = document.getElementById('saveAdminBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Admin';
            }
        }
    }
    
    /**
     * Delete admin user
     */
    async deleteAdmin(id, username) {
        if (!confirm(`Are you sure you want to delete admin user "${username}"?\n\nThis action cannot be undone.`)) {
            return;
        }
        
        try {
            await this.api.delete(API_ENDPOINTS.ADMIN_STAFF.DELETE(id));
            this.showSuccess('Admin user deleted successfully');
            this.loadAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
            this.showError('Failed to delete admin: ' + error.message);
        }
    }
    
    /**
     * Close admin modal
     */
    closeAdminModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.classList.remove('active');
            // Clear any validation errors
            this.clearFormErrors('adminForm');
        }
    }

    /**
     * Validate form field with enhanced error messages
     */
    validateField(fieldId, validations) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const value = field.value.trim();
        const parent = field.closest('.form-group');
        
        // Remove existing error
        this.clearFieldError(fieldId);

        for (const validation of validations) {
            if (validation.type === 'required' && !value) {
                this.showFieldError(fieldId, validation.message || 'This field is required');
                return false;
            }
            
            if (validation.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    this.showFieldError(fieldId, validation.message || 'Please enter a valid email address');
                    return false;
                }
            }
            
            if (validation.type === 'minLength' && value.length < validation.value) {
                this.showFieldError(fieldId, validation.message || `Must be at least ${validation.value} characters`);
                return false;
            }
            
            if (validation.type === 'maxLength' && value.length > validation.value) {
                this.showFieldError(fieldId, validation.message || `Must be less than ${validation.value} characters`);
                return false;
            }
            
            if (validation.type === 'pattern' && value && !validation.value.test(value)) {
                this.showFieldError(fieldId, validation.message || 'Invalid format');
                return false;
            }
            
            if (validation.type === 'custom' && validation.validator && !validation.validator(value)) {
                this.showFieldError(fieldId, validation.message || 'Invalid value');
                return false;
            }
        }

        // Show success state
        field.classList.add('success');
        return true;
    }

    /**
     * Show field validation error
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const parent = field.closest('.form-group');
        if (!parent) return;

        field.classList.add('error');
        field.classList.remove('success');

        // Add error message if not exists
        let errorDiv = parent.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            parent.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    }

    /**
     * Clear field validation error
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const parent = field.closest('.form-group');
        if (!parent) return;

        field.classList.remove('error', 'success');
        
        const errorDiv = parent.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Clear all form errors
     */
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.classList.remove('error', 'success');
        });

        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }

    /**
     * Validate entire form
     */
    validateForm(formId, validations) {
        let isValid = true;
        
        for (const [fieldId, fieldValidations] of Object.entries(validations)) {
            if (!this.validateField(fieldId, fieldValidations)) {
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Show error message to user
     */
    showError(message, duration = 5000) {
        this.showToast(message, 'error', duration);
    }

    /**
     * Handle critical errors that prevent app from functioning
     */
    handleCriticalError(error) {
        const errorMessage = error.message || 'An unexpected error occurred';
        const isNetworkError = !navigator.onLine || errorMessage.includes('network') || errorMessage.includes('fetch');
        
        if (isNetworkError) {
            this.showError('Network connection lost. Please check your internet and refresh the page.', 0);
            this.showOfflineState();
        } else {
            this.showError('Failed to load application. Please refresh the page or contact support if the issue persists.', 0);
        }
    }

    /**
     * Show offline state in UI
     */
    showOfflineState() {
        // Add offline indicator to header
        const header = document.querySelector('.header');
        if (header && !document.querySelector('.offline-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> No Internet Connection';
            header.appendChild(indicator);
        }
    }

    /**
     * Remove offline state from UI
     */
    hideOfflineState() {
        const indicator = document.querySelector('.offline-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Setup network status monitoring
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.hideOfflineState();
            this.showSuccess('Internet connection restored', 3000);
            // Reload current page data
            const currentPage = document.querySelector('.content-section.active')?.id?.replace('Page', '');
            if (currentPage) {
                this.loadPageData(currentPage);
            }
        });

        window.addEventListener('offline', () => {
            this.showError('Internet connection lost', 0);
            this.showOfflineState();
        });
    }

    /**
     * Handle API errors with better context
     */
    handleApiError(error, context = '') {
        console.error(`API Error (${context}):`, error);
        
        let message = error.message || 'An error occurred';
        
        // Add context to error message
        if (context) {
            if (message.includes('network') || message.includes('fetch')) {
                message = `Unable to ${context} - please check your connection`;
            } else if (message.includes('timeout')) {
                message = `Request timed out while ${context} - please try again`;
            } else if (message.includes('Unauthorized') || message.includes('expired')) {
                // Auth errors handled by auth service
                return;
            }
        }
        
        this.showError(message);
    }

    /**
     * Show success message to user
     */
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    }

    /**
     * Show info message to user
     */
    showInfo(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    }

    /**
     * Generic toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts of same type
        const existingToasts = document.querySelectorAll(`.toast.${type}`);
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'error' ? 'exclamation-circle' : 
                     type === 'success' ? 'check-circle' : 
                     'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to body
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    setupFilterEvents() {
        // Setup filter events after DOM is ready
        setTimeout(() => {
            // Retailer page filters
            const retailerSearch = document.getElementById('retailerSearch');
            const tierFilter = document.getElementById('tierFilter');
            const cityFilter = document.getElementById('cityFilter');
            const statusFilter = document.getElementById('statusFilter');
            
            // Phase 12: Use centralized debounce for search
            if (retailerSearch) {
                retailerSearch.addEventListener('input', () => {
                    this.debounce(() => this.loadRetailers(), 'retailerSearch', 500);
                });
            }
            if (tierFilter) {
                tierFilter.addEventListener('change', () => this.loadRetailers());
            }
            if (cityFilter) {
                cityFilter.addEventListener('change', () => this.loadRetailers());
            }
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.loadRetailers());
            }

            // Buyer page filters
            const buyerSearch = document.getElementById('buyerSearch');
            const buyerActivityFilter = document.getElementById('buyerActivityFilter');
            const buyerStatusFilter = document.getElementById('buyerStatusFilter');
            const buyerKycFilter = document.getElementById('buyerKycFilter');
            
            // Phase 12: Use centralized debounce
            if (buyerSearch) {
                buyerSearch.addEventListener('input', () => {
                    this.debounce(() => this.loadBuyers(), 'buyerSearch', 500);
                });
            }
            if (buyerActivityFilter) {
                buyerActivityFilter.addEventListener('change', () => this.loadBuyers());
            }
            if (buyerStatusFilter) {
                buyerStatusFilter.addEventListener('change', () => this.loadBuyers());
            }
            if (buyerKycFilter) {
                buyerKycFilter.addEventListener('change', () => this.loadBuyers());
            }

            // Orders page filters
            const orderSearch = document.getElementById('orderSearch');
            const orderStatusFilter = document.getElementById('orderStatusFilter');
            const paymentStatusFilter = document.getElementById('paymentStatusFilter');
            const dateRangeFilter = document.getElementById('dateRangeFilter');
            
            // Phase 12: Use centralized debounce
            if (orderSearch) {
                orderSearch.addEventListener('input', () => {
                    this.debounce(() => this.loadOrders(), 'orderSearch', 500);
                });
            }
            if (orderStatusFilter) {
                orderStatusFilter.addEventListener('change', () => this.loadOrders());
            }
            if (paymentStatusFilter) {
                paymentStatusFilter.addEventListener('change', () => this.loadOrders());
            }
            if (dateRangeFilter) {
                dateRangeFilter.addEventListener('change', () => this.loadOrders());
            }

            // Payments page filters
            const paymentSearch = document.getElementById('paymentSearch');
            const paymentStatusFilterSelect = document.getElementById('paymentStatusFilterSelect');
            const paymentMethodFilter = document.getElementById('paymentMethodFilter');
            const paymentDateRangeFilter = document.getElementById('paymentDateRangeFilter');
            
            // Phase 12: Use centralized debounce
            if (paymentSearch) {
                paymentSearch.addEventListener('input', () => {
                    this.debounce(() => this.loadPayments(), 'paymentSearch', 500);
                });
            }
            if (paymentStatusFilterSelect) {
                paymentStatusFilterSelect.addEventListener('change', () => this.loadPayments());
            }
            if (paymentMethodFilter) {
                paymentMethodFilter.addEventListener('change', () => this.loadPayments());
            }
            if (paymentDateRangeFilter) {
                paymentDateRangeFilter.addEventListener('change', () => this.loadPayments());
            }
            
            // Admin users page filters
            const adminSearch = document.getElementById('adminSearch');
            const adminRoleFilter = document.getElementById('adminRoleFilter');
            const adminStatusFilter = document.getElementById('adminStatusFilter');
            
            // Phase 12: Use centralized debounce
            if (adminSearch) {
                adminSearch.addEventListener('input', () => {
                    this.debounce(() => this.loadAdmins(), 'adminSearch', 500);
                });
            }
            if (adminRoleFilter) {
                adminRoleFilter.addEventListener('change', () => this.loadAdmins());
            }
            if (adminStatusFilter) {
                adminStatusFilter.addEventListener('change', () => this.loadAdmins());
            }
        }, 100);
    }

    filterRetailers() {
        if (!this.dummyData) return;
        
        const search = document.getElementById('retailerSearch').value.toLowerCase();
        const tier = document.getElementById('tierFilter').value;
        const city = document.getElementById('cityFilter').value;
        
        const filtered = this.dummyData.retailers.filter(r => {
            const matchSearch = r.name.toLowerCase().includes(search) || r.owner.toLowerCase().includes(search);
            const matchTier = !tier || r.tier === tier;
            const matchCity = !city || r.city === city;
            return matchSearch && matchTier && matchCity;
        });
        
        const tbody = document.getElementById('retailersTableBody');
        tbody.innerHTML = '';
        
        filtered.forEach(retailer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${retailer.name}</td>
                <td>${retailer.owner}</td>
                <td>${retailer.city}</td>
                <td>MWK ${retailer.salesMTD.toLocaleString()}</td>
                <td>${retailer.ordersMTD}</td>
                <td>${retailer.products}</td>
                <td><span class="badge ${retailer.tier}">${retailer.tier.toUpperCase()}</span></td>
                <td>
                    <button class="action-btn view" onclick="dashboard.viewRetailer('${retailer.id}')">
                        <i class="fas fa-eye"></i>
                        <span>View</span>
                    </button>
                    ${this.currentUser.role === 'super_admin' ? '<button class="action-btn edit"><i class="fas fa-edit"></i><span>Edit</span></button>' : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterOrders() {
        if (!this.dummyData) return;
        
        const search = document.getElementById('orderSearch').value.toLowerCase();
        const status = document.getElementById('deliveryStatusFilter').value;
        
        const filtered = this.dummyData.orders.filter(order => {
            const matchSearch = order.id.toLowerCase().includes(search) || order.buyer.toLowerCase().includes(search);
            const matchStatus = !status || order.deliveryStatus === status;
            return matchSearch && matchStatus;
        });
        
        this.populateOrdersTable(filtered);
    }

    populateOrdersTable(orders = null) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        
        const ordersToShow = orders || this.dummyData?.orders || [];
        tbody.innerHTML = '';
        
        ordersToShow.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.buyer}</td>
                <td>MWK ${order.amount.toLocaleString()}</td>
                <td><span class="badge ${order.payment}">${order.payment.toUpperCase()}</span></td>
                <td><span class="badge ${order.deliveryStatus}">${order.deliveryStatus.replace('-', ' ').toUpperCase()}</span></td>
                <td>${order.courier}</td>
                <td>
                    <button class="action-btn view" onclick="dashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                        <span>View</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Additional methods would go here...
    loadOrders() {
        this.populateOrdersTable();
    }

    viewOrder(id) {
        if (!this.dummyData) return;
        
        const order = this.dummyData.orders.find(o => o.id === id);
        if (!order) return;
        
        document.getElementById('modalTitle').textContent = `Order ${order.id}`;
        document.getElementById('modalBody').innerHTML = `
            <h4 style="margin-bottom: 15px; color: #000000;">Order Information</h4>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order.id}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Order Date:</div>
                <div>${order.orderedAt}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Buyer Name:</div>
                <div>${order.buyer}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Total Amount:</div>
                <div style="font-weight: 600; color: #000000;">MWK ${order.amount.toLocaleString()}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div>${order.payment.toUpperCase()}</div>
            </div>
            
            <h4 style="margin: 25px 0 15px; color: #000000;">Delivery Details</h4>
            <div class="detail-row">
                <div class="detail-label">Delivery Address:</div>
                <div>${order.deliveryAddress}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Delivery Status:</div>
                <div><span class="badge ${order.deliveryStatus}">${order.deliveryStatus.toUpperCase()}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Courier:</div>
                <div>${order.courier}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Courier Phone:</div>
                <div>${order.courierPhone}</div>
            </div>
        `;
        
        document.getElementById('detailModal').classList.add('active');
    }

    loadFees() {
        const tbody = document.getElementById('feesTableBody');
        if (!tbody || !this.dummyData) {
            console.error('Fees table body not found or no data available');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No fee data available</td></tr>';
            }
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!this.dummyData.fees || this.dummyData.fees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No fees configured</td></tr>';
            return;
        }
        
        this.dummyData.fees.forEach(fee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${fee.name}</td>
                <td>MWK ${fee.amount.toLocaleString()}</td>
                <td>${fee.lastModified}</td>
                <td>${fee.modifiedBy}</td>
                <td>
                    ${this.currentUser.role === 'super_admin' ? 
                        `<button class="action-btn edit" onclick="dashboard.editFee('${fee.id}')">
                            <i class="fas fa-edit"></i>
                            <span>Edit</span>
                        </button>` : 
                        '<span style="color: #666666;">View Only</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editFee(id) {
        if (!this.dummyData) return;
        
        const fee = this.dummyData.fees.find(f => f.id === id);
        if (!fee) return;
        
        document.getElementById('modalTitle').textContent = `Edit ${fee.name}`;
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>Fee Type</label>
                <input type="text" value="${fee.name}" disabled style="background: #F4F4F4;">
            </div>
            <div class="form-group">
                <label>Current Amount</label>
                <input type="number" id="feeAmount" value="${fee.amount}">
            </div>
            <div class="form-group">
                <label>Reason for Change</label>
                <textarea id="feeReason" rows="3" placeholder="e.g., Market adjustment, Competitor pricing"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                <button class="btn-primary" onclick="dashboard.saveFee('${fee.id}')">Save Changes</button>
            </div>
        `;
        
        document.getElementById('detailModal').classList.add('active');
    }

    saveFee(id) {
        const newAmount = document.getElementById('feeAmount').value;
        const reason = document.getElementById('feeReason').value;
        
        if (!reason) {
            alert('Please provide a reason for the fee change');
            return;
        }
        
        alert(`Fee updated successfully!\nNew Amount: MWK ${parseFloat(newAmount).toLocaleString()}`);
        this.closeModal();
        this.loadFees();
    }

    loadAdmins() {
        const tbody = document.getElementById('adminsTableBody');
        if (!tbody) {
            console.error('Admin table body not found');
            return;
        }
        
        // For admin management, we'll use the credentials data
        this.dataLoader.loadCredentials().then(credentials => {
            tbody.innerHTML = '';
            
            if (!credentials || !credentials.admins) {
                console.error('No admin data available');
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No admin data available</td></tr>';
                return;
            }
            
            credentials.admins.forEach(admin => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${admin.username}</td>
                    <td>${admin.firstName} ${admin.lastName}</td>
                    <td>${admin.email}</td>
                    <td><span class="badge ${admin.role === 'super_admin' ? 'platinum' : 'silver'}">${admin.role === 'super_admin' ? 'Super Admin' : 'Support Staff'}</span></td>
                    <td>${admin.lastLogin}</td>
                    <td><span class="badge ${admin.isActive ? 'active' : 'inactive'}">${admin.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td>
                        ${this.currentUser && this.currentUser.role === 'super_admin' && admin.id !== this.currentUser.id ? 
                            `<button class="action-btn view" onclick="dashboard.viewAdmin('${admin.id}')">
                                <i class="fas fa-eye"></i>
                                <span>View</span>
                            </button>
                            <button class="action-btn edit" onclick="dashboard.editAdmin('${admin.id}')">
                                <i class="fas fa-edit"></i>
                                <span>Edit</span>
                            </button>` : 
                            '<span style="color: #666666;">Current User</span>'}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }).catch(error => {
            console.error('Error loading admins:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d32f2f;">Error loading admin data</td></tr>';
        });
    }

    viewAdmin(id) {
        this.dataLoader.loadCredentials().then(credentials => {
            const admin = credentials.admins.find(a => a.id === id);
            if (!admin) return;
            
            document.getElementById('modalTitle').textContent = `Admin User: ${admin.username}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">Username:</div>
                    <div>${admin.username}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Full Name:</div>
                    <div>${admin.firstName} ${admin.lastName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div>${admin.email}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Role:</div>
                    <div>${admin.role === 'super_admin' ? 'Super Admin' : 'Support Staff'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Last Login:</div>
                    <div>${admin.lastLogin}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div><span class="badge ${admin.isActive ? 'active' : 'pending'}">${admin.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                </div>
            `;
            document.getElementById('detailModal').classList.add('active');
        });
    }

    editAdmin(id) {
        this.dataLoader.loadCredentials().then(credentials => {
            const admin = credentials.admins.find(a => a.id === id);
            if (!admin) return;
            
            document.getElementById('modalTitle').textContent = `Edit Admin: ${admin.username}`;
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="editUsername" value="${admin.username}" disabled style="background: #F4F4F4;">
                </div>
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="editFirstName" value="${admin.firstName}">
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="editLastName" value="${admin.lastName}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editEmail" value="${admin.email}">
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="editRole">
                        <option value="support" ${admin.role === 'support' ? 'selected' : ''}>Support Staff</option>
                        <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editStatus">
                        <option value="true" ${admin.isActive ? 'selected' : ''}>Active</option>
                        <option value="false" ${!admin.isActive ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="dashboard.saveAdminEdit('${admin.id}')">Save Changes</button>
                </div>
            `;
            document.getElementById('detailModal').classList.add('active');
        });
    }

    saveAdminEdit(id) {
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const email = document.getElementById('editEmail').value;
        const role = document.getElementById('editRole').value;
        const isActive = document.getElementById('editStatus').value === 'true';
        
        if (!firstName || !lastName || !email) {
            alert('Please fill in all required fields');
            return;
        }
        
        alert(`Admin updated successfully!\nName: ${firstName} ${lastName}\nRole: ${role === 'super_admin' ? 'Super Admin' : 'Support Staff'}\nStatus: ${isActive ? 'Active' : 'Inactive'}`);
        this.closeModal();
        this.loadAdmins();
    }

    loadBuyersChart() {
        const districtData = [
            { district: 'Lilongwe', count: 450 },
            { district: 'Blantyre', count: 380 },
            { district: 'Mzuzu', count: 220 },
            { district: 'Zomba', count: 150 },
            { district: 'Kasungu', count: 50 }
        ];
        
        const container = document.getElementById('buyersByDistrict');
        if (!container) return;
        
        container.innerHTML = '';
        
        districtData.forEach(item => {
            const maxCount = Math.max(...districtData.map(d => d.count));
            const percentage = (item.count / maxCount) * 100;
            
            const bar = document.createElement('div');
            bar.style.cssText = 'margin-bottom: 15px;';
            bar.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: 600; color: #000000;">${item.district}</span>
                    <span style="color: #666666;">${item.count} buyers</span>
                </div>
                <div style="width: 100%; background: #F4F4F4; height: 30px; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${percentage}%; background: #2952CC; height: 100%; transition: width 0.5s;"></div>
                </div>
            `;
            container.appendChild(bar);
        });
    }

    closeModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    // Add click outside to close modal functionality
    setupModalEvents() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                // Close modal if clicking on the background (not the modal content)
                if (e.target === modal) {
                    this.closeModal();
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeModal();
                }
            });
        }
    }
}

// Global functions for backward compatibility
function closeModal() {
    if (window.dashboard) {
        window.dashboard.closeModal();
    }
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    const output = document.getElementById('reportOutput');
    output.innerHTML = `
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #F4F4F4; border-radius: 8px;">
            <h3 style="margin-bottom: 20px; color: #000000;">Report Generated Successfully</h3>
            <div class="detail-row">
                <div class="detail-label">Report Type:</div>
                <div>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date Range:</div>
                <div>${startDate} to ${endDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Generated By:</div>
                <div>${window.dashboard ? window.dashboard.currentUser.firstName + ' ' + window.dashboard.currentUser.lastName : 'Admin'}</div>
            </div>
            <div style="margin-top: 30px; display: flex; gap: 10px;">
                <button style="padding: 8px 20px; background: #2952CC; color: #FFFFFF; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
                <button class="action-btn edit" style="padding: 8px 20px;">
                    <i class="fas fa-file-excel"></i> Download Excel
                </button>
                <button class="action-btn view" style="padding: 8px 20px;">
                    <i class="fas fa-file-csv"></i> Download CSV
                </button>
            </div>
        </div>
    `;
}

function showAddAdminModal() {
    document.getElementById('modalTitle').textContent = 'Add New Admin User';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label>Username</label>
            <input type="text" id="newUsername" placeholder="Enter username">
        </div>
        <div class="form-group">
            <label>First Name</label>
            <input type="text" id="newFirstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label>Last Name</label>
            <input type="text" id="newLastName" placeholder="Enter last name">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" id="newEmail" placeholder="Enter email address">
        </div>
        <div class="form-group">
            <label>Role</label>
            <select id="newRole">
                <option value="support">Support Staff</option>
                <option value="super_admin">Super Admin</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveNewAdmin()">Create Admin</button>
        </div>
    `;
    document.getElementById('detailModal').classList.add('active');
}

function saveNewAdmin() {
    const username = document.getElementById('newUsername').value;
    const firstName = document.getElementById('newFirstName').value;
    const lastName = document.getElementById('newLastName').value;
    const email = document.getElementById('newEmail').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !firstName || !lastName || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    alert(`Admin user created successfully!\nUsername: ${username}\nRole: ${role === 'super_admin' ? 'Super Admin' : 'Support Staff'}`);
    closeModal();
    if (window.dashboard) {
        window.dashboard.loadAdmins();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new NyengoDashboard();
});

// Global function to show a specific page (used by View All links, etc.)
function showPage(pageName) {
    // Find the nav item for this page
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) {
        navItem.click(); // Trigger the navigation
    }
}
// Global function to close admin modal
function closeAdminModal() {
    if (window.dashboard) {
        window.dashboard.closeAdminModal();
    }
}

// Global function to close admin details modal
function closeAdminDetailsModal() {
    const modal = document.getElementById('adminDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Phase 12: Global utility functions for security monitoring
window.viewSecurityLogs = function() {
    if (window.dashboard) {
        return window.dashboard.api.getSecurityLogs(50);
    }
    return [];
};

window.getCacheStats = function() {
    if (window.dashboard) {
        const cacheSize = window.dashboard.api.requestCache.size;
        const rateLimitSize = window.dashboard.api.rateLimitMap.size;
        const logSize = window.dashboard.api.securityLog.length;
        
        const stats = {
            cacheEntries: cacheSize,
            rateLimitTrackers: rateLimitSize,
            securityLogEntries: logSize
        };
        
        console.log('📊 Security & Cache Statistics:', stats);
        return stats;
    }
    return null;
};

window.clearAllCaches = function() {
    if (window.dashboard) {
        window.dashboard.api.clearCache();
        console.log('🗑️ All caches cleared');
        return true;
    }
    return false;
};
