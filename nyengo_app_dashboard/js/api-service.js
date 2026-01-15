// API Service - Centralized HTTP Client for Nyengo Dashboard
class APIService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = API_CONFIG.RETRY_DELAY;
        
        // Phase 12: Security enhancements
        this.requestCache = new Map();
        this.rateLimitMap = new Map();
        this.requestLog = [];
        this.maxRequestsPerMinute = 60;
        this.cacheDefaultTTL = 5 * 60 * 1000; // 5 minutes
        this.securityLog = [];
        this.maxLogEntries = 100;
    }

    /**
     * Phase 12: Rate limiting check
     * Prevents excessive API calls to protect backend
     */
    checkRateLimit(endpoint) {
        const now = Date.now();
        const key = `rate_${endpoint}`;
        
        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, []);
        }
        
        const requests = this.rateLimitMap.get(key);
        
        // Remove requests older than 1 minute
        const recentRequests = requests.filter(time => now - time < 60000);
        
        if (recentRequests.length >= this.maxRequestsPerMinute) {
            this.logSecurity('RATE_LIMIT_EXCEEDED', { endpoint, count: recentRequests.length });
            throw new Error(`Rate limit exceeded for ${endpoint}. Please try again in a moment.`);
        }
        
        // Add current request
        recentRequests.push(now);
        this.rateLimitMap.set(key, recentRequests);
        
        return true;
    }

    /**
     * Phase 12: Request caching with TTL
     * Reduces unnecessary API calls for frequently accessed data
     */
    getCachedResponse(cacheKey) {
        const cached = this.requestCache.get(cacheKey);
        
        if (!cached) {
            return null;
        }
        
        // Check if cache expired
        if (Date.now() > cached.expiry) {
            this.requestCache.delete(cacheKey);
            return null;
        }
        
        this.logSecurity('CACHE_HIT', { key: cacheKey });
        return cached.data;
    }

    /**
     * Phase 12: Cache response with TTL
     */
    cacheResponse(cacheKey, data, ttl = this.cacheDefaultTTL) {
        this.requestCache.set(cacheKey, {
            data,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        });
        
        // Prevent cache from growing too large
        if (this.requestCache.size > 50) {
            const oldestKey = Array.from(this.requestCache.keys())[0];
            this.requestCache.delete(oldestKey);
        }
    }

    /**
     * Phase 12: Clear specific cache or all cache
     */
    clearCache(pattern = null) {
        if (!pattern) {
            this.requestCache.clear();
            this.logSecurity('CACHE_CLEARED', { all: true });
            return;
        }
        
        // Clear matching cache entries
        let cleared = 0;
        for (const key of this.requestCache.keys()) {
            if (key.includes(pattern)) {
                this.requestCache.delete(key);
                cleared++;
            }
        }
        
        this.logSecurity('CACHE_CLEARED', { pattern, count: cleared });
    }

    /**
     * Phase 12: Input sanitization
     * Prevents XSS attacks by sanitizing user input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Phase 12: Deep sanitize object
     * Recursively sanitizes all string values in an object
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string') {
                    sanitized[key] = this.sanitizeInput(value);
                } else if (typeof value === 'object') {
                    sanitized[key] = this.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
        }
        
        return sanitized;
    }

    /**
     * Phase 12: Security logging
     * Tracks security events for monitoring
     */
    logSecurity(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details,
            userAgent: navigator.userAgent
        };
        
        this.securityLog.push(logEntry);
        
        // Keep log size manageable
        if (this.securityLog.length > this.maxLogEntries) {
            this.securityLog.shift();
        }
        
        // Log critical events to console in development
        if (event.includes('EXCEEDED') || event.includes('BLOCKED')) {
            console.warn('[Security]', event, details);
        }
    }

    /**
     * Phase 12: Get security logs
     */
    getSecurityLogs(limit = 20) {
        return this.securityLog.slice(-limit);
    }

    /**
     * Phase 12: Token security check
     * Validates token format and expiry
     */
    validateToken(token) {
        if (!token) {
            return false;
        }
        
        try {
            // JWT format: header.payload.signature
            const parts = token.split('.');
            if (parts.length !== 3) {
                this.logSecurity('INVALID_TOKEN_FORMAT', { reason: 'Not 3 parts' });
                return false;
            }
            
            // Decode payload (base64)
            const payload = JSON.parse(atob(parts[1]));
            
            // Check expiry
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                this.logSecurity('TOKEN_EXPIRED', { exp: payload.exp });
                return false;
            }
            
            return true;
        } catch (error) {
            this.logSecurity('TOKEN_VALIDATION_ERROR', { error: error.message });
            return false;
        }
    }

    /**
     * Get authorization headers with JWT token
     */
    getHeaders(isFormData = false) {
        const headers = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        // Add JWT token if available
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Get stored JWT token
     */
    getToken() {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || 
                     localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        // Phase 12: Validate token before using
        if (token && !this.validateToken(token)) {
            this.clearToken();
            return null;
        }
        
        return token;
    }

    /**
     * Store JWT token
     */
    setToken(token, remember = false) {
        if (remember) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        }
    }

    /**
     * Clear stored token
     */
    clearToken() {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }

    /**
     * Make HTTP request with timeout and retry logic
     */
    async makeRequest(url, options = {}, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            // Handle abort (timeout)
            if (error.name === 'AbortError') {
                throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
            }

            // Retry logic for network errors
            if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.makeRequest(url, options, retryCount + 1);
            }

            // Network error
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
            }

            throw error;
        }
    }

    /**
     * Handle error responses
     */
    async handleErrorResponse(response) {
        let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
        let errorData = null;

        try {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
            // Response is not JSON
        }

        switch (response.status) {
            case HTTP_STATUS.UNAUTHORIZED:
                this.handleUnauthorized();
                throw new Error(errorData?.message || ERROR_MESSAGES.UNAUTHORIZED);
            
            case HTTP_STATUS.FORBIDDEN:
                throw new Error(errorData?.message || ERROR_MESSAGES.FORBIDDEN);
            
            case HTTP_STATUS.NOT_FOUND:
                throw new Error(errorData?.message || ERROR_MESSAGES.NOT_FOUND);
            
            case HTTP_STATUS.BAD_REQUEST:
                throw new Error(errorData?.message || ERROR_MESSAGES.VALIDATION_ERROR);
            
            case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            case HTTP_STATUS.SERVICE_UNAVAILABLE:
                throw new Error(errorData?.message || ERROR_MESSAGES.SERVER_ERROR);
            
            default:
                throw new Error(errorMessage);
        }
    }

    /**
     * Handle unauthorized access (token expired)
     */
    handleUnauthorized() {
        this.clearToken();
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html?session=expired';
        }
    }

    /**
     * Check if error should trigger retry
     */
    shouldRetry(error) {
        // Retry on network errors, not on application errors
        return error.message.includes('Failed to fetch') || 
               error.name === 'TypeError' ||
               error.name === 'AbortError';
    }

    /**
     * Delay utility for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Build URL with query parameters
     */
    buildURL(endpoint, params = {}) {
        const url = new URL(this.baseURL + endpoint);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return url.toString();
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}, options = {}) {
        // Phase 12: Check rate limit
        this.checkRateLimit(endpoint);
        
        // Phase 12: Check cache (if enabled)
        const cacheKey = `GET_${endpoint}_${JSON.stringify(params)}`;
        if (options.cache !== false) {
            const cached = this.getCachedResponse(cacheKey);
            if (cached) {
                return cached;
            }
        }
        
        const url = this.buildURL(endpoint, params);
        const requestOptions = {
            method: 'GET',
            headers: this.getHeaders()
        };

        const response = await this.makeRequest(url, requestOptions);
        const data = await response.json();
        
        // Phase 12: Cache response (if enabled)
        if (options.cache !== false) {
            const ttl = options.cacheTTL || this.cacheDefaultTTL;
            this.cacheResponse(cacheKey, data, ttl);
        }
        
        return data;
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}, isFormData = false) {
        // Phase 12: Check rate limit
        this.checkRateLimit(endpoint);
        
        // Phase 12: Sanitize input (except for FormData)
        const sanitizedData = isFormData ? data : this.sanitizeObject(data);
        
        const url = this.baseURL + endpoint;
        const options = {
            method: 'POST',
            headers: this.getHeaders(isFormData),
            body: isFormData ? sanitizedData : JSON.stringify(sanitizedData)
        };

        const response = await this.makeRequest(url, options);
        
        // Handle 204 No Content
        if (response.status === HTTP_STATUS.NO_CONTENT) {
            return { success: true };
        }
        
        // Phase 12: Clear relevant cache after mutation
        this.clearCache(endpoint.split('/')[0]);
        
        return response.json();
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}, isFormData = false) {
        // Phase 12: Check rate limit
        this.checkRateLimit(endpoint);
        
        // Phase 12: Sanitize input
        const sanitizedData = isFormData ? data : this.sanitizeObject(data);
        
        const url = this.baseURL + endpoint;
        const options = {
            method: 'PUT',
            headers: this.getHeaders(isFormData),
            body: isFormData ? sanitizedData : JSON.stringify(sanitizedData)
        };

        const response = await this.makeRequest(url, options);
        
        // Handle 204 No Content
        if (response.status === HTTP_STATUS.NO_CONTENT) {
            // Phase 12: Clear relevant cache
            this.clearCache(endpoint.split('/')[0]);
            return { success: true };
        }
        
        // Phase 12: Clear relevant cache
        this.clearCache(endpoint.split('/')[0]);
        
        return response.json();
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        // Phase 12: Check rate limit
        this.checkRateLimit(endpoint);
        
        const url = this.baseURL + endpoint;
        const options = {
            method: 'DELETE',
            headers: this.getHeaders()
        };

        const response = await this.makeRequest(url, options);
        
        // Handle 204 No Content
        if (response.status === HTTP_STATUS.NO_CONTENT) {
            // Phase 12: Clear relevant cache
            this.clearCache(endpoint.split('/')[0]);
            return { success: true };
        }
        
        // Phase 12: Clear relevant cache
        this.clearCache(endpoint.split('/')[0]);
        
        return response.json();
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data = {}) {
        // Phase 12: Check rate limit
        this.checkRateLimit(endpoint);
        
        // Phase 12: Sanitize input
        const sanitizedData = this.sanitizeObject(data);
        
        const url = this.baseURL + endpoint;
        const options = {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(sanitizedData)
        };

        const response = await this.makeRequest(url, options);
        
        // Handle 204 No Content
        if (response.status === HTTP_STATUS.NO_CONTENT) {
            // Phase 12: Clear relevant cache
            this.clearCache(endpoint.split('/')[0]);
            return { success: true };
        }
        
        // Phase 12: Clear relevant cache
        this.clearCache(endpoint.split('/')[0]);
        
        return response.json();
    }

    /**
     * Upload file
     */
    async uploadFile(endpoint, formData) {
        return this.post(endpoint, formData, true);
    }

    /**
     * Download file
     */
    async downloadFile(endpoint, filename) {
        const url = this.baseURL + endpoint;
        const options = {
            method: 'GET',
            headers: this.getHeaders()
        };

        const response = await this.makeRequest(url, options);
        const blob = await response.blob();
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    }

    // -------------------
    // Admin - Categories
    // -------------------
    async getCategories(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_CATEGORIES.LIST, params);
    }
    async createCategory(data) {
        return this.post(API_ENDPOINTS.ADMIN_CATEGORIES.CREATE, data);
    }
    async updateCategory(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_CATEGORIES.UPDATE(id), data);
    }
    async deleteCategory(id) {
        return this.delete(API_ENDPOINTS.ADMIN_CATEGORIES.DELETE(id));
    }
    async getCategoryAnalytics(id) {
        return this.get(API_ENDPOINTS.ADMIN_CATEGORIES.ANALYTICS(id));
    }

    // -----------------------------
    // Admin - Delivery Companies
    // -----------------------------
    async getDeliveryCompanies(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_DELIVERY_COMPANIES.LIST, params);
    }
    async createDeliveryCompany(data) {
        return this.post(API_ENDPOINTS.ADMIN_DELIVERY_COMPANIES.CREATE, data);
    }
    async updateDeliveryCompany(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_DELIVERY_COMPANIES.UPDATE(id), data);
    }
    async deleteDeliveryCompany(id) {
        return this.delete(API_ENDPOINTS.ADMIN_DELIVERY_COMPANIES.DELETE(id));
    }

    // -------------------
    // Admin - Reviews
    // -------------------
    async getReviews(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REVIEWS.LIST, params);
    }
    async getFlaggedReviews(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REVIEWS.FLAGGED, params);
    }
    async getReview(id) {
        return this.get(API_ENDPOINTS.ADMIN_REVIEWS.DETAIL(id));
    }
    async deleteReview(id) {
        return this.delete(API_ENDPOINTS.ADMIN_REVIEWS.DELETE(id));
    }
    async flagReview(id, data = {}) {
        return this.post(API_ENDPOINTS.ADMIN_REVIEWS.FLAG(id), data);
    }
    async updateReviewStatus(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_REVIEWS.UPDATE_STATUS(id), data);
    }

    // -------------------
    // Admin - Support Tickets
    // -------------------
    async getSupportTickets(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.LIST, params);
    }
    async getSupportTicket(id) {
        return this.get(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.DETAIL(id));
    }
    async replySupportTicket(id, data) {
        return this.post(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.REPLY(id), data);
    }
    async updateSupportTicketStatus(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.UPDATE_STATUS(id), data);
    }
    async assignSupportTicket(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.ASSIGN(id), data);
    }
    async setSupportTicketPriority(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.PRIORITY(id), data);
    }
    async escalateSupportTicket(id, data) {
        return this.post(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.ESCALATE(id), data);
    }
    async getSupportTicketStatistics() {
        return this.get(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS.STATISTICS);
    }
    // Support Categories
    async getSupportCategories() {
        return this.get(API_ENDPOINTS.ADMIN_SUPPORT_CATEGORIES.LIST);
    }
    async createSupportCategory(data) {
        return this.post(API_ENDPOINTS.ADMIN_SUPPORT_CATEGORIES.CREATE, data);
    }
    async updateSupportCategory(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_SUPPORT_CATEGORIES.UPDATE(id), data);
    }
    async deleteSupportCategory(id) {
        return this.delete(API_ENDPOINTS.ADMIN_SUPPORT_CATEGORIES.DELETE(id));
    }
    // Canned Responses
    async getCannedResponses() {
        return this.get(API_ENDPOINTS.ADMIN_SUPPORT_CANNED_RESPONSES.LIST);
    }
    async createCannedResponse(data) {
        return this.post(API_ENDPOINTS.ADMIN_SUPPORT_CANNED_RESPONSES.CREATE, data);
    }
    async updateCannedResponse(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_SUPPORT_CANNED_RESPONSES.UPDATE(id), data);
    }
    async deleteCannedResponse(id) {
        return this.delete(API_ENDPOINTS.ADMIN_SUPPORT_CANNED_RESPONSES.DELETE(id));
    }

    // -------------------
    // Admin - Messaging
    // -------------------
    async getMessageThreads(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_MESSAGES.THREADS, params);
    }
    async getMessageThread(id) {
        return this.get(API_ENDPOINTS.ADMIN_MESSAGES.THREAD_DETAIL(id));
    }
    async getFlaggedMessages(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_MESSAGES.FLAGGED, params);
    }
    async deleteMessage(id) {
        return this.delete(API_ENDPOINTS.ADMIN_MESSAGES.DELETE(id));
    }
    async warnMessageThread(threadId, data = {}) {
        return this.post(API_ENDPOINTS.ADMIN_MESSAGES.WARN(threadId), data);
    }

    // -------------------
    // Admin - Notifications
    // -------------------
    async sendBroadcastNotification(data) {
        return this.post(API_ENDPOINTS.ADMIN_NOTIFICATIONS.BROADCAST, data);
    }
    async sendTargetedNotification(data) {
        return this.post(API_ENDPOINTS.ADMIN_NOTIFICATIONS.TARGETED, data);
    }
    async getNotificationHistory(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS.HISTORY, params);
    }
    async getNotificationAnalytics(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS.ANALYTICS, params);
    }
    // SMS
    async getSMSHistory(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_SMS.HISTORY, params);
    }
    async getSMSBalance() {
        return this.get(API_ENDPOINTS.ADMIN_SMS.BALANCE);
    }
    async sendSMS(data) {
        return this.post(API_ENDPOINTS.ADMIN_SMS.SEND, data);
    }

    // -------------------
    // Admin - Banners
    // -------------------
    async getBanners(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_BANNERS.LIST, params);
    }
    async createBanner(data) {
        return this.post(API_ENDPOINTS.ADMIN_BANNERS.CREATE, data);
    }
    async updateBanner(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_BANNERS.UPDATE(id), data);
    }
    async deleteBanner(id) {
        return this.delete(API_ENDPOINTS.ADMIN_BANNERS.DELETE(id));
    }
    async activateBanner(id, data = {}) {
        return this.put(API_ENDPOINTS.ADMIN_BANNERS.ACTIVATE(id), data);
    }

    // -------------------
    // Admin - Analytics & Reports
    // -------------------
    async getDashboardOverview(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_DASHBOARD.OVERVIEW, params);
    }
    async getDashboardTrends(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_DASHBOARD.TRENDS, params);
    }
    async getDashboardAlerts(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_DASHBOARD.ALERTS, params);
    }
    async getSalesReport(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REPORTS.SALES, params);
    }
    async getUserReport(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REPORTS.USERS, params);
    }
    async getProductReport(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REPORTS.PRODUCTS, params);
    }
    async getRevenueReport(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REPORTS.REVENUE, params);
    }
    async exportReport(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_REPORTS.EXPORT, params);
    }
    async getTrafficAnalytics(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_ANALYTICS.TRAFFIC, params);
    }
    async getConversionAnalytics(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_ANALYTICS.CONVERSION, params);
    }
    async getPopularProductsAnalytics(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_ANALYTICS.POPULAR_PRODUCTS, params);
    }
    async getPopularCategoriesAnalytics(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_ANALYTICS.POPULAR_CATEGORIES, params);
    }

    // -------------------
    // Admin - Audit Logs & Security
    // -------------------
    async getAuditLogs(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_AUDIT_LOGS.LIST, params);
    }
    async getAuditLogDetail(id) {
        return this.get(API_ENDPOINTS.ADMIN_AUDIT_LOGS.DETAIL(id));
    }
    async exportAuditLogs(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_AUDIT_LOGS.EXPORT, params);
    }
    async getSuspiciousActivity(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_SECURITY.SUSPICIOUS_ACTIVITY, params);
    }
    async banIP(data) {
        return this.post(API_ENDPOINTS.ADMIN_SECURITY.BAN_IP, data);
    }
    async getBannedIPs(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_SECURITY.BANNED_IPS, params);
    }
    async removeIPBan(ip) {
        return this.delete(API_ENDPOINTS.ADMIN_SECURITY.REMOVE_BAN(ip));
    }
    async getFailedLogins(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_SECURITY.FAILED_LOGINS, params);
    }

    // -------------------
    // Admin - Roles & Permissions
    // -------------------
    async getRoles(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_ROLES.LIST, params);
    }
    async createRole(data) {
        return this.post(API_ENDPOINTS.ADMIN_ROLES.CREATE, data);
    }
    async updateRole(id, data) {
        return this.put(API_ENDPOINTS.ADMIN_ROLES.UPDATE(id), data);
    }
    async deleteRole(id) {
        return this.delete(API_ENDPOINTS.ADMIN_ROLES.DELETE(id));
    }

    // -------------------
    // Admin - Compliance & Moderation
    // -------------------
    async getFlaggedProducts(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_FLAGGED.PRODUCTS, params);
    }
    async getFlaggedReviews(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_FLAGGED.REVIEWS, params);
    }
    async getFlaggedMessages(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_FLAGGED.MESSAGES, params);
    }
    async reviewFlaggedContent(type, id, data = {}) {
        return this.post(API_ENDPOINTS.ADMIN_FLAGGED.REVIEW_FLAGGED(type, id), data);
    }
    async actionFlaggedContent(type, id, data = {}) {
        return this.post(API_ENDPOINTS.ADMIN_FLAGGED.ACTION(type, id), data);
    }
    async getTPINCompliance(params = {}) {
        return this.get(API_ENDPOINTS.ADMIN_COMPLIANCE.TPIN, params);
    }
    async getComplianceDocuments(businessId) {
        return this.get(API_ENDPOINTS.ADMIN_COMPLIANCE.DOCUMENTS(businessId));
    }
    async verifyCompliance(businessId, data = {}) {
        return this.post(API_ENDPOINTS.ADMIN_COMPLIANCE.VERIFY(businessId), data);
    }

    // -------------------
    // Webhooks
    // -------------------
    async webhookPaymentAirtel(data) {
        return this.post(API_ENDPOINTS.WEBHOOKS.PAYMENT_AIRTEL, data);
    }
    async webhookPaymentMpamba(data) {
        return this.post(API_ENDPOINTS.WEBHOOKS.PAYMENT_MPAMBA, data);
    }
    async webhookPaymentBank(data) {
        return this.post(API_ENDPOINTS.WEBHOOKS.PAYMENT_BANK, data);
    }
    async webhookSMSDeliveryStatus(data) {
        return this.post(API_ENDPOINTS.WEBHOOKS.SMS_DELIVERY_STATUS, data);
    }
    async webhookEmailStatus(data) {
        return this.post(API_ENDPOINTS.WEBHOOKS.EMAIL_STATUS, data);
    }
}

// Create global instance
window.apiService = new APIService();
