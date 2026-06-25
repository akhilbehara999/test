document.addEventListener('DOMContentLoaded', () => {
    // Hide loader and show content
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.add('loaded');
        }, 1000); // Delay for login page to show loading effect
    }
    
    // Form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const signupUsernameInput = document.getElementById('signup-username');
    const signupPasswordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');
    const adminAccessBtn = document.getElementById('admin-access-btn');
    const showSignupLink = document.getElementById('show-signup');
    const showSigninLink = document.getElementById('show-signin');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    // Clear form fields on page load to ensure they start empty
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (signupUsernameInput) signupUsernameInput.value = '';
    if (signupPasswordInput) signupPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    let failedLoginAttempts = 0;
    const maxLoginAttempts = 3;

    // Toggle between signin and signup forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginMessage.textContent = '';
    });

    showSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        signinForm.style.display = 'block';
        signupMessage.textContent = '';
    });

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

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (failedLoginAttempts >= maxLoginAttempts) {
            loginMessage.textContent = 'Too many failed login attempts. Please try again later.';
            speak('Too many failed login attempts. Please try again later.');
            return;
        }

        const username = usernameInput.value;
        const password = passwordInput.value;
        
        // Show loading state
        loginMessage.textContent = 'Authenticating...';
        loginMessage.style.color = 'var(--light-text-color)';
        
        try {
            // Use data service for authentication
            const authResult = window.dataService ? 
                await window.dataService.authenticateUser(username, password) :
                await authenticateUser(username, password);
            
            if (authResult.success) {
                loginMessage.textContent = 'Authentication successful. Redirecting...';
                loginMessage.style.color = 'var(--success-color)';
                speak('Authentication successful. Redirecting to your dashboard.');

                // Store session token and user info
                localStorage.setItem('authToken', authResult.token); // Use the real JWT token
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
                if (authResult.lockout) {
                    failedLoginAttempts = maxLoginAttempts; // Trigger local lockout UI
                }
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

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = signupUsernameInput.value;
        const password = signupPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Basic validation
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match.';
            signupMessage.style.color = 'var(--error-color)';
            return;
        }
        
        if (password.length < 6) {
            signupMessage.textContent = 'Password must be at least 6 characters long.';
            signupMessage.style.color = 'var(--error-color)';
            return;
        }
        
        // Show loading state
        signupMessage.textContent = 'Creating account...';
        signupMessage.style.color = 'var(--light-text-color)';
        
        try {
            // Use data service for registration
            const registerResult = window.dataService ? 
                await window.dataService.registerUserPublic({ username, password }) :
                await registerUser(username, password);
            
            if (registerResult.success) {
                signupMessage.textContent = 'Account created successfully! Redirecting to login...';
                signupMessage.style.color = 'var(--success-color)';
                speak('Account created successfully! Redirecting to login.');
                
                // Automatically switch to login form after successful registration
                setTimeout(() => {
                    signupForm.style.display = 'none';
                    signinForm.style.display = 'block';
                    signupMessage.textContent = '';
                    
                    // Pre-fill username in login form
                    usernameInput.value = username;
                    passwordInput.focus();
                }, 2000);
            } else {
                signupMessage.textContent = registerResult.message;
                signupMessage.style.color = 'var(--error-color)';
                speak(registerResult.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            signupMessage.textContent = 'Registration service temporarily unavailable.';
            signupMessage.style.color = 'var(--error-color)';
            speak('Registration service temporarily unavailable.');
        }
    });

    // Admin access button
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', () => {
            // Pre-fill admin credentials for demo purposes
            usernameInput.value = 'KAB';
            passwordInput.value = '7013432177@akhil';
            passwordInput.focus();
        });
    }

    // Form validation helpers
    function validateField(field) {
        if (field.value.trim() === '') {
            field.style.borderColor = 'var(--error-color)';
            return false;
        } else {
            field.style.borderColor = 'var(--accent-color)';
            return true;
        }
    }

    // Add validation to form fields
    if (usernameInput) usernameInput.addEventListener('input', () => validateField(usernameInput));
    if (passwordInput) passwordInput.addEventListener('input', () => validateField(passwordInput));
    if (signupUsernameInput) signupUsernameInput.addEventListener('input', () => validateField(signupUsernameInput));
    if (signupPasswordInput) signupPasswordInput.addEventListener('input', () => validateField(signupPasswordInput));
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', () => validateField(confirmPasswordInput));

    // Authentication functions (fallback if data service is not available)
    async function authenticateUser(username, password) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: 'Authentication service unavailable'
            };
        }
    }

    async function registerUser(username, password) {
        try {
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Registration service unavailable'
            };
        }
    }
});