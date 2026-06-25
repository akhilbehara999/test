/**
 * @file Module Loader System for Smart Campus Bot
 * Provides dynamic module loading and dependency management
 */

/**
 * Simple module system for managing dependencies and lazy loading
 */
class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
    }

    /**
     * Register a module for lazy loading
     * @param {string} name - Module name
     * @param {string} path - Path to the module script
     * @param {string[]} dependencies - Array of dependency module names
     */
    register(name, path, dependencies = []) {
        this.modules.set(name, {
            path,
            dependencies,
            loaded: false
        });
    }

    /**
     * Load a module and its dependencies
     * @param {string} name - Module name to load
     * @returns {Promise} Promise that resolves when module is loaded
     */
    async load(name) {
        // Check if already loaded
        if (this.loadedModules.has(name)) {
            return Promise.resolve();
        }

        // Check if currently loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Module '${name}' not found`);
        }

        // Create loading promise
        const loadingPromise = this._loadModule(name, module);
        this.loadingPromises.set(name, loadingPromise);

        try {
            await loadingPromise;
            this.loadedModules.add(name);
            this.loadingPromises.delete(name);
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }

    /**
     * Internal method to load a module
     * @private
     */
    async _loadModule(name, module) {
        // Load dependencies first
        for (const dep of module.dependencies) {
            await this.load(dep);
        }

        // Load the module script
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = module.path;
            script.onload = () => {
                console.log(`Module '${name}' loaded successfully`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load module '${name}' from ${module.path}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load multiple modules
     * @param {string[]} moduleNames - Array of module names to load
     * @returns {Promise} Promise that resolves when all modules are loaded
     */
    async loadMultiple(moduleNames) {
        const promises = moduleNames.map(name => this.load(name));
        return Promise.all(promises);
    }

    /**
     * Check if a module is loaded
     * @param {string} name - Module name
     * @returns {boolean} True if module is loaded
     */
    isLoaded(name) {
        return this.loadedModules.has(name);
    }

    /**
     * Get list of loaded modules
     * @returns {string[]} Array of loaded module names
     */
    getLoadedModules() {
        return Array.from(this.loadedModules);
    }

    /**
     * Preload modules for better performance
     * @param {string[]} moduleNames - Modules to preload
     */
    async preload(moduleNames) {
        try {
            await this.loadMultiple(moduleNames);
            console.log('Preloaded modules:', moduleNames);
        } catch (error) {
            console.warn('Preloading failed for some modules:', error);
        }
    }
}

// Global module loader instance
const moduleLoader = new ModuleLoader();

// Register core modules
moduleLoader.register('voice-commands', 'js/modules/voice-commands.js', ['utils']);
moduleLoader.register('session-management', 'js/modules/session-management.js', ['crypto-utils']);
moduleLoader.register('form-validation', 'js/modules/form-validation.js', ['utils']);
moduleLoader.register('notification-system', 'js/modules/notification-system.js');
moduleLoader.register('analytics', 'js/modules/analytics.js', ['utils']);
moduleLoader.register('theme-manager', 'js/modules/theme-manager.js');
moduleLoader.register('performance-optimizer', 'js/modules/performance-optimizer.js');
moduleLoader.register('error-handler', 'js/modules/error-handler.js', ['notification-system']);
moduleLoader.register('data-service', 'js/data-service.js');

// Export for global use
window.moduleLoader = moduleLoader;

/**
 * Utility function to load modules with error handling
 * @param {string|string[]} modules - Module name or array of module names
 * @returns {Promise} Promise that resolves when modules are loaded
 */
window.loadModules = async function(modules) {
    try {
        if (Array.isArray(modules)) {
            await moduleLoader.loadMultiple(modules);
        } else {
            await moduleLoader.load(modules);
        }
    } catch (error) {
        console.error('Failed to load modules:', error);
        // Could show user notification here
    }
};

/**
 * Auto-preload essential modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Preload essential modules (error handler first for comprehensive error coverage)
    moduleLoader.preload(['notification-system', 'error-handler', 'session-management', 'performance-optimizer', 'data-service']);
});