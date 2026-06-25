/**
 * @file Test suite for utils.js
 * Tests utility functions including input sanitization, validation, and chart drawing
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    
    describe('Utils.js Tests', () => {
        
        describe('Input Sanitization', () => {
            
            it('should sanitize basic HTML tags', () => {
                const input = '<script>alert(\"xss\")</script>Hello';
                const result = sanitizeInput(input);
                expect(result).toContain('Hello');
                expect(result).not.toContain('<script>');
            });
            
            it('should handle special characters', () => {
                const input = '< > & \" \\'';
                const result = sanitizeInput(input);
                expect(result).toContain('&lt;');
                expect(result).toContain('&gt;');
                expect(result).toContain('&amp;');
            });
            
            it('should handle null and undefined inputs', () => {
                expect(sanitizeInput(null)).toBe('null');
                expect(sanitizeInput(undefined)).toBe('undefined');
            });
            
            it('should handle non-string inputs', () => {
                expect(sanitizeInput(123)).toBe('123');
                expect(sanitizeInput({})).toBe('[object Object]');
            });
            
        });
        
        describe('HTML Sanitization', () => {
            
            it('should allow safe HTML tags', () => {
                const input = '<b>Bold</b> and <i>italic</i> text';
                const result = sanitizeHTML(input);
                expect(result).toContain('<b>Bold</b>');
                expect(result).toContain('<i>italic</i>');
            });
            
            it('should remove script tags', () => {
                const input = '<b>Safe</b><script>alert(\"xss\")</script>';
                const result = sanitizeHTML(input);
                expect(result).toContain('<b>Safe</b>');
                expect(result).not.toContain('<script>');
                expect(result).not.toContain('alert');
            });
            
            it('should remove event handlers', () => {
                const input = '<button onclick=\"alert(\\\"xss\\\")\">Click</button>';
                const result = sanitizeHTML(input);
                expect(result).not.toContain('onclick');
                expect(result).not.toContain('alert');
            });
            
            it('should remove javascript: URLs', () => {
                const input = '<a href=\"javascript:alert(\\\"xss\\\")\">Link</a>';
                const result = sanitizeHTML(input);
                expect(result).not.toContain('javascript:');
            });
            
        });
        
        describe('URL Sanitization', () => {
            
            it('should allow valid HTTP URLs', () => {
                const url = 'http://example.com';
                const result = sanitizeURL(url);
                expect(result).toBe(url);
            });
            
            it('should allow valid HTTPS URLs', () => {
                const url = 'https://example.com/path?query=value';
                const result = sanitizeURL(url);
                expect(result).toBe(url);
            });
            
            it('should reject javascript: URLs', () => {
                const url = 'javascript:alert(\"xss\")';
                const result = sanitizeURL(url);
                expect(result).toBe(null);
            });
            
            it('should reject data: URLs', () => {
                const url = 'data:text/html,<script>alert(1)</script>';
                const result = sanitizeURL(url);
                expect(result).toBe(null);
            });
            
            it('should handle invalid URLs', () => {
                const url = 'not-a-url';
                const result = sanitizeURL(url);
                expect(result).toBe(null);
            });
            
        });
        
        describe('Field Validation', () => {
            
            beforeEach(() => {
                // Create a test input element
                const testInput = document.createElement('input');
                testInput.id = 'test-input';
                document.body.appendChild(testInput);
            });
            
            afterEach(() => {
                // Clean up test input
                const testInput = document.getElementById('test-input');
                if (testInput) {
                    testInput.remove();
                }
            });
            
            it('should validate non-empty fields', () => {
                const testInput = document.getElementById('test-input');
                testInput.value = 'Valid input';
                
                const result = validateField(testInput);
                expect(result).toBe(true);
                expect(testInput.classList.contains('not-valid')).toBe(false);
            });
            
            it('should invalidate empty fields', () => {
                const testInput = document.getElementById('test-input');
                testInput.value = '';
                
                const result = validateField(testInput);
                expect(result).toBe(false);
                expect(testInput.classList.contains('not-valid')).toBe(true);
            });
            
            it('should invalidate whitespace-only fields', () => {
                const testInput = document.getElementById('test-input');
                testInput.value = '   \\t\n   ';
                
                const result = validateField(testInput);
                expect(result).toBe(false);
                expect(testInput.classList.contains('not-valid')).toBe(true);
            });
            
        });
        
        describe('Chart Drawing', () => {
            
            beforeEach(() => {
                // Create a test canvas element
                const testCanvas = document.createElement('canvas');
                testCanvas.id = 'test-canvas';
                testCanvas.width = 400;
                testCanvas.height = 300;
                document.body.appendChild(testCanvas);
            });
            
            afterEach(() => {
                // Clean up test canvas
                const testCanvas = document.getElementById('test-canvas');
                if (testCanvas) {
                    testCanvas.remove();
                }
            });
            
            it('should handle valid chart data', () => {
                const chartData = {
                    labels: ['A', 'B', 'C'],
                    values: [10, 20, 15]
                };
                
                // Should not throw an error
                expect(() => {
                    drawBarChart('test-canvas', chartData);
                }).not.toThrow();
            });
            
            it('should handle empty data gracefully', () => {
                const chartData = {
                    labels: [],
                    values: []
                };
                
                expect(() => {
                    drawBarChart('test-canvas', chartData);
                }).not.toThrow();
            });
            
            it('should handle non-existent canvas gracefully', () => {
                const chartData = {
                    labels: ['A', 'B'],
                    values: [1, 2]
                };
                
                expect(() => {
                    drawBarChart('non-existent-canvas', chartData);
                }).not.toThrow();
            });
            
        });
        
        describe('Simple Hash Function (Legacy)', () => {
            
            it('should produce consistent hash for same input', () => {
                const input = 'test string';
                const hash1 = simpleHash(input);
                const hash2 = simpleHash(input);
                expect(hash1).toBe(hash2);
            });
            
            it('should produce different hashes for different inputs', () => {
                const hash1 = simpleHash('input1');
                const hash2 = simpleHash('input2');
                expect(hash1).not.toBe(hash2);
            });
            
            it('should handle empty string', () => {
                const hash = simpleHash('');
                expect(hash).toBe('0');
            });
            
            it('should handle special characters', () => {
                const hash = simpleHash('!@#$%^&*()');
                expect(typeof hash).toBe('string');
                expect(hash.length).toBeGreaterThan(0);
            });
            
        });
        
    });
    
});