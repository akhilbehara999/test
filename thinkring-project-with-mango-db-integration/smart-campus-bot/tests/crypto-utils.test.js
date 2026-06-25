/**
 * @file Test suite for crypto-utils.js
 * Tests cryptographic functions including password hashing, API key management, and security utilities
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    
    describe('Crypto Utils Tests', () => {
        
        describe('Salt Generation', () => {
            
            itAsync('should generate a salt', async () => {
                const salt = await generateSalt();
                expect(salt).toBeTruthy();
                expect(typeof salt).toBe('string');
                expect(salt.length).toBeGreaterThan(0);
            });
            
            itAsync('should generate different salts each time', async () => {
                const salt1 = await generateSalt();
                const salt2 = await generateSalt();
                expect(salt1).not.toBe(salt2);
            });
            
        });
        
        describe('Password Hashing', () => {
            
            itAsync('should hash a password with salt', async () => {
                const password = 'testPassword123';
                const salt = await generateSalt();
                const hash = await hashPassword(password, salt);
                
                expect(hash).toBeTruthy();
                expect(typeof hash).toBe('string');
                expect(hash.length).toBeGreaterThan(0);
                expect(hash).not.toBe(password);
            });
            
            itAsync('should produce different hashes with different salts', async () => {
                const password = 'samePassword';
                const salt1 = await generateSalt();
                const salt2 = await generateSalt();
                
                const hash1 = await hashPassword(password, salt1);
                const hash2 = await hashPassword(password, salt2);
                
                expect(hash1).not.toBe(hash2);
            });
            
            itAsync('should produce same hash with same password and salt', async () => {
                const password = 'consistentPassword';
                const salt = 'consistentSalt';
                
                const hash1 = await hashPassword(password, salt);
                const hash2 = await hashPassword(password, salt);
                
                expect(hash1).toBe(hash2);
            });
            
        });
        
        describe('Password Verification', () => {
            
            itAsync('should verify correct password', async () => {
                const password = 'correctPassword';
                const salt = await generateSalt();
                const hash = await hashPassword(password, salt);
                
                const isValid = await verifyPassword(password, hash, salt);
                expect(isValid).toBe(true);
            });
            
            itAsync('should reject incorrect password', async () => {
                const correctPassword = 'correctPassword';
                const incorrectPassword = 'wrongPassword';
                const salt = await generateSalt();
                const hash = await hashPassword(correctPassword, salt);
                
                const isValid = await verifyPassword(incorrectPassword, hash, salt);
                expect(isValid).toBe(false);
            });
            
            itAsync('should handle empty passwords', async () => {
                const password = '';
                const salt = await generateSalt();
                const hash = await hashPassword(password, salt);
                
                const isValid = await verifyPassword(password, hash, salt);
                expect(isValid).toBe(true);
                
                const isInvalid = await verifyPassword('notEmpty', hash, salt);
                expect(isInvalid).toBe(false);
            });
            
        });
        
        describe('Enhanced Simple Hash (Fallback)', () => {
            
            it('should produce consistent hash for same input', () => {
                const input = 'test input';
                const hash1 = enhancedSimpleHash(input);
                const hash2 = enhancedSimpleHash(input);
                expect(hash1).toBe(hash2);
            });
            
            it('should produce different hashes for different inputs', () => {
                const hash1 = enhancedSimpleHash('input1');
                const hash2 = enhancedSimpleHash('input2');
                expect(hash1).not.toBe(hash2);
            });
            
            it('should handle empty string', () => {
                const hash = enhancedSimpleHash('');
                expect(typeof hash).toBe('string');
                expect(hash.length).toBeGreaterThan(0);
            });
            
        });
        
        describe('API Key Manager', () => {
            
            beforeEach(() => {
                // Clear localStorage before each test
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('secure_api_')) {
                        localStorage.removeItem(key);
                    }
                }
            });
            
            itAsync('should store and retrieve API key', async () => {
                const keyName = 'testKey';
                const apiKey = 'test-api-key-12345';
                
                await apiKeyManager.storeAPIKey(keyName, apiKey);
                const retrieved = await apiKeyManager.retrieveAPIKey(keyName);
                
                expect(retrieved).toBe(apiKey);
            });
            
            itAsync('should return null for non-existent key', async () => {
                const retrieved = await apiKeyManager.retrieveAPIKey('nonExistentKey');
                expect(retrieved).toBe(null);
            });
            
            itAsync('should list stored API keys', async () => {
                await apiKeyManager.storeAPIKey('key1', 'value1');
                await apiKeyManager.storeAPIKey('key2', 'value2');
                
                const keys = apiKeyManager.listAPIKeys();
                expect(keys).toContain('key1');
                expect(keys).toContain('key2');
                expect(keys.length).toBe(2);
            });
            
            it('should remove API key', async () => {
                const keyName = 'keyToRemove';
                await apiKeyManager.storeAPIKey(keyName, 'someValue');
                
                apiKeyManager.removeAPIKey(keyName);
                const retrieved = await apiKeyManager.retrieveAPIKey(keyName);
                
                expect(retrieved).toBe(null);
            });
            
        });
        
        describe('Password Strength Validation', () => {
            
            it('should validate strong password', () => {
                const strongPassword = 'MyStr0ng!P@ssw0rd';
                const result = validatePasswordStrength(strongPassword);
                
                expect(result.score).toBe(5);
                expect(result.strength).toBe('Strong');
                expect(result.feedback.length).toBe(0);
            });
            
            it('should identify weak password', () => {
                const weakPassword = '123';
                const result = validatePasswordStrength(weakPassword);
                
                expect(result.score).toBeLessThan(3);
                expect(result.strength).toBe('Very Weak');
                expect(result.feedback.length).toBeGreaterThan(0);
            });
            
            it('should provide feedback for improvement', () => {
                const password = 'password'; // lowercase only, no numbers/special chars
                const result = validatePasswordStrength(password);
                
                expect(result.feedback).toContain('Include uppercase letters');
                expect(result.feedback).toContain('Include numbers');
                expect(result.feedback).toContain('Include special characters');
            });
            
            it('should handle empty password', () => {
                const result = validatePasswordStrength('');
                
                expect(result.score).toBe(0);
                expect(result.strength).toBe('Very Weak');
                expect(result.feedback).toContain('Use at least 8 characters');
            });
            
        });
        
        describe('Secure Password Generation', () => {
            
            it('should generate password of specified length', () => {
                const length = 16;
                const password = generateSecurePassword(length);
                
                expect(password.length).toBe(length);
                expect(typeof password).toBe('string');
            });
            
            it('should generate different passwords each time', () => {
                const password1 = generateSecurePassword(12);
                const password2 = generateSecurePassword(12);
                
                expect(password1).not.toBe(password2);
            });
            
            it('should use default length when not specified', () => {
                const password = generateSecurePassword();
                expect(password.length).toBe(12);
            });
            
            it('should contain varied character types', () => {
                const password = generateSecurePassword(20);
                
                // Check for different character types
                const hasLowercase = /[a-z]/.test(password);
                const hasUppercase = /[A-Z]/.test(password);
                const hasNumber = /\\d/.test(password);
                const hasSpecial = /[!@#$%^&*]/.test(password);
                
                // With 20 characters, we should have high probability of mixed types
                const typeCount = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
                expect(typeCount).toBeGreaterThan(1);
            });
            
        });
        
    });
    
});