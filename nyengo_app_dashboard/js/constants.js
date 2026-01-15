// API Configuration Constants
const API_CONFIG = {
    BASE_URL: 'https://nyengo.zoozambia.tech/api',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
};

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me'
    },
    
    // Admin - Users
    ADMIN_USERS: {
        LIST: '/admin/users',
        DETAIL: (id) => `/admin/users/${id}`,
        UPDATE: (id) => `/admin/users/${id}`,
        UPDATE_STATUS: (id) => `/admin/users/${id}/status`,
        DELETE: (id) => `/admin/users/${id}`,
        ACTIVITY: (id) => `/admin/users/${id}/activity`
    },
    
    // Admin - KYC
    ADMIN_KYC: {
        PENDING: '/admin/kyc/pending',
        DETAIL: (userId) => `/admin/kyc/${userId}`,
        APPROVE: (userId) => `/admin/kyc/${userId}/approve`,
        REJECT: (userId) => `/admin/kyc/${userId}/reject`
    },
    
    // Admin - Businesses
    ADMIN_BUSINESSES: {
        LIST: '/admin/businesses',
        DETAIL: (id) => `/admin/businesses/${id}`,
        UPDATE: (id) => `/admin/businesses/${id}`,
        UPDATE_STATUS: (id) => `/admin/businesses/${id}/status`,
        COMPLIANCE_DOCS: (id) => `/admin/businesses/${id}/compliance-documents`,
        VERIFY: (id) => `/admin/businesses/${id}/verify`,
        REVENUE: (id) => `/admin/businesses/${id}/revenue`,
        ORDERS: (id) => `/admin/businesses/${id}/orders`
    },
    
    // Admin - Subscriptions
    ADMIN_SUBSCRIPTIONS: {
        LIST: '/admin/subscriptions',
        DETAIL: (businessId) => `/admin/subscriptions/${businessId}`,
        UPDATE: (businessId) => `/admin/subscriptions/${businessId}`,
        EXTEND: (businessId) => `/admin/subscriptions/${businessId}/extend`
    },
    
    // Admin - Products
    ADMIN_PRODUCTS: {
        LIST: '/admin/products',
        DETAIL: (id) => `/admin/products/${id}`,
        UPDATE_STATUS: (id) => `/admin/products/${id}/status`,
        DELETE: (id) => `/admin/products/${id}`,
        FLAGGED: '/admin/products/flagged',
        FLAG: (id) => `/admin/products/${id}/flag`
    },
    
    // Admin - Orders
    ADMIN_ORDERS: {
        LIST: '/admin/orders',
        DETAIL: (id) => `/admin/orders/${id}`,
        UPDATE_STATUS: (id) => `/admin/orders/${id}/status`,
        CANCEL: (id) => `/admin/orders/${id}/cancel`,
        REFUND: (id) => `/admin/orders/${id}/refund`,
        DISPUTES: '/admin/orders/disputes',
        RESOLVE_DISPUTE: (id) => `/admin/orders/${id}/resolve-dispute`,
        STATISTICS: '/admin/orders/statistics',
        REVENUE: '/admin/orders/revenue',
        TOP_SELLERS: '/admin/orders/top-sellers'
    },
    
    // Admin - Payments
    ADMIN_PAYMENTS: {
        LIST: '/admin/payments',
        DETAIL: (id) => `/admin/payments/${id}`,
        VERIFY: (id) => `/admin/payments/${id}/verify`,
        REFUND: (id) => `/admin/payments/${id}/refund`,
        PENDING: '/admin/payments/pending'
    },
    
    // Admin - Payouts
    ADMIN_PAYOUTS: {
        LIST: '/admin/payouts',
        DETAIL: (id) => `/admin/payouts/${id}`,
        APPROVE: (id) => `/admin/payouts/${id}/approve`,
        REJECT: (id) => `/admin/payouts/${id}/reject`,
        COMPLETE: (id) => `/admin/payouts/${id}/complete`,
        PENDING: '/admin/payouts/pending'
    },
    
    // Admin - Financial
    ADMIN_FINANCIAL: {
        REVENUE: '/admin/financial/revenue',
        COMMISSION: '/admin/financial/commission',
        TRANSACTIONS: '/admin/financial/transactions',
        EXPORT: '/admin/financial/export'
    },
    
    // Admin - Couriers
    ADMIN_COURIERS: {
        LIST: '/admin/couriers',
        DETAIL: (id) => `/admin/couriers/${id}`,
        UPDATE_STATUS: (id) => `/admin/couriers/${id}/status`,
        DELIVERIES: (id) => `/admin/couriers/${id}/deliveries`,
        PERFORMANCE: (id) => `/admin/couriers/${id}/performance`,
        VERIFY: (id) => `/admin/couriers/${id}/verify`
    },
    
    // Admin - Settings
    ADMIN_SETTINGS: {
        GET: '/admin/settings',
        UPDATE: '/admin/settings',
        FEES: '/admin/settings/fees',
        UPDATE_FEES: '/admin/settings/fees',
        COMMISSION: '/admin/settings/commission',
        UPDATE_COMMISSION: '/admin/settings/commission'
    },
    
    // Admin - Admin Staff Management
    ADMIN_STAFF: {
        LIST: '/admin/staff',
        CREATE: '/admin/staff',
        DETAIL: (id) => `/admin/staff/${id}`,
        UPDATE: (id) => `/admin/staff/${id}`,
        DELETE: (id) => `/admin/staff/${id}`,
        UPDATE_STATUS: (id) => `/admin/staff/${id}/status`,
        ACTIVITY_LOG: (id) => `/admin/staff/${id}/activity`,
        RESET_PASSWORD: (id) => `/admin/staff/${id}/reset-password`
    },

    // Admin - Categories
    ADMIN_CATEGORIES: {
        LIST: '/admin/categories',
        CREATE: '/admin/categories',
        UPDATE: (id) => `/admin/categories/${id}`,
        DELETE: (id) => `/admin/categories/${id}`,
        ANALYTICS: (id) => `/admin/categories/${id}/analytics`
    },

    // Admin - Delivery Companies
    ADMIN_DELIVERY_COMPANIES: {
        LIST: '/admin/delivery-companies',
        CREATE: '/admin/delivery-companies',
        UPDATE: (id) => `/admin/delivery-companies/${id}`,
        DELETE: (id) => `/admin/delivery-companies/${id}`
    },

    // Admin - Reviews & Ratings
    ADMIN_REVIEWS: {
        LIST: '/admin/reviews',
        FLAGGED: '/admin/reviews/flagged',
        DETAIL: (id) => `/admin/reviews/${id}`,
        DELETE: (id) => `/admin/reviews/${id}`,
        FLAG: (id) => `/admin/reviews/${id}/flag`,
        UPDATE_STATUS: (id) => `/admin/reviews/${id}/status`
    },

    // Admin - Support Tickets
    ADMIN_SUPPORT_TICKETS: {
        LIST: '/admin/support/tickets',
        DETAIL: (id) => `/admin/support/tickets/${id}`,
        REPLY: (id) => `/admin/support/tickets/${id}/reply`,
        UPDATE_STATUS: (id) => `/admin/support/tickets/${id}/status`,
        ASSIGN: (id) => `/admin/support/tickets/${id}/assign`,
        PRIORITY: (id) => `/admin/support/tickets/${id}/priority`,
        ESCALATE: (id) => `/admin/support/tickets/${id}/escalate`,
        STATISTICS: '/admin/support/tickets/statistics'
    },
    ADMIN_SUPPORT_CATEGORIES: {
        LIST: '/admin/support/categories',
        CREATE: '/admin/support/categories',
        UPDATE: (id) => `/admin/support/categories/${id}`,
        DELETE: (id) => `/admin/support/categories/${id}`
    },
    ADMIN_SUPPORT_CANNED_RESPONSES: {
        LIST: '/admin/support/canned-responses',
        CREATE: '/admin/support/canned-responses',
        UPDATE: (id) => `/admin/support/canned-responses/${id}`,
        DELETE: (id) => `/admin/support/canned-responses/${id}`
    },

    // Admin - Messaging & Chat Moderation
    ADMIN_MESSAGES: {
        THREADS: '/admin/messages/threads',
        THREAD_DETAIL: (id) => `/admin/messages/threads/${id}`,
        FLAGGED: '/admin/messages/flagged',
        DELETE: (id) => `/admin/messages/${id}`,
        WARN: (threadId) => `/admin/messages/${threadId}/warn`
    },

    // Admin - Notifications
    ADMIN_NOTIFICATIONS: {
        BROADCAST: '/admin/notifications/broadcast',
        TARGETED: '/admin/notifications/targeted',
        HISTORY: '/admin/notifications/history',
        ANALYTICS: '/admin/notifications/analytics'
    },
    ADMIN_SMS: {
        HISTORY: '/admin/sms/history',
        BALANCE: '/admin/sms/balance',
        SEND: '/admin/sms/send'
    },

    // Admin - Banners
    ADMIN_BANNERS: {
        LIST: '/admin/banners',
        CREATE: '/admin/banners',
        UPDATE: (id) => `/admin/banners/${id}`,
        DELETE: (id) => `/admin/banners/${id}`,
        ACTIVATE: (id) => `/admin/banners/${id}/activate`
    },

    // Admin - Analytics & Reports
    ADMIN_DASHBOARD: {
        OVERVIEW: '/admin/dashboard/overview',
        TRENDS: '/admin/dashboard/trends',
        ALERTS: '/admin/dashboard/alerts'
    },
    ADMIN_REPORTS: {
        SALES: '/admin/reports/sales',
        USERS: '/admin/reports/users',
        PRODUCTS: '/admin/reports/products',
        REVENUE: '/admin/reports/revenue',
        EXPORT: '/admin/reports/export'
    },
    ADMIN_ANALYTICS: {
        TRAFFIC: '/admin/analytics/traffic',
        CONVERSION: '/admin/analytics/conversion',
        POPULAR_PRODUCTS: '/admin/analytics/popular-products',
        POPULAR_CATEGORIES: '/admin/analytics/popular-categories'
    },

    // Admin - Audit Logs & Security
    ADMIN_AUDIT_LOGS: {
        LIST: '/admin/audit-logs',
        DETAIL: (id) => `/admin/audit-logs/${id}`,
        EXPORT: '/admin/audit-logs/export'
    },
    ADMIN_SECURITY: {
        SUSPICIOUS_ACTIVITY: '/admin/security/suspicious-activity',
        BAN_IP: '/admin/security/ban-ip',
        BANNED_IPS: '/admin/security/banned-ips',
        REMOVE_BAN: (ip) => `/admin/security/ban-ip/${ip}`,
        FAILED_LOGINS: '/admin/security/failed-logins'
    },

    // Admin - Roles & Permissions
    ADMIN_ROLES: {
        LIST: '/admin/roles',
        CREATE: '/admin/roles',
        UPDATE: (id) => `/admin/roles/${id}`,
        DELETE: (id) => `/admin/roles/${id}`
    },

    // Admin - Compliance & Moderation
    ADMIN_FLAGGED: {
        PRODUCTS: '/admin/flagged/products',
        REVIEWS: '/admin/flagged/reviews',
        MESSAGES: '/admin/flagged/messages',
        REVIEW_FLAGGED: (type, id) => `/admin/flagged/${type}/${id}/review`,
        ACTION: (type, id) => `/admin/flagged/${type}/${id}/action`
    },
    ADMIN_COMPLIANCE: {
        TPIN: '/admin/compliance/tpin',
        DOCUMENTS: (businessId) => `/admin/compliance/documents/${businessId}`,
        VERIFY: (businessId) => `/admin/compliance/${businessId}/verify`
    },

    // Webhooks
    WEBHOOKS: {
        PAYMENT_AIRTEL: '/webhooks/payment/airtel',
        PAYMENT_MPAMBA: '/webhooks/payment/mpamba',
        PAYMENT_BANK: '/webhooks/payment/bank',
        SMS_DELIVERY_STATUS: '/webhooks/sms/delivery-status',
        EMAIL_STATUS: '/webhooks/email/status'
    },
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Error Messages
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNAUTHORIZED: 'Your session has expired. Please login again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'An error occurred on the server. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Storage Keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'nyengo_token',
    USER_DATA: 'nyengo_user',
    REFRESH_TOKEN: 'nyengo_refresh_token'
};

// User Roles
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    SUPPORT_STAFF: 'support_staff',
    ADMIN: 'admin',
    SELLER: 'seller',
    BUYER: 'buyer',
    COURIER: 'courier'
};

// Export to window for global access
window.API_CONFIG = API_CONFIG;
window.API_ENDPOINTS = API_ENDPOINTS;
window.HTTP_STATUS = HTTP_STATUS;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.STORAGE_KEYS = STORAGE_KEYS;
window.USER_ROLES = USER_ROLES;
