document.addEventListener('DOMContentLoaded', () => {
    // Hide loader and show content
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.add('loaded');
        }, 1000); // Delay for login page to show loading effect
    }
    
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');
    const adminAccessBtn = document.getElementById('admin-access-btn');

    // Removed failedLoginAttempts and maxLoginAttempts variables
    
    // --- Interactive Particle Animation ---
    const particleContainer = document.getElementById('particle-container');
    const particles = [];
    const numParticles = 75;
    const mouse = { x: null, y: null };

    if (particleContainer) {
        // Create particles
        for (let i = 0; i < numParticles; i++) {
            const p = {
                domElement: document.createElement('div'),
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            };
            p.domElement.classList.add('particle');
            p.domElement.style.left = `${p.x}px`;
            p.domElement.style.top = `${p.y}px`;
            particleContainer.appendChild(p.domElement);
            particles.push(p);
        }

        // Track mouse movement
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        // Animation loop
        function animateParticles() {
            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                let ax = 0, ay = 0;

                // Force towards mouse
                if (mouse.x !== null) {
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 1) {
                        ax += dx / dist * 0.5; // Acceleration towards mouse
                        ay += dy / dist * 0.5;
                    }
                }

                // Add some damping/friction
                p.vx = p.vx * 0.98 + ax;
                p.vy = p.vy * 0.98 + ay;

                p.x += p.vx;
                p.y += p.vy;

                // Boundary checks
                if (p.x > window.innerWidth) p.x = 0;
                if (p.x < 0) p.x = window.innerWidth;
                if (p.y > window.innerHeight) p.y = 0;
                if (p.y < 0) p.y = window.innerHeight;

                p.domElement.style.left = `${p.x}px`;
                p.domElement.style.top = `${p.y}px`;
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Removed client-side lockout check

        const username = usernameInput.value;
        const password = passwordInput.value;
        
        // Show loading state
        loginMessage.textContent = 'Authenticating...';
        loginMessage.style.color = 'var(--light-text-color)';
        
        try {
            const authResult = await authenticateUser(username, password);
            
            if (authResult.success) {
                loginMessage.textContent = 'Authentication successful. Redirecting...';
                loginMessage.style.color = 'var(--success-color)';
                speak('Authentication successful. Redirecting to your dashboard.');

                // Store session token and user info
                localStorage.setItem('sessionToken', `token-${Date.now()}`);
                localStorage.setItem('userRole', authResult.user.role);
                localStorage.setItem('username', authResult.user.username);

                // Check for return URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                const returnUrl = urlParams.get('returnUrl');
                
                setTimeout(() => {
                    if (returnUrl && authResult.user.role === 'admin') {
                        // Redirect to the requested admin page
                        window.location.href = returnUrl;
                    } else {
                        // Default redirection
                        window.location.href = authResult.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    }
                }, 2000);
            } else {
                // Removed lockout handling
                loginMessage.textContent = authResult.message;
                loginMessage.style.color = 'var(--error-color)';
                speak(authResult.message);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            loginMessage.textContent = 'Authentication service temporarily unavailable.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Authentication service temporarily unavailable.');
        }
    });

    adminAccessBtn.addEventListener('click', () => {
        // A simple "secret" way to fill in admin credentials
        usernameInput.value = 'KAB';
        passwordInput.value = '';
        passwordInput.focus();
    });
});