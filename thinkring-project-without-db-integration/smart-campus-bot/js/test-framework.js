/**
 * @file Simple test framework for Smart Campus Bot
 * Provides basic testing utilities for JavaScript functions
 */

/**
 * Simple test framework for client-side testing
 */
class SimpleTestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.currentSuite = null;
    }

    /**
     * Define a test suite
     * @param {string} name - Name of the test suite
     * @param {Function} callback - Function containing tests
     */
    describe(name, callback) {
        this.currentSuite = name;
        console.group(`📋 Test Suite: ${name}`);
        callback();
        console.groupEnd();
    }

    /**
     * Define a test case
     * @param {string} description - Test description
     * @param {Function} callback - Test function
     */
    it(description, callback) {
        const testName = this.currentSuite ? `${this.currentSuite}: ${description}` : description;
        
        try {
            callback();
            this.results.passed++;
            console.log(`✅ ${description}`);
        } catch (error) {
            this.results.failed++;
            console.error(`❌ ${description}`);
            console.error(`   Error: ${error.message}`);
            if (error.stack) {
                console.error(`   Stack: ${error.stack}`);
            }
        }
        
        this.results.total++;
    }

    /**
     * Assertion helpers
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${JSON.stringify(actual)}`);
                }
            },
            toContain: (expected) => {
                if (typeof actual === 'string') {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected \"${actual}\" to contain \"${expected}\"`);
                    }
                } else if (Array.isArray(actual)) {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
                    }
                } else {
                    throw new Error('toContain can only be used with strings or arrays');
                }
            },
            toThrow: () => {
                let threw = false;
                try {
                    if (typeof actual === 'function') {
                        actual();
                    }
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw an error');
                }
            },
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected instance of ${expectedClass.name}, but got ${actual.constructor.name}`);
                }
            },
            toHaveProperty: (propertyName) => {
                if (!(propertyName in actual)) {
                    throw new Error(`Expected object to have property \"${propertyName}\"`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toMatch: (pattern) => {
                if (!pattern.test(actual)) {
                    throw new Error(`Expected \"${actual}\" to match pattern ${pattern}`);
                }
            }
        };
    }

    /**
     * Async test support
     * @param {string} description - Test description
     * @param {Function} callback - Async test function
     */
    async itAsync(description, callback) {
        const testName = this.currentSuite ? `${this.currentSuite}: ${description}` : description;
        
        try {
            await callback();
            this.results.passed++;
            console.log(`✅ ${description}`);
        } catch (error) {
            this.results.failed++;
            console.error(`❌ ${description}`);
            console.error(`   Error: ${error.message}`);
            if (error.stack) {
                console.error(`   Stack: ${error.stack}`);
            }
        }
        
        this.results.total++;
    }

    /**
     * Mock function creator
     * @param {*} returnValue - Value to return when mock is called
     * @returns {Function} Mock function
     */
    createMock(returnValue) {
        const mock = function(...args) {
            mock.calls.push(args);
            mock.callCount++;
            if (typeof returnValue === 'function') {
                return returnValue(...args);
            }
            return returnValue;
        };
        
        mock.calls = [];
        mock.callCount = 0;
        mock.mockReturnValue = (value) => {
            returnValue = value;
            return mock;
        };
        
        return mock;
    }

    /**
     * Setup function that runs before each test
     * @param {Function} callback - Setup function
     */
    beforeEach(callback) {
        this._beforeEach = callback;
    }

    /**
     * Cleanup function that runs after each test
     * @param {Function} callback - Cleanup function
     */
    afterEach(callback) {
        this._afterEach = callback;
    }

    /**
     * Run all tests and display results
     */
    runTests() {
        console.log('\n🧪 Running Smart Campus Bot Tests...');
        console.log('=' * 50);
        
        // Tests are run immediately when defined
        // This method just displays the summary
        
        console.log('\n📊 Test Results:');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`⚠️  ${this.results.failed} test(s) failed`);
        }
        
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`Pass Rate: ${passRate}%`);
        
        return {
            passed: this.results.passed,
            failed: this.results.failed,
            total: this.results.total,
            passRate: parseFloat(passRate)
        };
    }

    /**
     * Reset test results
     */
    reset() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }
}

// Create global test instance
const testFramework = new SimpleTestFramework();

// Export global functions for convenience
window.describe = testFramework.describe.bind(testFramework);
window.it = testFramework.it.bind(testFramework);
window.itAsync = testFramework.itAsync.bind(testFramework);
window.expect = testFramework.expect.bind(testFramework);
window.beforeEach = testFramework.beforeEach.bind(testFramework);
window.afterEach = testFramework.afterEach.bind(testFramework);
window.createMock = testFramework.createMock.bind(testFramework);
window.runAllTests = testFramework.runTests.bind(testFramework);
window.resetTests = testFramework.reset.bind(testFramework);

// Make the framework instance available globally
window.testFramework = testFramework;