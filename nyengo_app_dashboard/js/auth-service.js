// Authentication Service for Nyengo Dashboard
class AuthService {
    constructor() {
        this.api = window.apiService;
    }

    /**
     * Login user with email and password
     */
    async login(email, password, rememberMe = false) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, {
                email,
                password
            });

            // Store token and user data
            if (response.token) {
                this.api.setToken(response.token, rememberMe);
                this.storeUserData(response.user, rememberMe);
            }

            return {
                success: true,
                user: response.user,
                token: response.token
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.REGISTER, userData);

            // Store token and user data if registration returns them
            if (response.token) {
                this.api.setToken(response.token);
                this.storeUserData(response.user);
            }

            return {
                success: true,
                user: response.user,
                token: response.token
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify current token and get user data
     */
    async verifyToken() {
        try {
            const response = await this.api.get(API_ENDPOINTS.AUTH.ME);

            // Update stored user data
            this.storeUserData(response.user || response.data);

            return {
                success: true,
                user: response.user || response.data
            };
        } catch (error) {
            // Token is invalid or expired
            this.logout();
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.api.clearToken();
        
        // Redirect to login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Store user data in storage
     */
    storeUserData(user, persist = false) {
        const userData = JSON.stringify(user);
        
        if (persist) {
            localStorage.setItem(STORAGE_KEYS.USER_DATA, userData);
        } else {
            sessionStorage.setItem(STORAGE_KEYS.USER_DATA, userData);
        }
    }

    /**
     * Get stored user data
     */
    getUserData() {
        const userData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA) || 
                        localStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                console.error('Error parsing user data:', e);
                return null;
            }
        }
        
        return null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.api.getToken();
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        const user = this.getUserData();
        return user && user.role === role;
    }

    /**
     * Check if user is super admin
     */
    isSuperAdmin() {
        return this.hasRole(USER_ROLES.SUPER_ADMIN);
    }

    /**
     * Check if user is admin or super admin
     */
    isAdmin() {
        const user = this.getUserData();
        return user && (user.role === USER_ROLES.SUPER_ADMIN || 
                       user.role === USER_ROLES.ADMIN ||
                       user.role === USER_ROLES.SUPPORT_STAFF);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.getUserData();
    }

    /**
     * Update stored user data (after profile update)
     */
    updateUserData(updates) {
        const currentUser = this.getUserData();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            const isPersisted = !!localStorage.getItem(STORAGE_KEYS.USER_DATA);
            this.storeUserData(updatedUser, isPersisted);
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });

            return {
                success: true,
                message: response.message || 'Password changed successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        try {
            const response = await this.api.post('/auth/forgot-password', { email });

            return {
                success: true,
                message: response.message || 'Password reset email sent'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await this.api.post('/auth/reset-password', {
                token,
                newPassword
            });

            return {
                success: true,
                message: response.message || 'Password reset successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check session expiry and redirect if needed
     */
    checkSessionExpiry() {
        if (!this.isAuthenticated() && !window.location.pathname.includes('login.html')) {
            this.logout();
            return false;
        }
        return true;
    }

    /**
     * Setup auto-logout on inactivity
     */
    setupInactivityLogout(timeoutMinutes = 30) {
        let inactivityTimer;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.logout();
                alert('You have been logged out due to inactivity.');
            }, timeoutMinutes * 60 * 1000);
        };

        // Listen for user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Start the timer
        resetTimer();
    }
}

// Create global instance
window.authService = new AuthService();
