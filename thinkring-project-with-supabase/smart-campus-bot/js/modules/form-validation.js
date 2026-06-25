/**
 * @file Form Validation Module
 * Provides comprehensive form validation with real-time feedback
 */

/**
 * Form Validator
 * Handles form validation with real-time feedback and multiple validation rules
 */
class FormValidator {
    constructor() {
        this.validators = new Map();
        this.forms = new Map();
        this.setupDefaultValidators();
    }

    /**
     * Setup default validation rules
     * @private
     */
    setupDefaultValidators() {
        // Required field validator
        this.addValidator('required', (value, params) => {
            const trimmed = String(value).trim();
            return {
                valid: trimmed.length > 0,
                message: params.message || 'This field is required'
            };
        });

        // Minimum length validator
        this.addValidator('minLength', (value, params) => {
            const length = String(value).length;
            const minLength = params.length || 0;
            return {
                valid: length >= minLength,
                message: params.message || `Minimum ${minLength} characters required`
            };
        });

        // Maximum length validator
        this.addValidator('maxLength', (value, params) => {
            const length = String(value).length;
            const maxLength = params.length || 255;
            return {
                valid: length <= maxLength,
                message: params.message || `Maximum ${maxLength} characters allowed`
            };
        });

        // Email validator
        this.addValidator('email', (value, params) => {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return {
                valid: emailRegex.test(value),
                message: params.message || 'Please enter a valid email address'
            };
        });

        // Phone number validator
        this.addValidator('phone', (value, params) => {
            const phoneRegex = /^[\\+]?[1-9][\\d]{0,15}$/;
            return {
                valid: phoneRegex.test(value.replace(/[\\s\\-\\(\\)]/g, '')),
                message: params.message || 'Please enter a valid phone number'
            };
        });

        // URL validator
        this.addValidator('url', (value, params) => {
            try {
                new URL(value);
                return { valid: true };
            } catch {
                return {
                    valid: false,
                    message: params.message || 'Please enter a valid URL'
                };
            }
        });

        // Number validator
        this.addValidator('number', (value, params) => {
            const num = parseFloat(value);
            const valid = !isNaN(num) && isFinite(num);
            return {
                valid,
                message: params.message || 'Please enter a valid number'
            };
        });

        // Number range validator
        this.addValidator('range', (value, params) => {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return {
                    valid: false,
                    message: 'Please enter a valid number'
                };
            }

            const min = params.min !== undefined ? params.min : -Infinity;
            const max = params.max !== undefined ? params.max : Infinity;
            const valid = num >= min && num <= max;

            let message = params.message;
            if (!message) {
                if (min !== -Infinity && max !== Infinity) {
                    message = `Value must be between ${min} and ${max}`;
                } else if (min !== -Infinity) {
                    message = `Value must be at least ${min}`;
                } else if (max !== Infinity) {
                    message = `Value must be at most ${max}`;
                }
            }

            return { valid, message };
        });

        // Pattern validator
        this.addValidator('pattern', (value, params) => {
            const regex = new RegExp(params.pattern, params.flags || '');
            return {
                valid: regex.test(value),
                message: params.message || 'Please enter a valid format'
            };
        });

        // Custom password strength validator
        this.addValidator('passwordStrength', (value, params) => {
            const minScore = params.minScore || 3;
            
            if (typeof validatePasswordStrength === 'function') {
                const result = validatePasswordStrength(value);
                return {
                    valid: result.score >= minScore,
                    message: params.message || `Password strength: ${result.strength}. ${result.feedback.join(', ')}`
                };
            }
            
            // Fallback validation
            const hasLower = /[a-z]/.test(value);
            const hasUpper = /[A-Z]/.test(value);
            const hasDigit = /\\d/.test(value);
            const hasSpecial = /[^a-zA-Z\\d]/.test(value);
            const hasLength = value.length >= 8;
            
            const score = [hasLower, hasUpper, hasDigit, hasSpecial, hasLength].filter(Boolean).length;
            
            return {
                valid: score >= minScore,
                message: params.message || 'Password is too weak'
            };
        });

        // Confirmation field validator
        this.addValidator('confirm', (value, params) => {
            const targetField = document.getElementById(params.target);
            const targetValue = targetField ? targetField.value : '';
            return {
                valid: value === targetValue,
                message: params.message || 'Confirmation does not match'
            };
        });

        // File type validator
        this.addValidator('fileType', (value, params, field) => {
            if (!field.files || field.files.length === 0) {
                return { valid: true }; // No file selected
            }

            const allowedTypes = params.types || [];
            const file = field.files[0];
            const fileType = file.type;
            const fileExtension = file.name.split('.').pop().toLowerCase();

            const valid = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExtension === type.substring(1);
                }
                return fileType.startsWith(type);
            });

            return {
                valid,
                message: params.message || `Allowed file types: ${allowedTypes.join(', ')}`
            };
        });

        // File size validator
        this.addValidator('fileSize', (value, params, field) => {
            if (!field.files || field.files.length === 0) {
                return { valid: true }; // No file selected
            }

            const maxSize = params.maxSize || 5 * 1024 * 1024; // 5MB default
            const file = field.files[0];
            const valid = file.size <= maxSize;

            return {
                valid,
                message: params.message || `File size must be less than ${this.formatFileSize(maxSize)}`
            };
        });
    }

    /**
     * Add a custom validator
     * @param {string} name - Validator name
     * @param {Function} validatorFn - Validator function
     */
    addValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }

    /**
     * Register a form for validation
     * @param {string|HTMLFormElement} form - Form selector or element
     * @param {object} config - Validation configuration
     */
    registerForm(form, config = {}) {
        const formElement = typeof form === 'string' ? document.querySelector(form) : form;
        if (!formElement) {
            console.error('Form not found:', form);
            return;
        }

        const formId = formElement.id || 'form-' + Date.now();
        if (!formElement.id) {
            formElement.id = formId;
        }

        const formConfig = {
            element: formElement,
            fields: new Map(),
            realTimeValidation: config.realTimeValidation !== false,
            showSuccessMessages: config.showSuccessMessages || false,
            onSubmit: config.onSubmit,
            onValidationChange: config.onValidationChange,
            ...config
        };

        this.forms.set(formId, formConfig);
        this.setupFormEventListeners(formConfig);

        return formId;
    }

    /**
     * Add field validation rules
     * @param {string} formId - Form ID
     * @param {string} fieldSelector - Field selector
     * @param {Array} rules - Validation rules
     */
    addFieldRules(formId, fieldSelector, rules) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) {
            console.error('Form not found:', formId);
            return;
        }

        const field = formConfig.element.querySelector(fieldSelector);
        if (!field) {
            console.error('Field not found:', fieldSelector);
            return;
        }

        formConfig.fields.set(field, {
            rules,
            lastValidation: null
        });

        if (formConfig.realTimeValidation) {
            this.setupFieldEventListeners(field, formConfig);
        }
    }

    /**
     * Setup form event listeners
     * @private
     */
    setupFormEventListeners(formConfig) {
        formConfig.element.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateForm(formConfig.element.id, true);
        });
    }

    /**
     * Setup field event listeners
     * @private
     */
    setupFieldEventListeners(field, formConfig) {
        const events = ['blur', 'input'];
        let debounceTimer;

        events.forEach(event => {
            field.addEventListener(event, () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.validateField(field, formConfig);
                }, event === 'input' ? 300 : 0);
            });
        });
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Field element
     * @param {object} formConfig - Form configuration
     * @returns {object} Validation result
     */
    validateField(field, formConfig) {
        const fieldConfig = formConfig.fields.get(field);
        if (!fieldConfig) {
            return { valid: true, errors: [] };
        }

        const value = this.getFieldValue(field);
        const errors = [];

        for (const rule of fieldConfig.rules) {
            const validator = this.validators.get(rule.type);
            if (!validator) {
                console.warn('Unknown validator:', rule.type);
                continue;
            }

            const result = validator(value, rule.params || {}, field);
            if (!result.valid) {
                errors.push(result.message);
                if (rule.stopOnFailure) {
                    break;
                }
            }
        }

        const isValid = errors.length === 0;
        const validationResult = { valid: isValid, errors };

        fieldConfig.lastValidation = validationResult;
        this.updateFieldUI(field, validationResult, formConfig);

        if (formConfig.onValidationChange) {
            formConfig.onValidationChange(field, validationResult);
        }

        return validationResult;
    }

    /**
     * Validate entire form
     * @param {string} formId - Form ID
     * @param {boolean} triggerSubmit - Whether to trigger submit on success
     * @returns {object} Validation result
     */
    validateForm(formId, triggerSubmit = false) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) {
            console.error('Form not found:', formId);
            return { valid: false, errors: [] };
        }

        const results = [];
        let allValid = true;

        for (const [field, fieldConfig] of formConfig.fields) {
            const result = this.validateField(field, formConfig);
            results.push({ field, result });
            if (!result.valid) {
                allValid = false;
            }
        }

        const formResult = { valid: allValid, fieldResults: results };

        if (allValid && triggerSubmit && formConfig.onSubmit) {
            formConfig.onSubmit(new FormData(formConfig.element), formConfig.element);
        }

        return formResult;
    }

    /**
     * Get field value
     * @private
     */
    getFieldValue(field) {
        if (field.type === 'checkbox') {
            return field.checked;
        }
        if (field.type === 'radio') {
            const form = field.closest('form');
            const checked = form.querySelector(`input[name=\"${field.name}\"]:checked`);
            return checked ? checked.value : '';
        }
        return field.value;
    }

    /**
     * Update field UI based on validation result
     * @private
     */
    updateFieldUI(field, result, formConfig) {
        // Remove existing validation classes
        field.classList.remove('valid', 'invalid');
        
        // Add appropriate class
        if (result.valid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid');
        }

        // Update validation message
        const messageId = field.id + '-validation-message';
        let messageElement = document.getElementById(messageId);

        if (result.errors.length > 0) {
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = messageId;
                messageElement.className = 'validation-message error';
                field.parentNode.insertBefore(messageElement, field.nextSibling);
            }
            messageElement.textContent = result.errors[0];
            messageElement.style.display = 'block';
        } else {
            if (messageElement) {
                if (formConfig.showSuccessMessages && field.value.trim()) {
                    messageElement.textContent = '✓ Valid';
                    messageElement.className = 'validation-message success';
                } else {
                    messageElement.style.display = 'none';
                }
            }
        }
    }

    /**
     * Clear form validation
     * @param {string} formId - Form ID
     */
    clearValidation(formId) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) return;

        for (const [field, fieldConfig] of formConfig.fields) {
            field.classList.remove('valid', 'invalid');
            const messageId = field.id + '-validation-message';
            const messageElement = document.getElementById(messageId);
            if (messageElement) {
                messageElement.style.display = 'none';
            }
            fieldConfig.lastValidation = null;
        }
    }

    /**
     * Format file size for display
     * @private
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
    }

    /**
     * Get form validation state
     * @param {string} formId - Form ID
     * @returns {object} Form validation state
     */
    getFormState(formId) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) return null;

        const state = {
            valid: true,
            fields: {}
        };

        for (const [field, fieldConfig] of formConfig.fields) {
            const fieldName = field.name || field.id;
            state.fields[fieldName] = fieldConfig.lastValidation || { valid: true, errors: [] };
            if (!state.fields[fieldName].valid) {
                state.valid = false;
            }
        }

        return state;
    }
}

// Global form validator instance
const formValidator = new FormValidator();

// Export for global use
window.formValidator = formValidator;

// Add validation styles
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('form-validation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'form-validation-styles';
        styles.textContent = `
            .validation-message {
                font-size: 12px;
                margin-top: 4px;
                padding: 4px 8px;
                border-radius: 4px;
                display: none;
            }
            
            .validation-message.error {
                background-color: rgba(255, 71, 87, 0.1);
                border: 1px solid var(--error-color);
                color: var(--error-color);
            }
            
            .validation-message.success {
                background-color: rgba(255, 215, 0, 0.1);
                border: 1px solid var(--success-color);
                color: var(--success-color);
            }
            
            input.invalid, textarea.invalid, select.invalid {
                border-color: var(--error-color) !important;
                box-shadow: 0 0 5px rgba(255, 71, 87, 0.3) !important;
            }
            
            input.valid, textarea.valid, select.valid {
                border-color: var(--success-color) !important;
            }
        `;
        document.head.appendChild(styles);
    }
});

console.log('Form Validation module loaded');"