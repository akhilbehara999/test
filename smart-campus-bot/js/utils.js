/**
 * @deprecated Use crypto-utils.js for secure password hashing
 * Basic string hashing function (for demonstration purposes only)
 * This function is not cryptographically secure and should not be used for passwords
 */
function simpleHash(str) {
    console.warn('simpleHash is deprecated. Use hashPassword from crypto-utils.js for secure hashing');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input safe for display
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }
    
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}

/**
 * Enhanced input sanitization for HTML content
 * @param {string} input - Raw HTML input
 * @returns {string} Sanitized HTML with only safe tags
 */
function sanitizeHTML(input) {
    const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p'];
    const temp = document.createElement('div');
    temp.innerHTML = input;
    
    // Remove all script tags and event handlers
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove all elements except allowed tags
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
            element.replaceWith(...element.childNodes);
        }
        
        // Remove all attributes that could contain JavaScript
        const attributes = [...element.attributes];
        attributes.forEach(attr => {
            if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
                element.removeAttribute(attr.name);
            }
        });
    });
    
    return temp.innerHTML;
}

/**
 * Validates and sanitizes URL inputs
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
function sanitizeURL(url) {
    try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return null;
        }
        return urlObj.toString();
    } catch (error) {
        return null;
    }
}

/**
 * Validates and ensures a form field meets basic requirements
 * Adds visual feedback by applying CSS classes based on validation state
 * 
 * @param {HTMLElement} field - The form field element to validate
 * @returns {boolean} True if field contains valid non-empty content, false otherwise
 * 
 * @example
 * const emailField = document.getElementById('email');
 * if (validateField(emailField)) {
 *     console.log('Email field is valid');
 * }
 * 
 * @since 1.0.0
 * @see {@link sanitizeInput} for input sanitization
 */
function validateField(field) {
    if (field.value.trim() === '') {
        field.classList.add('not-valid');
        return false;
    } else {
        field.classList.remove('not-valid');
        return true;
    }
}

/**
 * Creates an animated bar chart on a canvas element with customizable styling
 * Renders bars with labels, values, and smooth animations for visual appeal
 * 
 * @param {string} canvasId - The ID of the canvas element to draw on
 * @param {object} chartData - The data for the chart
 * @param {string[]} chartData.labels - Array of labels for each bar
 * @param {number[]} chartData.values - Array of numeric values for each bar
 * @param {object} [options={}] - Optional configuration for colors and styling
 * @param {string} [options.barColor='#00d4ff'] - Hex color for the bars
 * @param {string} [options.labelColor='#e6f3ff'] - Hex color for text labels
 * @param {string} [options.axisColor='rgba(230, 243, 255, 0.5)'] - Color for chart axes
 * 
 * @returns {void}
 * 
 * @example
 * // Basic usage
 * drawBarChart('myCanvas', {
 *     labels: ['Jan', 'Feb', 'Mar'],
 *     values: [10, 20, 15]
 * });
 * 
 * // With custom colors
 * drawBarChart('salesChart', {
 *     labels: ['Q1', 'Q2', 'Q3', 'Q4'],
 *     values: [1000, 1500, 1200, 1800]
 * }, {
 *     barColor: '#ff6b6b',
 *     labelColor: '#ffffff'
 * });
 * 
 * @since 1.0.0
 * @throws {Error} Silently fails if canvas element is not found
 */
function drawBarChart(canvasId, chartData, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { labels, values } = chartData;
    const { barColor = '#00d4ff', labelColor = '#e6f3ff', axisColor = 'rgba(230, 243, 255, 0.5)' } = options || {};

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = (chartWidth / values.length) * 0.6;
    const barSpacing = (chartWidth / values.length) * 0.4;
    const maxValue = Math.max(...values, 1);

    // Cancel any existing animation for this canvas
    if (canvas.animationFrameId) {
        cancelAnimationFrame(canvas.animationFrameId);
    }

    let animationFraction = 0;
    const animationDuration = 1000; // 1 second
    let startTime = null;

    function drawChartFrame(fraction) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Axes
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding - 10);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding + 10, canvas.height - padding);
        ctx.stroke();

        // Draw Bars and Labels
        values.forEach((value, i) => {
            const animatedValue = value * fraction;
            const barHeight = (animatedValue / maxValue) * chartHeight;
            const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
            const y = canvas.height - padding - barHeight;

            // Bar
            ctx.fillStyle = barColor;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'center';
            ctx.font = '12px "Segoe UI"';
            ctx.fillText(labels[i], x + barWidth / 2, canvas.height - padding + 20);

            // Value on top
            ctx.font = '14px "Segoe UI"';
            ctx.fillText(Math.round(animatedValue), x + barWidth / 2, y - 8);
        });
    }

    function animationLoop(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsedTime = timestamp - startTime;
        animationFraction = elapsedTime / animationDuration;
        if (animationFraction > 1) animationFraction = 1;

        drawChartFrame(animationFraction);

        if (animationFraction < 1) {
            canvas.animationFrameId = requestAnimationFrame(animationLoop);
        }
    }

    canvas.animationFrameId = requestAnimationFrame(animationLoop);
}
