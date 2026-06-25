/**
 * @file Performance Optimizer Module
 * Provides lazy loading, asset optimization, and performance monitoring functionality
 */

/**
 * Performance Optimizer
 * Handles various performance optimization techniques
 */
class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.loadedAssets = new Set();
        this.performanceMetrics = {};
        this.resourceCache = new Map();
        
        this.initializePerformanceMonitoring();
        this.setupLazyLoading();
    }

    /**
     * Initialize performance monitoring
     * @private
     */
    initializePerformanceMonitoring() {
        if ('performance' in window) {
            this.measurePageLoad();
            this.monitorResourceLoading();
        }
    }

    /**
     * Setup lazy loading observers
     * @private
     */
    setupLazyLoading() {
        // Image lazy loading
        this.setupImageLazyLoading();
        
        // Module lazy loading
        this.setupModuleLazyLoading();
        
        // Content lazy loading
        this.setupContentLazyLoading();
    }

    /**
     * Setup image lazy loading with Intersection Observer
     * @private
     */
    setupImageLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading 50px before coming into view
            threshold: 0.1
        });

        this.observers.set('images', imageObserver);

        // Observe existing lazy images
        this.observeLazyImages();

        // Watch for new lazy images
        this.watchForNewImages();
    }

    /**
     * Setup module lazy loading
     * @private
     */
    setupModuleLazyLoading() {
        const moduleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const moduleName = element.dataset.lazyModule;
                    if (moduleName) {
                        this.loadModule(moduleName, element);
                        moduleObserver.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        this.observers.set('modules', moduleObserver);
        
        // Observe lazy modules
        document.querySelectorAll('[data-lazy-module]').forEach(el => {
            moduleObserver.observe(el);
        });
    }

    /**
     * Setup content lazy loading
     * @private
     */
    setupContentLazyLoading() {
        const contentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    this.loadContent(element);
                    contentObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.1
        });

        this.observers.set('content', contentObserver);
        
        // Observe lazy content
        document.querySelectorAll('[data-lazy-content]').forEach(el => {
            contentObserver.observe(el);
        });
    }

    /**
     * Load an image with optimization
     * @param {HTMLImageElement} img - Image element to load
     * @private
     */
    loadImage(img) {
        const src = img.dataset.lazySrc;
        const srcset = img.dataset.lazySrcset;
        
        if (!src) return;

        // Show loading placeholder
        img.classList.add('loading');

        // Create new image to preload
        const newImg = new Image();
        
        newImg.onload = () => {
            // Apply source after loading
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            
            img.classList.remove('loading', 'lazy');
            img.classList.add('loaded');
            
            // Remove data attributes
            delete img.dataset.lazySrc;
            delete img.dataset.lazySrcset;
        };
        
        newImg.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            
            // Set fallback image if available
            const fallback = img.dataset.fallback;
            if (fallback) {
                img.src = fallback;
            }
        };
        
        newImg.src = src;
    }

    /**
     * Load a module dynamically
     * @param {string} moduleName - Name of the module to load
     * @param {HTMLElement} element - Element that triggered the load
     * @private
     */
    async loadModule(moduleName, element) {
        try {
            element.classList.add('loading-module');
            
            if (window.moduleLoader) {
                await window.moduleLoader.load(moduleName);
            } else {
                // Fallback loading
                await this.loadScript(`js/modules/${moduleName}.js`);
            }
            
            element.classList.remove('loading-module');
            element.classList.add('module-loaded');
            
            // Dispatch module loaded event
            const event = new CustomEvent('moduleLoaded', {
                detail: { moduleName, element }
            });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('Failed to load module:', moduleName, error);
            element.classList.add('module-error');
        }
    }

    /**
     * Load content dynamically
     * @param {HTMLElement} element - Element with lazy content
     * @private
     */
    async loadContent(element) {
        const contentUrl = element.dataset.lazyContent;
        const contentType = element.dataset.contentType || 'html';
        
        if (!contentUrl) return;

        try {
            element.classList.add('loading-content');
            
            const content = await this.fetchContent(contentUrl, contentType);
            
            if (contentType === 'html') {
                element.innerHTML = content;
            } else if (contentType === 'text') {
                element.textContent = content;
            }
            
            element.classList.remove('loading-content');
            element.classList.add('content-loaded');
            
        } catch (error) {
            console.error('Failed to load content:', contentUrl, error);
            element.classList.add('content-error');
        }
    }

    /**
     * Fetch content with caching
     * @param {string} url - Content URL
     * @param {string} type - Content type
     * @returns {Promise<string>} Content
     * @private
     */
    async fetchContent(url, type) {
        // Check cache first
        if (this.resourceCache.has(url)) {
            return this.resourceCache.get(url);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const content = await response.text();
        
        // Cache the content
        this.resourceCache.set(url, content);
        
        return content;
    }

    /**
     * Load a script dynamically
     * @param {string} src - Script source URL
     * @returns {Promise} Promise that resolves when script loads
     * @private
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loadedAssets.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loadedAssets.add(src);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    }

    /**
     * Observe lazy images in the document
     * @private
     */
    observeLazyImages() {
        const imageObserver = this.observers.get('images');
        if (!imageObserver) return;

        document.querySelectorAll('img[data-lazy-src]').forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    }

    /**
     * Watch for new images added to the DOM
     * @private
     */
    watchForNewImages() {
        const imageObserver = this.observers.get('images');
        if (!imageObserver) return;

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is a lazy image
                        if (node.tagName === 'IMG' && node.dataset.lazySrc) {
                            node.classList.add('lazy');
                            imageObserver.observe(node);
                        }
                        
                        // Check for lazy images within the node
                        node.querySelectorAll && node.querySelectorAll('img[data-lazy-src]').forEach(img => {
                            img.classList.add('lazy');
                            imageObserver.observe(img);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Measure page load performance
     * @private
     */
    measurePageLoad() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            
            this.performanceMetrics = {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                loadComplete: perfData.loadEventEnd - perfData.navigationStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint()
            };
            
            console.log('Performance Metrics:', this.performanceMetrics);
        });
    }

    /**
     * Monitor resource loading
     * @private
     */
    monitorResourceLoading() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 1000) { // Resources taking more than 1 second
                    console.warn('Slow resource detected:', entry.name, `${entry.duration}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * Get First Paint timing
     * @returns {number} First Paint time
     * @private
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    /**
     * Get First Contentful Paint timing
     * @returns {number} First Contentful Paint time
     * @private
     */
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
    }

    /**
     * Preload critical resources
     * @param {string[]} resources - Array of resource URLs to preload
     */
    preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            
            // Determine resource type based on extension
            if (resource.endsWith('.js')) {
                link.as = 'script';
            } else if (resource.endsWith('.css')) {
                link.as = 'style';
            } else if (resource.match(/\\.(jpg|jpeg|png|webp|gif)$/)) {
                link.as = 'image';
            }
            
            document.head.appendChild(link);
        });
    }

    /**
     * Optimize images by converting to WebP if supported
     * @param {HTMLImageElement} img - Image element
     */
    optimizeImage(img) {
        if (this.supportsWebP()) {
            const src = img.src || img.dataset.lazySrc;
            if (src && !src.includes('.webp')) {
                const webpSrc = src.replace(/\\.(jpg|jpeg|png)$/, '.webp');
                
                // Check if WebP version exists
                this.checkImageExists(webpSrc).then(exists => {
                    if (exists) {
                        if (img.dataset.lazySrc) {
                            img.dataset.lazySrc = webpSrc;
                        } else {
                            img.src = webpSrc;
                        }
                    }
                });
            }
        }
    }

    /**
     * Check if browser supports WebP
     * @returns {boolean} True if WebP is supported
     * @private
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Check if an image exists
     * @param {string} url - Image URL
     * @returns {Promise<boolean>} True if image exists
     * @private
     */
    checkImageExists(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Get current performance metrics
     * @returns {object} Performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Clear resource cache
     */
    clearCache() {
        this.resourceCache.clear();
        console.log('Resource cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.resourceCache.size,
            keys: Array.from(this.resourceCache.keys())
        };
    }

    /**
     * Cleanup observers and resources
     */
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.clearCache();
    }
}

// Global performance optimizer instance
const performanceOptimizer = new PerformanceOptimizer();

// Export for global use
window.performanceOptimizer = performanceOptimizer;

// Add lazy loading styles
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('lazy-loading-styles')) {
        const styles = document.createElement('style');
        styles.id = 'lazy-loading-styles';
        styles.textContent = `
            .lazy {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .lazy.loading {
                opacity: 0.5;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            
            .lazy.loaded {
                opacity: 1;
            }
            
            .lazy.error {
                opacity: 0.3;
                filter: grayscale(100%);
            }
            
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .loading-module {
                position: relative;
                opacity: 0.7;
            }
            
            .loading-module::after {
                content: 'Loading...';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .module-loaded {
                opacity: 1;
            }
            
            .loading-content {
                min-height: 100px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
        `;
        document.head.appendChild(styles);
    }
});

console.log('Performance Optimizer module loaded');"