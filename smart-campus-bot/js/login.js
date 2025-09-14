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
    const signupForm = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');
    
    // Signup form elements
    const signupUsernameInput = document.getElementById('signup-username');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
    
    // Toggle buttons
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');

    let failedLoginAttempts = 0;
    const maxLoginAttempts = 3;

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

    // Toggle between signin and signup forms
    signinBtn.addEventListener('click', () => {
        signinBtn.classList.add('active');
        signupBtn.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginMessage.textContent = '';
    });

    signupBtn.addEventListener('click', () => {
        signupBtn.classList.add('active');
        signinBtn.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        loginMessage.textContent = '';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (failedLoginAttempts >= maxLoginAttempts) {
            loginMessage.textContent = 'Too many failed login attempts. Please try again later.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Too many failed login attempts. Please try again later.');
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;
        
        // Show loading state
        loginMessage.textContent = 'Authenticating...';
        loginMessage.style.color = 'var(--light-text-color)';
        
        try {
            const authResult = await authenticateUser(email, password);
            
            if (authResult.success) {
                loginMessage.textContent = 'Authentication successful. Redirecting...';
                loginMessage.style.color = 'var(--success-color)';
                speak('Authentication successful. Redirecting to your dashboard.');

                // Store session token and user info
                localStorage.setItem('sessionToken', `token-${Date.now()}`);
                localStorage.setItem('userRole', authResult.user.role);
                localStorage.setItem('username', authResult.user.username);
                localStorage.setItem('userId', authResult.user.id);

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

    // Handle signup form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = signupUsernameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value;
        const confirmPassword = signupConfirmPasswordInput.value;
        
        // Reset message
        loginMessage.textContent = '';
        loginMessage.style.color = 'var(--light-text-color)';
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            loginMessage.textContent = 'Please fill in all fields.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Please fill in all fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            loginMessage.textContent = 'Passwords do not match.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Passwords do not match.');
            return;
        }
        
        if (password.length < 6) {
            loginMessage.textContent = 'Password must be at least 6 characters long.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Password must be at least 6 characters long.');
            return;
        }
        
        // Show loading state
        loginMessage.textContent = 'Creating account...';
        
        try {
            const userData = {
                username: username,
                email: email,
                password: password,
                role: 'student' // Default role
            };
            
            const result = await createUser(userData);
            
            if (result.success) {
                loginMessage.textContent = result.message;
                loginMessage.style.color = 'var(--success-color)';
                speak(result.message);
                
                // Reset form
                signupForm.reset();
                
                // If user was created immediately (no email confirmation required)
                if (result.userId) {
                    // Switch to signin form after a delay
                    setTimeout(() => {
                        signinBtn.click();
                    }, 3000);
                }
            } else {
                loginMessage.textContent = result.message;
                loginMessage.style.color = 'var(--error-color)';
                speak(result.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            loginMessage.textContent = 'Account creation failed. Please try again.';
            loginMessage.style.color = 'var(--error-color)';
            speak('Account creation failed. Please try again.');
        }
    });
});