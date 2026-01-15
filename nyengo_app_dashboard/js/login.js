// Login page script for Nyengo Dashboard
class LoginManager {
    constructor() {
        this.authService = window.authService;
        this.init();
    }

    async init() {
        try {
            // Check if user is already logged in
            if (this.authService.isAuthenticated()) {
                // Verify token is still valid
                const result = await this.authService.verifyToken();
                if (result.success) {
                    this.redirectToDashboard();
                    return;
                }
            }

            // Check for session expired message
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('session') === 'expired') {
                this.showError('Your session has expired. Please login again.');
            }

            this.setupEventListeners();
        } catch (error) {
            console.error('Login initialization error:', error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Optional: Add Enter key support
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalHTML = submitButton.innerHTML;
        
        // Validate inputs
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging in...</span>';
        submitButton.disabled = true;
        
        try {
            // Authenticate with backend
            const result = await this.authService.login(email, password, rememberMe);
            
            if (result.success) {
                // Verify user has admin privileges
                if (!this.isAdminUser(result.user)) {
                    this.authService.logout();
                    this.showError('Access denied. Admin privileges required.');
                    this.resetButton(submitButton, originalHTML);
                    return;
                }

                // Success feedback
                submitButton.innerHTML = '<i class="fas fa-check"></i> <span>Success!</span>';
                
                // Redirect to dashboard
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 800);
            } else {
                this.showError(result.error || 'Invalid email or password');
                this.resetButton(submitButton, originalHTML);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please check your connection and try again.');
            this.resetButton(submitButton, originalHTML);
        }
    }

    /**
     * Check if user has admin privileges
     */
    isAdminUser(user) {
        const adminRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPPORT_STAFF];
        return user && adminRoles.includes(user.role);
    }

    getSessionUser() {
        return this.authService.getUserData();
    }

    redirectToDashboard() {
        window.location.href = 'index.html';
    }

    showError(message) {
        // Remove any existing error
        const existingError = document.querySelector('.login-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        // Insert error before the form
        const loginForm = document.getElementById('loginForm');
        loginForm.parentNode.insertBefore(errorDiv, loginForm);
        
        // Auto remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    resetButton(button, originalHTML) {
        button.disabled = false;
        button.innerHTML = originalHTML;
    }

    async displayTestCredentials() {
        try {
            const credentials = await this.dataLoader.loadCredentials();
            
            // Create test credentials display
            const testCredsDiv = document.createElement('div');
            testCredsDiv.className = 'test-credentials';
            testCredsDiv.innerHTML = `
                <div class="test-creds-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Test Credentials</span>
                </div>
                <div class="test-creds-content">
                    ${credentials.admins.map(admin => `
                        <div class="test-cred-item" onclick="loginManager.fillCredentials('${admin.username}', '${admin.password}')">
                            <strong>${admin.role === 'super_admin' ? 'Super Admin' : 'Support'}:</strong>
                            <span>Username: ${admin.username} | Password: ${admin.password}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Insert after the login form
            const loginBox = document.querySelector('.login-box');
            loginBox.appendChild(testCredsDiv);
            
        } catch (error) {
            console.error('Error loading test credentials:', error);
        }
    }

    fillCredentials(username, password) {
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
    }
}

// Initialize login manager when page loads
let loginManager;
document.addEventListener('DOMContentLoaded', () => {
    loginManager = new LoginManager();
});
