// Form and Data Validators
class FormValidators {
    /**
     * Validate email format
     */
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validate phone number format
     */
    static validatePhone(phone) {
        const regex = /^\+?[\d\s\-()]{10,}$/;
        return regex.test(phone);
    }

    /**
     * Validate password strength
     * - At least 8 characters
     * - Contains letters and numbers
     * - Optionally contains special characters
     */
    static validatePassword(password) {
        if (password.length < 8) return false;
        if (!/[a-zA-Z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        return true;
    }

    /**
     * Get password strength score (0-100)
     */
    static getPasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 10;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

        return Math.min(strength, 100);
    }

    /**
     * Validate URL format
     */
    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate number range
     */
    static validateRange(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    /**
     * Validate required field
     */
    static validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    /**
     * Validate min length
     */
    static validateMinLength(value, minLength) {
        return value && value.toString().length >= minLength;
    }

    /**
     * Validate max length
     */
    static validateMaxLength(value, maxLength) {
        return value && value.toString().length <= maxLength;
    }

    /**
     * Validate matches pattern
     */
    static validatePattern(value, pattern) {
        return new RegExp(pattern).test(value);
    }

    /**
     * Validate form element
     */
    static validateElement(element) {
        const value = element.value;
        const validationType = element.getAttribute('data-validate');
        
        if (!validationType) return true;

        let isValid = true;
        const types = validationType.split('|');

        for (let type of types) {
            type = type.trim();
            
            if (type === 'required') {
                isValid = this.validateRequired(value);
            } else if (type === 'email') {
                isValid = this.validateEmail(value);
            } else if (type === 'phone') {
                isValid = this.validatePhone(value);
            } else if (type === 'url') {
                isValid = this.validateUrl(value);
            } else if (type.startsWith('min:')) {
                const minLength = parseInt(type.split(':')[1]);
                isValid = this.validateMinLength(value, minLength);
            } else if (type.startsWith('max:')) {
                const maxLength = parseInt(type.split(':')[1]);
                isValid = this.validateMaxLength(value, maxLength);
            }

            if (!isValid) break;
        }

        // Update UI
        if (isValid) {
            element.classList.remove('error');
            const errorMsg = element.parentElement.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        } else {
            element.classList.add('error');
            this.showElementError(element, this.getErrorMessage(validationType));
        }

        return isValid;
    }

    /**
     * Validate entire form
     */
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const elements = form.querySelectorAll('[data-validate]');
        let isFormValid = true;

        elements.forEach(element => {
            if (!this.validateElement(element)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    /**
     * Get error message for validation type
     */
    static getErrorMessage(validationType) {
        const messages = {
            'required': 'This field is required',
            'email': 'Please enter a valid email address',
            'phone': 'Please enter a valid phone number',
            'password': 'Password must be at least 8 characters with letters and numbers',
            'url': 'Please enter a valid URL',
        };

        return messages[validationType] || 'Invalid input';
    }

    /**
     * Show error message for element
     */
    static showElementError(element, message) {
        const existing = element.parentElement.querySelector('.error-message');
        if (existing) existing.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        element.parentElement.appendChild(errorDiv);
    }

    /**
     * Clear all form errors
     */
    static clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.error-message').forEach(msg => msg.remove());
        form.querySelectorAll('.error').forEach(elem => elem.classList.remove('error'));
    }

    /**
     * Validate custom rule
     */
    static validateCustom(value, rule) {
        return rule(value);
    }

    /**
     * Validate matches another field
     */
    static validateMatches(value, otherFieldSelector) {
        const otherField = document.querySelector(otherFieldSelector);
        return otherField && value === otherField.value;
    }
}

// Make validators globally available
const validators = new FormValidators();
