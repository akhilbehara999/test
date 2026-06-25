/**
 * @file Test suite for data.js
 * Tests user management functions including authentication, user creation, and password management
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    
    describe('Data Management Tests', () => {
        
        beforeEach(() => {
            // Clear localStorage before each test
            localStorage.removeItem('users');
        });
        
        afterEach(() => {
            // Clean up after each test
            localStorage.removeItem('users');
        });
        
        describe('User Initialization', () => {
            
            itAsync('should initialize default users', async () => {
                await initializeUsers();
                const users = getUsers();
                
                expect(users.length).toBeGreaterThan(0);
                expect(users.some(u => u.username === 'student')).toBe(true);
                expect(users.some(u => u.username === 'KAB')).toBe(true);
            });
            
            itAsync('should not reinitialize if users already exist', async () => {
                // First initialization
                await initializeUsers();
                const initialUsers = getUsers();
                
                // Second initialization
                await initializeUsers();
                const secondUsers = getUsers();
                
                expect(secondUsers.length).toBe(initialUsers.length);
            });
            
        });
        
        describe('User Retrieval and Updates', () => {
            
            itAsync('should retrieve all users', async () => {
                await initializeUsers();
                const users = getUsers();
                
                expect(Array.isArray(users)).toBe(true);
                expect(users.length).toBeGreaterThan(0);
                expect(users[0]).toHaveProperty('id');
                expect(users[0]).toHaveProperty('username');
                expect(users[0]).toHaveProperty('role');
            });
            
            itAsync('should update user data', async () => {
                await initializeUsers();
                const users = getUsers();
                const testUser = users[0];
                
                const updateData = { lastLogin: 'Updated Time' };
                updateUser(testUser.id, updateData);
                
                const updatedUsers = getUsers();
                const updatedUser = updatedUsers.find(u => u.id === testUser.id);
                
                expect(updatedUser.lastLogin).toBe('Updated Time');
            });
            
            it('should handle updates for non-existent user', () => {
                expect(() => {
                    updateUser(99999, { someField: 'value' });
                }).not.toThrow();
            });
            
        });
        
        describe('User Authentication', () => {
            
            itAsync('should authenticate valid user', async () => {
                await initializeUsers();
                
                // Test with student account
                const result = await authenticateUser('student', 'password123');
                
                expect(result.success).toBe(true);
                expect(result.user).toBeTruthy();
                expect(result.user.username).toBe('student');
                expect(result.message).toBe('Authentication successful');
            });
            
            itAsync('should reject invalid username', async () => {
                await initializeUsers();
                
                const result = await authenticateUser('nonexistent', 'password');
                
                expect(result.success).toBe(false);
                expect(result.user).toBe(null);
                expect(result.message).toBe('Invalid credentials');
            });
            
            itAsync('should reject invalid password', async () => {
                await initializeUsers();
                
                const result = await authenticateUser('student', 'wrongpassword');
                
                expect(result.success).toBe(false);
                expect(result.user).toBe(null);
                expect(result.message).toContain('Invalid credentials');
            });
            
            itAsync('should handle suspended account', async () => {
                await initializeUsers();
                
                const result = await authenticateUser('testuser', 'password');
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('Account is suspended');
            });
            
            itAsync('should implement account lockout', async () => {
                await initializeUsers();
                
                // Simulate multiple failed attempts
                for (let i = 0; i < 5; i++) {
                    await authenticateUser('student', 'wrongpassword');
                }
                
                const result = await authenticateUser('student', 'wrongpassword');
                
                expect(result.lockout).toBe(true);
                expect(result.message).toContain('locked');
            });
            
            itAsync('should reset failed attempts on successful login', async () => {
                await initializeUsers();
                
                // Fail a few times
                await authenticateUser('student', 'wrongpassword');
                await authenticateUser('student', 'wrongpassword');
                
                // Succeed
                const successResult = await authenticateUser('student', 'password123');
                expect(successResult.success).toBe(true);
                
                // Check that attempts were reset
                const users = getUsers();
                const student = users.find(u => u.username === 'student');
                expect(student.loginAttempts).toBe(0);
            });
            
        });
        
        describe('User Creation', () => {
            
            itAsync('should create new user with valid data', async () => {
                await initializeUsers();
                
                const userData = {
                    username: 'newuser',
                    password: 'StrongP@ssw0rd!',
                    role: 'student'
                };
                
                const result = await createUser(userData);
                
                expect(result.success).toBe(true);
                expect(result.message).toBe('User created successfully');
                expect(result.userId).toBeTruthy();
                
                const users = getUsers();
                const newUser = users.find(u => u.username === 'newuser');
                expect(newUser).toBeTruthy();
                expect(newUser.role).toBe('student');
            });
            
            itAsync('should reject duplicate username', async () => {
                await initializeUsers();
                
                const userData = {
                    username: 'student', // Already exists
                    password: 'StrongP@ssw0rd!',
                    role: 'student'
                };
                
                const result = await createUser(userData);
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('Username already exists');
            });
            
            itAsync('should reject weak password', async () => {
                await initializeUsers();
                
                const userData = {
                    username: 'weakuser',
                    password: '123', // Too weak
                    role: 'student'
                };
                
                const result = await createUser(userData);
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('Password too weak');
                expect(result.feedback).toBeTruthy();
            });
            
            itAsync('should sanitize username input', async () => {
                await initializeUsers();
                
                const userData = {
                    username: '<script>alert(\"xss\")</script>cleanuser',
                    password: 'StrongP@ssw0rd!',
                    role: 'student'
                };
                
                const result = await createUser(userData);
                
                if (result.success) {
                    const users = getUsers();
                    const newUser = users.find(u => u.id === result.userId);
                    expect(newUser.username).not.toContain('<script>');
                }
            });
            
        });
        
        describe('Password Management', () => {
            
            itAsync('should change user password with valid current password', async () => {
                await initializeUsers();
                
                const users = getUsers();
                const student = users.find(u => u.username === 'student');
                
                const result = await changeUserPassword(
                    student.id,
                    'password123',
                    'NewStr0ng!P@ssw0rd'
                );
                
                expect(result.success).toBe(true);
                expect(result.message).toBe('Password changed successfully');
            });
            
            itAsync('should reject password change with wrong current password', async () => {
                await initializeUsers();
                
                const users = getUsers();
                const student = users.find(u => u.username === 'student');
                
                const result = await changeUserPassword(
                    student.id,
                    'wrongcurrentpassword',
                    'NewStr0ng!P@ssw0rd'
                );
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('Current password is incorrect');
            });
            
            itAsync('should reject weak new password', async () => {
                await initializeUsers();
                
                const users = getUsers();
                const student = users.find(u => u.username === 'student');
                
                const result = await changeUserPassword(
                    student.id,
                    'password123',
                    'weak' // Too weak
                );
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('New password too weak');
            });
            
            itAsync('should handle non-existent user', async () => {
                const result = await changeUserPassword(
                    99999,
                    'currentpass',
                    'NewStr0ng!P@ssw0rd'
                );
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('User not found');
            });
            
        });
        
        describe('Password Migration', () => {
            
            itAsync('should migrate legacy passwords', async () => {
                // Set up legacy user data
                const legacyUsers = [
                    { id: 1, username: 'legacy1', role: 'student', password: 'plaintext', status: 'active' },
                    { id: 2, username: 'legacy2', role: 'admin', password: simpleHash('adminpass'), status: 'active' }
                ];
                localStorage.setItem('users', JSON.stringify(legacyUsers));
                
                await initializeUsers();
                
                const users = getUsers();
                const legacy1 = users.find(u => u.username === 'legacy1');
                const legacy2 = users.find(u => u.username === 'legacy2');
                
                // Should have passwordHash and salt, no plain password
                expect(legacy1.passwordHash).toBeTruthy();
                expect(legacy1.salt).toBeTruthy();
                expect(legacy1.password).toBeFalsy();
                
                expect(legacy2.passwordHash).toBeTruthy();
                expect(legacy2.salt).toBeTruthy();
                expect(legacy2.password).toBeFalsy();
            });
            
        });
        
    });
    
});